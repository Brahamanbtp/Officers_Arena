from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from pipelines.question_segmenter import RawSegmentedQuestion
from pipelines.option_reconstructor import OptionReconstructor, ReconstructedOption
from pipelines.document_representation import BoundingBox
from pipelines.math_sanitizer import MathSanitizer
from pipelines.bilingual_filter import BilingualFilter

class AssembledQuestion(BaseModel):
    question_number: int
    source_pages: List[int]
    question_text: str
    options: Dict[str, str]
    reconstructed_options: List[ReconstructedOption] = Field(default_factory=list)
    correct_answer: str = "A"
    raw_text: str = ""
    normalized_text: str = ""
    katex_text: str = ""
    bboxes: List[BoundingBox] = Field(default_factory=list)
    ocr_confidence: float = 1.0
    structure_confidence: float = 1.0
    option_confidence: float = 1.0
    cross_page_confidence: float = 1.0
    overall_confidence: float = 1.0
    is_cross_page: bool = False
    validation_flags: List[str] = Field(default_factory=list)


class CrossPageAssembler:
    """
    Cross-Page Question & Option Stitching Engine.
    Detects incomplete questions at page bottoms and attaches continuation blocks / options
    from the top of the subsequent page without orphaned fragments.
    """

    @classmethod
    def assemble_questions(
        cls,
        segmented_by_page: List[List[RawSegmentedQuestion]]
    ) -> List[AssembledQuestion]:
        """
        Stitches segmented questions across page boundaries and reconstructs complete questions.
        """
        all_raw: List[RawSegmentedQuestion] = []
        for p_list in segmented_by_page:
            all_raw.extend(p_list)

        stitched_raw: List[RawSegmentedQuestion] = []
        skip_indices = set()

        for idx, q_curr in enumerate(all_raw):
            if idx in skip_indices:
                continue

            # Check if this question is incomplete (missing expected options C, D or missing options entirely)
            opts_dict, _, opt_conf = OptionReconstructor.reconstruct_options(
                q_curr.option_lines,
                page_num=q_curr.source_pages[0] if q_curr.source_pages else 1
            )
            has_all_opts = all(opts_dict.get(k) for k in ["A", "B", "C", "D"])

            # Look ahead to see if the next raw block is a continuation or has the same question number
            if idx + 1 < len(all_raw):
                q_next = all_raw[idx + 1]
                # Case 1: Next question has same question number
                if q_next.question_number == q_curr.question_number:
                    q_curr.source_pages.extend([p for p in q_next.source_pages if p not in q_curr.source_pages])
                    q_curr.question_lines.extend(q_next.question_lines)
                    q_curr.option_lines.extend(q_next.option_lines)
                    q_curr.statement_lines.extend(q_next.statement_lines)
                    q_curr.bboxes.extend(q_next.bboxes)
                    skip_indices.add(idx + 1)
                # Case 2: Next question block has 0 or missing question text and contains remaining options
                elif not has_all_opts and len(q_next.question_lines) == 0 and len(q_next.option_lines) > 0:
                    # Check if next block provides the missing option labels (e.g. C, D)
                    next_opts, _, _ = OptionReconstructor.reconstruct_options(q_next.option_lines)
                    if any(next_opts.get(k) for k in ["C", "D"]) and not any(next_opts.get(k) for k in ["A", "B"]):
                        q_curr.source_pages.extend([p for p in q_next.source_pages if p not in q_curr.source_pages])
                        q_curr.option_lines.extend(q_next.option_lines)
                        q_curr.bboxes.extend(q_next.bboxes)
                        skip_indices.add(idx + 1)

            stitched_raw.append(q_curr)

        # Build final AssembledQuestion objects
        assembled_list: List[AssembledQuestion] = []

        for q_raw in stitched_raw:
            p_num = q_raw.source_pages[0] if q_raw.source_pages else 1
            raw_text = "\n".join(q_raw.question_lines + q_raw.option_lines)

            # Reconstruct options
            opts_dict, reconstructed_opts, opt_conf = OptionReconstructor.reconstruct_options(
                q_raw.option_lines,
                page_num=p_num,
                source_bboxes=q_raw.bboxes
            )

            # Assemble clean question body
            q_text_raw = "\n".join(q_raw.question_lines).strip()
            if not q_text_raw:
                q_text_raw = f"Question {q_raw.question_number}"

            clean_q_text = BilingualFilter.strip_hindi(q_text_raw)
            sanitized_q_text = MathSanitizer.sanitize(clean_q_text)

            is_cross = len(q_raw.source_pages) > 1
            cross_conf = 0.95 if is_cross else 1.0

            # Structural confidence
            has_4_valid_opts = all(bool(opts_dict.get(k)) for k in ["A", "B", "C", "D"])
            has_good_body = len(sanitized_q_text) >= 15
            struct_conf = 0.98 if (has_4_valid_opts and has_good_body) else (0.75 if has_good_body else 0.5)

            flags = []
            if not has_4_valid_opts:
                flags.append("MISSING_OPTION_CONTENT")
            if any(opts_dict.get(k) == k for k in ["A", "B", "C", "D"]):
                flags.append("SUSPICIOUS_OPTION_EXTRACTION")
            if len(sanitized_q_text) < 15:
                flags.append("INCOMPLETE_QUESTION")

            overall_conf = (0.3 * q_raw.confidence) + (0.3 * struct_conf) + (0.4 * opt_conf)

            assembled_list.append(
                AssembledQuestion(
                    question_number=q_raw.question_number,
                    source_pages=q_raw.source_pages,
                    question_text=sanitized_q_text,
                    options=opts_dict,
                    reconstructed_options=reconstructed_opts,
                    correct_answer="A",
                    raw_text=raw_text,
                    normalized_text=clean_q_text,
                    katex_text=sanitized_q_text,
                    bboxes=q_raw.bboxes,
                    ocr_confidence=q_raw.confidence,
                    structure_confidence=struct_conf,
                    option_confidence=opt_conf,
                    cross_page_confidence=cross_conf,
                    overall_confidence=overall_conf,
                    is_cross_page=is_cross,
                    validation_flags=flags
                )
            )

        return assembled_list
