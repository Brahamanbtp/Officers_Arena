import re
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from pipelines.document_representation import BlockIR, PageIR, BoundingBox
from pipelines.bilingual_filter import BilingualFilter
from pipelines.option_reconstructor import OptionReconstructor

class RawSegmentedQuestion(BaseModel):
    question_number: int
    source_pages: List[int]
    question_lines: List[str]
    option_lines: List[str]
    statement_lines: List[str] = Field(default_factory=list)
    raw_blocks: List[BlockIR] = Field(default_factory=list)
    bboxes: List[BoundingBox] = Field(default_factory=list)
    column_idx: int = 0
    confidence: float = 1.0


class QuestionSegmenter:
    """
    Layout-aware Question Segmentation Engine.
    Detects numerical question boundaries, statements, and option candidate regions
    while preventing false triggers on years, percentages, decimals, or statement lists.
    """

    # Matches genuine question anchors: e.g. "1.", "2)", "Q.1", "Question 1:", "101."
    Q_ANCHOR_REGEX = re.compile(
        r"^\s*(?:Q(?:uestion)?\s*[\.\:]?\s*)?(\d{1,3})\s*[\.\:\)]\s*(.*)",
        re.IGNORECASE
    )

    STATEMENT_ANCHOR_REGEX = re.compile(
        r"^\s*(\d{1,2})\s*[\.\)]\s+(.*)"
    )

    OPTION_START_REGEX = re.compile(
        r"^\s*(?:\([a-dA-D1-4]\)|\[[a-dA-D1-4]\]|[a-dA-D1-4]\s*[\.\:\)])"
    )

    @classmethod
    def is_false_question_anchor(cls, num_val: int, line_text: str) -> bool:
        """Checks if a numerical match is a false question anchor."""
        if num_val < 1 or num_val > 250:
            return True

        # Check for year (e.g. "1947.", "2024.")
        if 1900 <= num_val <= 2099:
            return True

        # Check for decimal number at start (e.g. "1.5 times")
        if re.match(r"^\s*\d+\.\d+", line_text):
            return True

        # Check for percentage (e.g. "50% of...")
        if "%" in line_text[:10]:
            return True

        return False

    @classmethod
    def segment_page_blocks(cls, page: PageIR) -> List[RawSegmentedQuestion]:
        """
        Segments sorted blocks from a single PageIR into RawSegmentedQuestion objects.
        """
        raw_questions: List[RawSegmentedQuestion] = []
        current_q: Optional[RawSegmentedQuestion] = None

        in_options_mode = False

        for blk in page.blocks:
            if blk.type in ["header", "footer", "noise"]:
                continue

            text = blk.text.strip()
            if not text:
                continue

            # Check if text is predominantly Hindi
            if BilingualFilter.contains_hindi(text):
                clean_t = BilingualFilter.strip_hindi(text)
                if not clean_t:
                    continue
                text = clean_t

            lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
            for line in lines:
                # Check for new question anchor
                q_match = cls.Q_ANCHOR_REGEX.match(line)
                
                # Check if this line is a statement inside an active multi-statement question
                is_statement = False
                if current_q and len(current_q.question_lines) > 0:
                    stmt_match = cls.STATEMENT_ANCHOR_REGEX.match(line)
                    if stmt_match:
                        stmt_num = int(stmt_match.group(1))
                        # If stmt_num is small (1-5) and question has words like "consider", "following", "statements"
                        q_context = " ".join(current_q.question_lines).lower()
                        if stmt_num in [1, 2, 3, 4, 5] and ("consider" in q_context or "following" in q_context or "statement" in q_context or "list" in q_context):
                            is_statement = True

                if q_match and not is_statement:
                    num_candidate = int(q_match.group(1))
                    if not cls.is_false_question_anchor(num_candidate, line):
                        # Finalize previous question
                        if current_q:
                            raw_questions.append(current_q)

                        # Start new question
                        current_q = RawSegmentedQuestion(
                            question_number=num_candidate,
                            source_pages=[page.page_number],
                            question_lines=[],
                            option_lines=[],
                            statement_lines=[],
                            raw_blocks=[blk],
                            bboxes=[blk.bbox] if blk.bbox else [],
                            column_idx=blk.column_idx
                        )
                        in_options_mode = False

                        rest = q_match.group(2).strip()
                        if rest:
                            # Check if the rest of line starts options immediately
                            if cls.OPTION_START_REGEX.match(rest):
                                in_options_mode = True
                                current_q.option_lines.append(rest)
                            else:
                                current_q.question_lines.append(rest)
                        continue

                # If we are inside an active question
                if current_q:
                    # Check if line marks start of options
                    if cls.OPTION_START_REGEX.match(line) or OptionReconstructor.extract_inline_options(line):
                        in_options_mode = True

                    if in_options_mode:
                        current_q.option_lines.append(line)
                    elif is_statement:
                        current_q.statement_lines.append(line)
                        current_q.question_lines.append(line)
                    else:
                        current_q.question_lines.append(line)

                    if blk.bbox and blk.bbox not in current_q.bboxes:
                        current_q.bboxes.append(blk.bbox)

        if current_q:
            raw_questions.append(current_q)

        return raw_questions
