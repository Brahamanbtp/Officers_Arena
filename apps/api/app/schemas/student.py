import uuid
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

# Extended schemas for attempts
class AttemptSubmitRequest(BaseModel):
    user_id: str = Field(..., description="Unique ID of the student.")
    subtopic_id: uuid.UUID = Field(..., description="UUID of the syllabus subtopic.")
    exam_type: str = Field(..., description="Exam type: UPSC or CDS")
    is_correct: bool = Field(..., description="Whether the answer was correct.")
    response_time: float = Field(..., description="Response time in seconds.")
    confidence_level: int = Field(..., ge=1, le=5, description="Confidence level from 1 to 5.")
    difficulty_level: Optional[int] = Field(3, ge=1, le=5, description="IRT question difficulty level from 1 to 5.")
    use_confidence: Optional[bool] = Field(True, description="Whether to apply confidence BKT weighting.")
    use_irt: Optional[bool] = Field(True, description="Whether to apply IRT difficulty BKT weighting.")

class AttemptSubmitResponse(BaseModel):
    attempt_id: uuid.UUID
    mastery_score: float
    half_life_days: float
    calibration_score: float
    average_calibration: float
    bias_type: str
    volatility: float
    stability_index: float
    feedback: Dict[str, str]

class MetaCalibrationProfile(BaseModel):
    average_calibration: float
    bias_type: str

class StudentProfileResponse(BaseModel):
    user_id: str
    exam_type: str
    subject_mastery: Dict[str, float]
    meta_calibration: MetaCalibrationProfile

class RevisionItem(BaseModel):
    subtopic_id: uuid.UUID
    mastery_score: float
    half_life_days: float
    last_practiced: str
    recall_probability: float

# Schemas for Diagnostic Onboarding
class DiagnosticAttempt(BaseModel):
    subtopic_id: uuid.UUID = Field(..., description="UUID of the subtopic.")
    is_correct: bool = Field(..., description="Attempt correctness.")
    confidence_level: int = Field(..., ge=1, le=5, description="Self-reported confidence level (1-5).")
    response_time: float = Field(..., description="Response time in seconds.")
    difficulty: int = Field(3, ge=1, le=5, description="Item difficulty (1-5).")

class DiagnosticOnboardRequest(BaseModel):
    user_id: str = Field(..., description="Unique student identifier.")
    exam_type: str = Field(..., description="UPSC or CDS")
    attempts: List[DiagnosticAttempt] = Field(..., description="List of 10 diagnostic attempts.")

class DiagnosticSubtopicInit(BaseModel):
    subtopic_id: str
    baseline_mastery: float
    initial_half_life_days: float

class DiagnosticOnboardResponse(BaseModel):
    user_id: str
    exam_type: str
    initialized_subtopics_count: int
    subtopics: List[DiagnosticSubtopicInit]

# Schemas for Mastery Galaxy Visualization
class GalaxyNode(BaseModel):
    id: str
    name: str
    level: str
    parent_topic: str
    subject: str
    x: float
    y: float
    size: float
    color: str
    mastery: float
    retention: float

class GalaxyEdge(BaseModel):
    source: str
    target: str
    type: str

class MasteryGalaxyResponse(BaseModel):
    user_id: str
    exam_type: str
    nodes: List[GalaxyNode]
    edges: List[GalaxyEdge]

# Schemas for Fragile Learning Alerts
class FragileAlertItem(BaseModel):
    subtopic_id: uuid.UUID
    subtopic_name: str
    mastery_score: float
    volatility: float
    stability_index: float
    feedback: str
