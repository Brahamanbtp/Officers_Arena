from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class QuestionIngestSchema(BaseModel):
    text: str = Field(..., description="Markdown text of the question with LaTeX math inside $ or $$. If there are images, keep the [IMAGE_REF:uuid] placeholder.")
    options: Dict[str, str] = Field(..., description="Dict of options, e.g. {'A': 'Option A text', 'B': 'Option B text'}")
    correct_answer: str = Field(..., description="The correct option key, e.g. 'A', 'B', 'C', or 'D'")
    explanation: Optional[str] = Field(None, description="Detailed explanation of the solution.")
    year: Optional[int] = Field(None, description="The year of the question paper.")
    difficulty: Optional[str] = Field("Medium", description="Difficulty level: Easy, Medium, Hard")
    cognitive_level: Optional[str] = Field("Understanding", description="Cognitive levels: Remembering, Understanding, Applying, Analyzing, Evaluating, Creating")
    exam_type: str = Field(..., description="Exam type: UPSC or CDS")
    image_refs: List[str] = Field(default_factory=list, description="List of image UUIDs referenced in this question.")
    language_type: Optional[str] = Field("english", description="The primary language of the question (e.g., english, hindi)")

class ExtractedQuestionsResponse(BaseModel):
    questions: List[QuestionIngestSchema] = Field(..., description="List of extracted and structured questions.")

# Compatibility alias
QuestionCreate = QuestionIngestSchema
