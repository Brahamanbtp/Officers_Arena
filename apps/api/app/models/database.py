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
    __tablename__: Any = "syllabus"

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


class Questions(SQLModel, table=True):
    __tablename__: Any = "questions"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    text: str = Field(index=False)
    options: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(SafeJSONB, nullable=False))
    correct_answer: str = Field(nullable=False)
    explanation: Optional[str] = Field(default=None)
    
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
    paper_type: str = Field(default="PYQ", index=True)
    subject: Optional[str] = Field(default="English", index=True)
    cognitive_level: Optional[str] = Field(default=None, index=True)  # "Remembering", "Understanding", "Applying", "Analyzing", "Evaluating", "Creating"
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
    __tablename__: Any = "question_images"

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

# Compatibility aliases
Question = Questions
QuestionImage = QuestionImages
