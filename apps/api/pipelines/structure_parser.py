import re
from typing import List, Dict, Any, Optional
from pipelines.math_sanitizer import MathSanitizer

class StructuredQuestionDraft:
    def __init__(self, question_number: int, question_text: str, statements: List[str], options: Dict[str, str], raw_text: str, normalized_text: str, katex_text: str, structure_confidence: float):
        self.question_number = question_number
        self.question_text = question_text
        self.statements = statements
        self.options = options
        self.raw_text = raw_text
        self.normalized_text = normalized_text
        self.katex_text = katex_text
        self.structure_confidence = structure_confidence

class DeterministicStructureParser:
    """
    Local deterministic regex structure parser for exam papers.
    Splits raw page text into structured question draft objects in milliseconds 
    without relying on cloud LLM calls.
    """

    Q_REGEX = re.compile(r"^\s*(?:Q(?:uestion)?\s*[\.\:]?\s*)?(\d{1,3})\s*[\.\:\)]\s*(.*)", re.IGNORECASE)
    OPT_REGEX = re.compile(r"[\(\[\{]?([a-dA-D])[\)\]\}]?\s*[\.\:]?\s*(.*)")

    @classmethod
    def parse_page_text(cls, page_text: str) -> List[StructuredQuestionDraft]:
        if not page_text or len(page_text.strip()) == 0:
            return []

        lines = [line.strip() for line in page_text.splitlines() if line.strip()]
        questions: List[StructuredQuestionDraft] = []

        current_q_num: Optional[int] = None
        current_q_lines: List[str] = []
        current_options: Dict[str, str] = {}
        current_statements: List[str] = []

        def finalize_question():
            nonlocal current_q_num, current_q_lines, current_options, current_statements
            if current_q_num is None or not current_q_lines:
                return

            raw_text = "\n".join(current_q_lines)
            normalized_text = MathSanitizer.repair_formfeed_and_fractions(raw_text)
            katex_text = MathSanitizer.sanitize(normalized_text)

            # Ensure all 4 options exist with fallback
            norm_opts = {
                "A": current_options.get("A", current_options.get("a", "Option A")),
                "B": current_options.get("B", current_options.get("b", "Option B")),
                "C": current_options.get("C", current_options.get("c", "Option C")),
                "D": current_options.get("D", current_options.get("d", "Option D")),
            }
            sanitized_opts = MathSanitizer.sanitize_options(norm_opts)

            # Calculate structure confidence
            has_4_opts = len(current_options) >= 4
            has_q_text = len(normalized_text) > 15
            struct_conf = 0.95 if (has_4_opts and has_q_text) else (0.75 if has_q_text else 0.5)

            questions.append(
                StructuredQuestionDraft(
                    question_number=current_q_num,
                    question_text=katex_text,
                    statements=current_statements,
                    options=sanitized_opts,
                    raw_text=raw_text,
                    normalized_text=normalized_text,
                    katex_text=katex_text,
                    structure_confidence=struct_conf
                )
            )

            current_q_num = None
            current_q_lines = []
            current_options = {}
            current_statements = []

        for line in lines:
            # Check for new question start
            q_match = cls.Q_REGEX.match(line)
            if q_match:
                finalize_question()
                current_q_num = int(q_match.group(1))
                rest = q_match.group(2).strip()
                if rest:
                    current_q_lines.append(rest)
                continue

            if current_q_num is not None:
                # Check for option match: (a) ..., (b) ..., (c) ..., (d) ...
                opt_match = cls.OPT_REGEX.match(line)
                if opt_match and len(line) < 150:
                    label = opt_match.group(1).upper()
                    val = opt_match.group(2).strip()
                    current_options[label] = val
                    continue

                # Check for statement line: 1. ..., 2. ...
                stmt_match = re.match(r"^\s*(\d{1,2})\s*[\.\)]\s*(.*)", line)
                if stmt_match and "which of" not in line.lower() and "consider" not in line.lower():
                    current_statements.append(stmt_match.group(2).strip())

                current_q_lines.append(line)

        finalize_question()
        return questions
