import re
from typing import Dict, Any, List, Tuple, Optional
from app.models.database import Questions
from pipelines.final_validator import FinalValidator, FinalValidationResult

class ContentClassification:
    SIMPLE = "SIMPLE"
    COMPLEX = "COMPLEX"
    MATH_HEAVY = "MATH_HEAVY"
    TABLE_HEAVY = "TABLE_HEAVY"
    IMAGE_HEAVY = "IMAGE_HEAVY"
    AMBIGUOUS = "AMBIGUOUS"

class ValidationResult:
    def __init__(self, is_valid: bool, status: str, errors: List[str], confidence: float, flags: Optional[List[str]] = None):
        self.is_valid = is_valid
        self.status = status  # "VERIFIED" or "NEEDS_REVIEW"
        self.errors = errors
        self.confidence = confidence
        self.flags = flags or []

class QualityController:
    """
    Evaluates quality metrics across OCR, structure, math, and options.
    Classifies content for cloud routing and performs final deterministic validation.
    """

    @classmethod
    def classify_content(cls, text: str, options: Dict[str, Any]) -> str:
        if not text:
            return ContentClassification.AMBIGUOUS

        has_math = bool(re.search(r"[\$\\\\\^\_\{}]|\\frac|\\sqrt|\\int|\\sum", text))
        has_table = "table" in text.lower() or "\t" in text or "|" in text
        has_statements = bool(re.search(r"\bstatement[s]?\b|\b1\.\s+.*\b2\.\s+.*", text, re.IGNORECASE))

        if has_table:
            return ContentClassification.TABLE_HEAVY
        elif has_math:
            return ContentClassification.MATH_HEAVY
        elif has_statements or len(text) > 400:
            return ContentClassification.COMPLEX
        else:
            return ContentClassification.SIMPLE

    @classmethod
    def compute_composite_confidence(
        cls,
        ocr_conf: float = 1.0,
        struct_conf: float = 1.0,
        opt_conf: float = 1.0,
        cross_conf: float = 1.0,
        verif_conf: float = 1.0
    ) -> float:
        """Computes weighted multi-dimensional overall confidence."""
        return (
            0.25 * ocr_conf +
            0.25 * struct_conf +
            0.30 * opt_conf +
            0.10 * cross_conf +
            0.10 * verif_conf
        )

    @classmethod
    def validate_question(cls, question: Questions) -> ValidationResult:
        ocr_c = question.ocr_confidence or 0.8
        struct_c = question.structure_confidence or 0.8
        opt_c = question.option_confidence or 0.8
        cross_c = question.cross_page_confidence or 1.0
        verif_c = question.verification_confidence or 1.0

        overall_conf = cls.compute_composite_confidence(ocr_c, struct_c, opt_c, cross_c, verif_c)
        ans = question.final_answer or question.official_answer or question.ai_proposed_answer or question.correct_answer

        res = FinalValidator.validate(
            question_text=question.text,
            options=question.options or {},
            question_number=question.question_number,
            overall_confidence=overall_conf,
            answer_key=ans
        )

        return ValidationResult(
            is_valid=res.is_verified,
            status=res.status,
            errors=res.errors,
            confidence=res.confidence,
            flags=res.flags
        )
