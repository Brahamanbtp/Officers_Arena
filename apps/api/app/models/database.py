import uuid
import json
from typing import List, Optional, Dict, Any, ClassVar
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy.types import TypeDecorator, TEXT, JSON

class SafeVector(TypeDecorator):
    """
    A robust type decorator that uses pgvector's Vector type on PostgreSQL,
    and falls back to serialized TEXT representation on SQLite.
    """
    impl = TEXT
    cache_ok = True

    def __init__(self, dimensions: int = 1536):
        self.dimensions = dimensions
        super().__init__()

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from pgvector.sqlalchemy import Vector
            return dialect.type_descriptor(Vector(self.dimensions))
        else:
            return dialect.type_descriptor(TEXT)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        # For non-postgres (like SQLite), serialize list to JSON string
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        # For non-postgres, deserialize JSON string back to list
        try:
            return json.loads(value)
        except Exception:
            return value


class SafeJSONB(TypeDecorator):
    """
    A robust type decorator that uses PostgreSQL's JSONB type on PostgreSQL,
    and falls back to standard JSON on SQLite.
    """
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import JSONB
            return dialect.type_descriptor(JSONB)
        else:
            return dialect.type_descriptor(JSON)


class Syllabus(SQLModel, table=True):
    __tablename__ = "syllabus"  # type: ignore

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    name: str = Field(index=True)
    parent_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="syllabus.id"
    )
    exam_type: str = Field(index=True)  # "UPSC" or "CDS"
    level: str = Field(index=True)      # "Subject", "Topic", or "Subtopic"

    # Relationships
    questions: List["Questions"] = Relationship(back_populates="subtopic")


from enum import Enum

class IngestionJobStatus(str, Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    PROCESSING_LOCAL = "PROCESSING_LOCAL"
    DRAFT_READY = "DRAFT_READY"
    CLOUD_REVIEW = "CLOUD_REVIEW"
    VERIFYING = "VERIFYING"
    VERIFIED = "VERIFIED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    RETRYING = "RETRYING"
    WAITING_FOR_PROVIDER = "WAITING_FOR_PROVIDER"
    FAILED_RETRYABLE = "FAILED_RETRYABLE"
    FAILED_PERMANENT = "FAILED_PERMANENT"


class Questions(SQLModel, table=True):
    __tablename__ = "questions"  # type: ignore

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    text: str = Field(index=False)
    options: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(SafeJSONB, nullable=False))
    correct_answer: str = Field(nullable=False)
    explanation: Optional[str] = Field(default=None)
    
    # Audit & Multi-Stage Transformations
    raw_text: Optional[str] = Field(default=None)
    normalized_text: Optional[str] = Field(default=None)
    katex_text: Optional[str] = Field(default=None)
    official_answer: Optional[str] = Field(default=None)
    ai_proposed_answer: Optional[str] = Field(default=None)
    final_answer: Optional[str] = Field(default=None)
    answer_source: Optional[str] = Field(default="AI_DERIVED")  # "OFFICIAL_SOURCE", "AI_DERIVED", "NEEDS_REVIEW"
    
    # Granular Confidence metrics
    ocr_confidence: Optional[float] = Field(default=1.0)
    structure_confidence: Optional[float] = Field(default=1.0)
    question_confidence: Optional[float] = Field(default=1.0)
    option_confidence: Optional[float] = Field(default=1.0)
    cross_page_confidence: Optional[float] = Field(default=1.0)
    verification_confidence: Optional[float] = Field(default=1.0)
    overall_confidence: Optional[float] = Field(default=1.0)
    
    # Provenance & Versioning
    source_pages: Optional[List[int]] = Field(default_factory=list, sa_column=Column(SafeJSONB, nullable=True))
    source_bboxes: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(SafeJSONB, nullable=True))
    pipeline_version: Optional[str] = Field(default="2.0.0")
    ocr_version: Optional[str] = Field(default=None)

    # Provider Audit
    ocr_provider: Optional[str] = Field(default=None)
    review_provider: Optional[str] = Field(default=None)
    verification_status: Optional[str] = Field(default="DRAFT_READY", index=True)

    # Vector column representing question + image embedding
    embedding: Optional[List[float]] = Field(
        default=None,
        sa_column=Column(SafeVector(1536), nullable=True)
    )
    
    subtopic_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="syllabus.id"
    )
    year: Optional[int] = Field(default=None, index=True)
    session: Optional[str] = Field(default=None, index=True)  # "I" or "II" for CDS
    question_number: Optional[int] = Field(default=None, index=True)
    paper_type: str = Field(default="PYQ", index=True)
    subject: Optional[str] = Field(default="English", index=True)
    cognitive_level: Optional[str] = Field(default=None, index=True)
    exam_type: str = Field(index=True)  # "UPSC" or "CDS"
    is_verified: bool = Field(default=False, index=True)
    raw_llm_response: Optional[str] = Field(default=None)
    language_type: str = Field(default="english", index=True)

    # IRT Parameters
    difficulty_b: Optional[float] = Field(default=0.0, sa_column_kwargs={"index": True})
    discrimination_a: Optional[float] = Field(default=1.0, sa_column_kwargs={"index": True})
    guessing_c: Optional[float] = Field(default=0.25, sa_column_kwargs={"index": True})

    # Relationships
    subtopic: Optional[Syllabus] = Relationship(back_populates="questions")
    images: List["QuestionImages"] = Relationship(
        back_populates="question",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class QuestionImages(SQLModel, table=True):
    __tablename__ = "question_images"  # type: ignore

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    question_id: uuid.UUID = Field(
        foreign_key="questions.id"
    )
    file_path: str = Field(nullable=False)
    description: Optional[str] = Field(default=None)

    # Relationships
    question: Questions = Relationship(back_populates="images")


class IngestionJob(SQLModel, table=True):
    __tablename__ = "ingestion_jobs"  # type: ignore

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    filename: str = Field(index=True)
    file_path: str = Field(nullable=False)
    file_hash: Optional[str] = Field(default=None, index=True)  # SHA-256 hash for deduplication
    mime_type: Optional[str] = Field(default="application/pdf")
    file_size: Optional[int] = Field(default=0)
    year: int = Field(index=True)
    session: str = Field(index=True)
    subject: str = Field(index=True)
    exam_type: str = Field(default="CDS", index=True)
    total_pages: int = Field(default=0)
    processed_pages: int = Field(default=0)
    extracted_count: int = Field(default=0)
    verified_count: int = Field(default=0)
    needs_review_count: int = Field(default=0)
    current_stage: Optional[str] = Field(default="QUEUED")
    status: str = Field(default=IngestionJobStatus.QUEUED.value, index=True)
    error_message: Optional[str] = Field(default=None)

    pages: List["IngestionPageQueue"] = Relationship(
        back_populates="job",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class IngestionPageQueue(SQLModel, table=True):
    __tablename__ = "ingestion_page_queue"  # type: ignore

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    job_id: uuid.UUID = Field(foreign_key="ingestion_jobs.id", index=True)
    page_num: int = Field(index=True)
    status: str = Field(default="queued", index=True)
    attempts: int = Field(default=0)
    provider_used: Optional[str] = Field(default=None)
    raw_ocr: Optional[str] = Field(default=None)
    error_message: Optional[str] = Field(default=None)

    job: IngestionJob = Relationship(back_populates="pages")


# Compatibility aliases
Question = Questions
QuestionImage = QuestionImages



