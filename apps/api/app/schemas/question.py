from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Any

class QuestionIngestSchema(BaseModel):
    text: str = Field(..., description="Markdown text of the question with LaTeX math inside $ or $$. If there are images, keep the [IMAGE_REF:uuid] placeholder.")
    options: Dict[str, str] = Field(..., description="Dict of options, e.g. {'A': 'Option A text', 'B': 'Option B text'}")
    correct_answer: str = Field(..., description="The correct option key, e.g. 'A', 'B', 'C', or 'D'")
    explanation: Optional[str] = Field(None, description="Detailed explanation of the solution.")
    year: Optional[int] = Field(None, description="The year of the question paper.")
    session: Optional[str] = Field(None, description="The examination session: 'I' or 'II' (for CDS).")
    difficulty: Optional[str] = Field("Medium", description="Difficulty level: Easy, Medium, Hard")
    cognitive_level: Optional[str] = Field("Understanding", description="Cognitive levels: Remembering, Understanding, Applying, Analyzing, Evaluating, Creating")
    exam_type: str = Field(..., description="Exam type: UPSC or CDS")
    image_refs: List[str] = Field(default_factory=list, description="List of image UUIDs referenced in this question.")
    language_type: Optional[str] = Field("english", description="The primary language of the question (e.g., english, hindi)")

    @field_validator("session")
    @classmethod
    def validate_session(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if clean in ("I", "1", "FIRST"):
            return "I"
        elif clean in ("II", "2", "SECOND"):
            return "II"
        elif clean == "":
            return None
        raise ValueError(f"Invalid session '{v}'. CDS session must be 'I' or 'II'.")

class ExtractedQuestionsResponse(BaseModel):
    questions: List[QuestionIngestSchema] = Field(..., description="List of extracted and structured questions.")

# Compatibility alias
QuestionCreate = QuestionIngestSchema

