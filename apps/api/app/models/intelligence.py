import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class TopicTrends(SQLModel, table=True):
    __tablename__ = "topic_trends"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    topic_id: uuid.UUID = Field(
        foreign_key="syllabus.id",
        index=True,
        nullable=False
    )
    year: int = Field(index=True, nullable=False)
    exam_type: str = Field(index=True, nullable=False)  # "UPSC" or "CDS"
    freq_count: int = Field(default=0, nullable=False)
    priority_score: float = Field(default=0.0, nullable=False)
    drift_index: float = Field(default=0.0, nullable=False)
    
    # Evolved/Enhanced Exam Intelligence Fields
    cross_exam_factor: float = Field(default=1.0, nullable=False)  # CdS-to-UPSC indicator boost
    expert_weight: float = Field(default=1.0, nullable=False)  # SME weight multiplier
    expert_note: Optional[str] = Field(default=None, nullable=True)  # SME feedback audit trail
    ai_reasoning: Optional[str] = Field(default=None, nullable=True)  # XAI explanation string

class CostLogs(SQLModel, table=True):
    __tablename__ = "cost_logs"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    task_name: str = Field(index=True, nullable=False)
    model_id: str = Field(nullable=False)
    prompt_tokens: int = Field(default=0, nullable=False)
    completion_tokens: int = Field(default=0, nullable=False)
    tokens_used: int = Field(default=0, nullable=False)  # prompt_tokens + completion_tokens
    cost_usd: float = Field(default=0.0, nullable=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False
    )

class EvalResults(SQLModel, table=True):
    __tablename__ = "eval_results"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    experiment_name: str = Field(index=True, nullable=False)
    faithfulness_score: float = Field(default=0.0, nullable=False)
    accuracy_score: float = Field(default=0.0, nullable=False)
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False
    )
