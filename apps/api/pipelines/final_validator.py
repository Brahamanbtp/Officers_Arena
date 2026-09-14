import re
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

class FinalValidationResult(BaseModel):
    is_verified: bool
    status: str  # "VERIFIED" or "NEEDS_REVIEW"
    confidence: float
    flags: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class FinalValidator:
    """
    Deterministic Final Quality Gate.
    Guarantees that questions marked VERIFIED strictly meet all production criteria.
    Treats NEEDS_REVIEW as a successful safety outcome to prevent silent data fabrication.
    """

    CONFIDENCE_THRESHOLD = 0.80

    @classmethod
    def validate(
        cls,
        question_text: str,
        options: Dict[str, Any],
        question_number: Optional[int] = None,
        overall_confidence: float = 1.0,
        answer_key: Optional[str] = None
    ) -> FinalValidationResult:
        errors = []
        flags = []

        # 1. Question Text Non-Empty & Length
        if not question_text or len(question_text.strip()) < 15:
            errors.append("Question text is empty or too short (< 15 characters)")
            flags.append("INCOMPLETE_QUESTION")

        # 2. Question Number Validity
        if question_number is not None and (question_number < 1 or question_number > 250):
            errors.append(f"Invalid question number anchor: {question_number}")
            flags.append("INVALID_QUESTION_NUMBER")

        # 3. All 4 Options (A, B, C, D) Present & Non-Empty
        opts = options or {}
        missing_opts = [k for k in ["A", "B", "C", "D"] if not str(opts.get(k, "")).strip()]
        if missing_opts:
            errors.append(f"Missing option content for labels: {', '.join(missing_opts)}")
            flags.append("MISSING_OPTION_CONTENT")

        # 4. Critical Option-Label Bug Prevention (Option content must not equal label or placeholder)
        for lbl in ["A", "B", "C", "D"]:
            val = str(opts.get(lbl, "")).strip()
            if val.upper() == lbl:
                errors.append(f"Option {lbl} content equals its label ('{lbl}')")
                flags.append("SUSPICIOUS_OPTION_EXTRACTION")
            elif val.lower().startswith(f"option {lbl.lower()}"):
                errors.append(f"Option {lbl} contains default placeholder text ('{val}')")
                flags.append("PLACEHOLDER_OPTION_DETECTED")

        # 5. KaTeX Syntax Integrity (Balanced $ delimiters)
        if question_text and question_text.count("$") % 2 != 0:
            errors.append("Unbalanced KaTeX math '$' delimiters in question text")
            flags.append("UNBALANCED_KATEX_MATH")

        # 6. Answer Key Validity
        if answer_key:
            norm_ans = answer_key.upper().strip()
            if norm_ans not in ["A", "B", "C", "D"]:
                errors.append(f"Invalid answer key: '{answer_key}'")
                flags.append("INVALID_ANSWER_KEY")

        # 7. Confidence Score Check
        if overall_confidence < cls.CONFIDENCE_THRESHOLD:
            errors.append(f"Overall confidence ({overall_confidence:.2f}) is below threshold ({cls.CONFIDENCE_THRESHOLD})")
            flags.append("LOW_CONFIDENCE")

        is_verified = (len(errors) == 0) and (overall_confidence >= cls.CONFIDENCE_THRESHOLD)
        status = "VERIFIED" if is_verified else "NEEDS_REVIEW"

        return FinalValidationResult(
            is_verified=is_verified,
            status=status,
            confidence=round(overall_confidence, 2),
            flags=flags,
            errors=errors
        )
