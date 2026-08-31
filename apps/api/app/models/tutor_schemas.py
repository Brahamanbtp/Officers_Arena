from pydantic import BaseModel, Field
from typing import List, Optional

class SourceCitation(BaseModel):
    id: str
    source_book: str
    page_number: int
    chapter_title: str
    text_chunk: str

class TutorResponse(BaseModel):
    explanation: str
    sources: List[SourceCitation]
    confidence_score: float
    suggested_next_steps: List[str]

class ErrorAnalysis(BaseModel):
    error_category: str  # "Calculation" | "Formula" | "Conceptual" | "Factual"
    identified_gap: str
    recommendation: str

class SyllabusNode(BaseModel):
    id: str
    name: str
    level: str  # "Subject" | "Topic" | "Subtopic"
    parent_id: Optional[str] = None


class ExplainRequest(BaseModel):
    question_id: str
    user_id: str


class AnalyzeErrorRequest(BaseModel):
    question_id: str
    user_answer: str
    user_id: str


class TutorChatRequest(BaseModel):
    question_id: Optional[str] = None
    user_id: str
    message: str

