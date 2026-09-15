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
    Enforces monotonic question progression to eliminate sub-statement collisions.
    """

    # Matches genuine question anchors: e.g. "1.", "2)", "Q.1", "Question 1:", "101."
    Q_ANCHOR_REGEX = re.compile(
        r"^\s*(?:Q(?:uestion)?\s*[\.\:]?\s*)?(\d{1,3})\s*[\.\:\)]\s*(.*)",
        re.IGNORECASE
    )

    STATEMENT_ANCHOR_REGEX = re.compile(
        r"^\s*(?:Statement\s+[I|V|X\d]+|Assertion\s*\([A-Z]\)|Reason\s*\([A-Z]\)|List\s*[-–—]?\s*[I|V|X\d]+|\(?\b(?:[i|v|x]+|\d{1,2})\b\s*[\.\)]\s+)(.*)",
        re.IGNORECASE
    )

    OPTION_START_REGEX = re.compile(
        r"^\s*(?:\([a-dA-D1-4]\)|\[[a-dA-D1-4]\]|[a-dA-D1-4]\s*[\.\:\)])"
    )

    DIRECTIONS_REGEX = re.compile(
        r"^\s*(?:Directions?|PASSAGE\s+[I|V|X\d]+|Read\s+the\s+following)\b",
        re.IGNORECASE
    )

    @classmethod
    def is_false_question_anchor(cls, num_val: int, line_text: str, current_q_num: Optional[int] = None) -> bool:
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

        # Sequence monotonicity: If we are already on Question N (e.g. Q15),
        # a line with "1." or "2." is a statement or sub-item, not a jump backwards to Q1/Q2.
        if current_q_num is not None and current_q_num > 0:
            # New question must be sequential or close (e.g. current_q_num + 1 to current_q_num + 3)
            # It cannot go backwards, and cannot skip more than 5 numbers without explicit 'Question' label
            if num_val <= current_q_num:
                return True
            if num_val > current_q_num + 5 and not re.match(r"^\s*Q(?:uestion)?\b", line_text, re.IGNORECASE):
                return True

        return False

    @classmethod
    def segment_page_blocks(cls, page: PageIR) -> List[RawSegmentedQuestion]:
        """
        Segments sorted blocks from a single PageIR into RawSegmentedQuestion objects.
        """
        raw_questions: List[RawSegmentedQuestion] = []
        current_q: Optional[RawSegmentedQuestion] = None
        current_directions: str = ""

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
                # Check for Directions or Passage headers
                if cls.DIRECTIONS_REGEX.match(line):
                    current_directions = line
                    if current_q and len(current_q.question_lines) == 0:
                        current_q.question_lines.append(line)
                    continue

                # Check if this line is an explicit statement inside an active multi-statement question
                is_statement = False
                if current_q and len(current_q.question_lines) > 0:
                    stmt_match = cls.STATEMENT_ANCHOR_REGEX.match(line)
                    if stmt_match:
                        is_statement = True

                # Check for new question anchor
                q_match = cls.Q_ANCHOR_REGEX.match(line)
                
                if q_match and not is_statement:
                    num_candidate = int(q_match.group(1))
                    curr_num = current_q.question_number if current_q else None
                    if not cls.is_false_question_anchor(num_candidate, line, curr_num):
                        # Finalize previous question
                        if current_q:
                            raw_questions.append(current_q)

                        # Start new question
                        q_init_lines = [current_directions] if current_directions and "PASSAGE" in current_directions.upper() else []
                        current_q = RawSegmentedQuestion(
                            question_number=num_candidate,
                            source_pages=[page.page_number],
                            question_lines=q_init_lines,
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
                            if cls.OPTION_START_REGEX.match(rest) or OptionReconstructor.extract_inline_options(rest):
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
