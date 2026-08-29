import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class StudentAttempt(SQLModel, table=True):
    __tablename__ = "student_attempts"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, nullable=False)
    subtopic_id: uuid.UUID = Field(
        foreign_key="syllabus.id",
        index=True,
        nullable=False
    )
    exam_type: str = Field(index=True, nullable=False)  # "UPSC" or "CDS"
    is_correct: bool = Field(nullable=False)
    response_time: float = Field(nullable=False)  # Response time in seconds
    confidence_level: int = Field(nullable=False)  # Scale from 1 to 5
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False
    )
    # Advanced Schema Evolution Fields
    difficulty_weight: float = Field(default=1.0, nullable=False)  # IRT weight
    calibration_impact: float = Field(default=0.0, nullable=False)  # Confidence weight impact

class StudentMastery(SQLModel, table=True):
    __tablename__ = "student_mastery"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, nullable=False)
    subtopic_id: uuid.UUID = Field(
        foreign_key="syllabus.id",
        index=True,
        nullable=False
    )
    exam_type: str = Field(index=True, nullable=False)  # "UPSC" or "CDS"
    mastery_score: float = Field(default=0.15, nullable=False)  # BKT probability of mastery
    half_life: float = Field(default=1.0, nullable=False)  # Spaced repetition half-life in days
    last_practiced: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False
    )
    stability_factor: float = Field(default=2.0, nullable=False)
    # Advanced Schema Evolution Fields
    volatility: float = Field(default=0.0, nullable=False)  # Swings in score
    stability_index: float = Field(default=1.0, nullable=False)  # Mastery longevity index
    # Volatility Monitor Fields
    is_fragile: bool = Field(default=False, nullable=False, index=True)
    needs_deep_review: bool = Field(default=False, nullable=False, index=True)
    last_alert_sent: Optional[datetime] = Field(default=None, nullable=True)

class MetacognitiveStats(SQLModel, table=True):
    __tablename__ = "metacognitive_stats"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, nullable=False)
    exam_type: str = Field(index=True, nullable=False)  # "UPSC" or "CDS"
    average_calibration: float = Field(default=0.0, nullable=False)
    bias_type: str = Field(default="Calibrated", nullable=False)  # "Overconfident", "Underconfident", "Calibrated"

class StudentState(SQLModel, table=True):
    __tablename__ = "student_state"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, sa_column_kwargs={"unique": True}, nullable=False)
    theta: float = Field(default=0.0, nullable=False)
    total_answered: int = Field(default=0, nullable=False)
    is_adaptive: bool = Field(default=True, nullable=False)
    last_updated: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class PerformanceLog(SQLModel, table=True):
    __tablename__ = "performance_log"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, nullable=False)
    question_id: uuid.UUID = Field(foreign_key="questions.id", index=True, nullable=False)
    is_correct: bool = Field(nullable=False)
    response_time: float = Field(nullable=False)
    confidence_level: int = Field(nullable=False)
    timestamp: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class SRSMetadata(SQLModel, table=True):
    __tablename__ = "srs_metadata"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, nullable=False)
    question_id: uuid.UUID = Field(foreign_key="questions.id", index=True, nullable=False)
    stability: float = Field(default=2.0, nullable=False)
    difficulty: float = Field(default=3.0, nullable=False)
    interval: float = Field(default=1.0, nullable=False)  # Interval in days
    due_date: datetime = Field(default_factory=datetime.utcnow, index=True, nullable=False)
    last_review: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class TopicMastery(SQLModel, table=True):
    __tablename__ = "topic_mastery"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, nullable=False)
    topic_name: str = Field(index=True, nullable=False)
    p_mastery: float = Field(default=0.15, nullable=False)
    p_transit: float = Field(default=0.10, nullable=False)


class UserActivityLog(SQLModel, table=True):
    __tablename__ = "user_activity_logs"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, nullable=False)
    topic_id: uuid.UUID = Field(foreign_key="syllabus.id", index=True, nullable=False)
    timestamp: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class TutorChatSession(SQLModel, table=True):
    __tablename__ = "tutor_chat_sessions"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    user_id: str = Field(index=True, nullable=False)
    question_id: uuid.UUID = Field(foreign_key="questions.id", index=True, nullable=False)
    messages: str = Field(default="[]", nullable=False)  # JSON-serialized list of messages
    last_updated: datetime = Field(default_factory=datetime.utcnow, nullable=False)




