import os
import uuid
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from app.core.database import get_async_session, engine
from app.models.database import IngestionJob, Questions, IngestionJobStatus
from pipelines.ingestion_engine import IngestionEngine

router = APIRouter()

class ParsedQuestionSchema(BaseModel):
    id: Optional[str] = None
    question_number: Optional[int] = None
    content: str = Field(..., description="Extracted question text")
    options: Dict[str, Any] = Field(..., description="Options dictionary {A, B, C, D}")
    correct_answer: str = Field(default="A", description="Correct answer choice")
    explanation: Optional[str] = Field(default=None)
    ocr_confidence: float = Field(default=1.0)
    structure_confidence: float = Field(default=1.0)
    overall_confidence: float = Field(default=1.0)
    is_verified: bool = Field(default=False)
    verification_status: str = Field(default="DRAFT_READY")
    source_pages: List[int] = Field(default_factory=list)

class IngestionUploadResponse(BaseModel):
    job_id: str
    status: str
    filename: str
    total_pages: int
    extracted_count: int
    message: str

class IngestionStatusResponse(BaseModel):
    job_id: str
    filename: str
    status: str
    total_pages: int
    processed_pages: int
    extracted_count: int
    verified_count: int
    needs_review_count: int
    current_stage: str
    error_message: Optional[str] = None

class DraftQuestionsResponse(BaseModel):
    job_id: str
    total_count: int
    status: str
    questions: List[ParsedQuestionSchema]


def run_async_cloud_review(job_id_str: str):
    """Background task function to run cloud review asynchronously."""
    try:
        engine_inst = IngestionEngine()
        engine_inst.process_cloud_review_stage(uuid.UUID(job_id_str))
    except Exception as e:
        import traceback
        traceback.print_exc()


@router.post(
    "/v1/admin/ingest",
    response_model=IngestionUploadResponse,
    summary="Upload and ingest exam PDF / image document",
    description="Validates file, performs layout parsing, instant DRAFT persistence, and launches async cloud review."
)
async def ingest_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    exam_type: str = "CDS",
    year: int = 2026,
    session: str = "I",
    subject: str = "English"
):
    valid_exts = [".pdf", ".jpg", ".jpeg", ".png", ".webp"]
    orig_name = file.filename or "uploaded_paper.pdf"
    ext = Path(orig_name).suffix.lower()

    if ext not in valid_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {valid_exts}"
        )

    # Save uploaded file safely to temporary storage
    uploads_dir = Path("data/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    temp_path = uploads_dir / f"{uuid.uuid4().hex[:12]}_{orig_name}"

    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Initialize Ingestion Engine
        ingest_engine = IngestionEngine()

        # Step 1: Create Job and deduplicate
        job_id = ingest_engine.create_job(
            file_path=str(temp_path.resolve()),
            year=year,
            session=session,
            subject=subject,
            exam_type=exam_type
        )

        # Step 2: Process Local Stage (Drafts ready in ~1-2s)
        local_res = ingest_engine.process_local_stage(job_id)

        # Step 3: Trigger Asynchronous Cloud AI Review in background
        background_tasks.add_task(run_async_cloud_review, str(job_id))

        return IngestionUploadResponse(
            job_id=str(job_id),
            status=local_res.get("status", IngestionJobStatus.DRAFT_READY.value),
            filename=orig_name,
            total_pages=local_res.get("total_pages", 1),
            extracted_count=local_res.get("total_draft_questions", 0),
            message="Document parsed successfully. Draft questions are now visible; cloud verification is running in background."
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion pipeline failed: {str(e)}")


@router.get(
    "/v1/admin/ingest/status/{job_id}",
    response_model=IngestionStatusResponse,
    summary="Poll status and progress of an ingestion job"
)
async def get_ingestion_status(job_id: str):
    try:
        j_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job UUID")

    with Session(engine) as s:
        job = s.get(IngestionJob, j_uuid)
        if not job:
            raise HTTPException(status_code=404, detail="Ingestion job not found")

        return IngestionStatusResponse(
            job_id=str(job.id),
            filename=job.filename,
            status=job.status,
            total_pages=job.total_pages,
            processed_pages=job.processed_pages,
            extracted_count=job.extracted_count,
            verified_count=job.verified_count,
            needs_review_count=job.needs_review_count,
            current_stage=job.current_stage or job.status,
            error_message=job.error_message
        )


@router.get(
    "/v1/admin/ingest/drafts/{job_id}",
    response_model=DraftQuestionsResponse,
    summary="Retrieve extracted draft questions for a job immediately"
)
async def get_draft_questions(job_id: str):
    try:
        j_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job UUID")

    with Session(engine) as s:
        job = s.get(IngestionJob, j_uuid)
        if not job:
            raise HTTPException(status_code=404, detail="Ingestion job not found")

        qs = s.exec(
            select(Questions).where(
                Questions.exam_type == job.exam_type,
                Questions.year == job.year,
                Questions.subject == job.subject,
                Questions.session == job.session
            ).order_by(Questions.question_number)
        ).all()

        parsed_list = [
            ParsedQuestionSchema(
                id=str(q.id),
                question_number=q.question_number,
                content=q.text,
                options=q.options or {},
                correct_answer=q.final_answer or q.correct_answer,
                explanation=q.explanation,
                ocr_confidence=q.ocr_confidence or 1.0,
                structure_confidence=q.structure_confidence or 1.0,
                overall_confidence=q.overall_confidence or 1.0,
                is_verified=q.is_verified,
                verification_status=q.verification_status or "DRAFT_READY",
                source_pages=q.source_pages or []
            )
            for q in qs
        ]

        return DraftQuestionsResponse(
            job_id=str(job.id),
            total_count=len(parsed_list),
            status=job.status,
            questions=parsed_list
        )
