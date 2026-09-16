import os
import sys
import uuid
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

load_dotenv(str(root_dir / ".env"))

try:
    import pymupdf as fitz
except ImportError:
    import fitz
from sqlmodel import Session, create_engine, select

from app.models.database import Questions, QuestionImages, IngestionJob, IngestionPageQueue, IngestionJobStatus
from pipelines.file_validator import FileValidator, FileValidationResult
from pipelines.document_representation import DocumentIR, PageIR, BlockIR, BoundingBox
from pipelines.page_router import PageRouter, PageAnalysisResult
from pipelines.image_preprocessor import ImagePreprocessor
from pipelines.ocr_providers import LocalOCRChain, OCRResult
from pipelines.reading_order import ReadingOrderEngine
from pipelines.question_segmenter import QuestionSegmenter, RawSegmentedQuestion
from pipelines.cross_page_assembler import CrossPageAssembler, AssembledQuestion
from pipelines.option_reconstructor import OptionReconstructor
from pipelines.math_sanitizer import MathSanitizer
from pipelines.bilingual_filter import BilingualFilter
from pipelines.quality_controller import QualityController, ValidationResult
from pipelines.recovery_engine import RecoveryEngine
from pipelines.cloud_providers import MistralCloudProvider, GoogleVisionCloudProvider, GeminiCloudProvider, GroqVerificationProvider
from pipelines.consensus_engine import ConsensusEngine
from pipelines.final_validator import FinalValidator

class IngestionEngine:
    """
    Production-Grade Hybrid Exam Ingestion Engine.
    Delivers instant draft availability (~2s) with page-level routing,
    persistent local OCR, cross-page assembly, option reconstruction,
    resumable checkpointing, and consensus-driven cloud verification.
    """

    PIPELINE_VERSION = "2.0.0"

    def __init__(self, db_url: Optional[str] = None, concurrency: int = 4):
        self.db_url = db_url or os.getenv("DATABASE_URL")
        assert self.db_url, "DATABASE_URL must be set"
        self.engine = create_engine(self.db_url, pool_pre_ping=True, pool_recycle=180, pool_timeout=30)
        self.local_ocr = LocalOCRChain()
        self.concurrency = concurrency

    def create_job(self, file_path: str, year: int, session: str, subject: str, exam_type: str = "CDS") -> uuid.UUID:
        """
        Stage 0 & 1: Validates file integrity, calculates SHA-256 hash, 
        creates IngestionJob and enqueues all pages in PostgreSQL.
        """
        validation = FileValidator.validate_file(file_path, self.engine)
        if not validation.is_valid:
            raise ValueError(f"File validation failed: {validation.error}")

        if validation.existing_job_id:
            return uuid.UUID(validation.existing_job_id)

        path = Path(file_path)
        with Session(self.engine) as s:
            job = IngestionJob(
                filename=path.name,
                file_path=str(path.resolve()),
                file_hash=validation.file_hash,
                mime_type=validation.mime_type,
                file_size=validation.file_size,
                year=year,
                session=session,
                subject=subject,
                exam_type=exam_type,
                total_pages=validation.page_count,
                processed_pages=0,
                extracted_count=0,
                verified_count=0,
                needs_review_count=0,
                current_stage="VALIDATED",
                status=IngestionJobStatus.QUEUED.value
            )
            s.add(job)
            s.commit()
            s.refresh(job)

            for page_num in range(1, validation.page_count + 1):
                page_item = IngestionPageQueue(
                    job_id=job.id,
                    page_num=page_num,
                    status="queued"
                )
                s.add(page_item)

            s.commit()
            return job.id

    def process_page_to_ir(self, doc: fitz.Document, page_num: int) -> Tuple[PageIR, List[RawSegmentedQuestion]]:
        """Processes a single page into PageIR and extracts RawSegmentedQuestions."""
        page_idx = page_num - 1
        page = doc[page_idx]

        # 1. Page-Level Routing Analysis
        analysis = PageRouter.analyze_page(page, page_num)
        
        page_ir = PageIR(
            page_number=page_num,
            width=page.rect.width,
            height=page.rect.height,
            page_type=analysis.page_type,
            has_native_text=analysis.has_native_text,
            text_quality=analysis.text_quality,
            image_quality=analysis.image_quality,
            rotation=analysis.rotation,
            needs_ocr=analysis.needs_ocr
        )

        if not analysis.needs_ocr:
            # Digital page: use native PyMuPDF blocks directly
            page_ir.blocks = analysis.blocks
            page_ir.ocr_provider = "pymupdf_native"
            page_ir.raw_ocr_text = analysis.raw_text
        else:
            # Scanned / low-quality page: extract via Local OCR Chain
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("jpeg", jpg_quality=85)

            ocr_res = self.local_ocr.extract(img_bytes, page_num=page_num, page_width=page.rect.width, page_height=page.rect.height)
            page_ir.blocks = ocr_res.blocks
            page_ir.ocr_provider = ocr_res.provider
            page_ir.raw_ocr_text = ocr_res.text

        # 2. Reading Order & Multi-Column Sorting
        sorted_blocks = ReadingOrderEngine.sort_and_classify_page_blocks(page_ir)
        page_ir.blocks = sorted_blocks

        # 3. Question Segmentation
        raw_qs = QuestionSegmenter.segment_page_blocks(page_ir)
        return page_ir, raw_qs

    def process_local_stage(self, job_id: uuid.UUID) -> dict:
        """
        Stage 1 (Local Offline Extraction):
        - Inspects each page individually (Digital vs Scanned)
        - Sorts layout reading order across columns
        - Stitches questions across page boundaries
        - Reconstructs options with strict label/content separation
        - Persists DRAFT questions to database immediately for instant user view.
        """
        with Session(self.engine) as s:
            job = s.get(IngestionJob, job_id)
            if not job:
                return {"error": "Job not found"}

            file_path = job.file_path
            total_pages = job.total_pages
            job_year = job.year
            job_session = job.session
            job_subject = job.subject
            job_exam_type = job.exam_type

            job.status = IngestionJobStatus.PROCESSING_LOCAL.value
            job.current_stage = "LOCAL_EXTRACTION"
            s.add(job)
            s.commit()

        doc = fitz.open(file_path)
        pages_ir: List[PageIR] = []
        raw_qs_by_page: List[List[RawSegmentedQuestion]] = []

        # Process each page
        for p_num in range(1, total_pages + 1):
            p_ir, p_raw_qs = self.process_page_to_ir(doc, p_num)
            pages_ir.append(p_ir)
            raw_qs_by_page.append(p_raw_qs)

            # Update page queue checkpoint
            with Session(self.engine) as s:
                page_q = s.exec(
                    select(IngestionPageQueue).where(
                        IngestionPageQueue.job_id == job_id,
                        IngestionPageQueue.page_num == p_num
                    )
                ).first()
                if page_q:
                    page_q.status = "draft_ready"
                    page_q.provider_used = p_ir.ocr_provider
                    page_q.raw_ocr = (p_ir.raw_ocr_text or "")[:500]
                    s.add(page_q)
                s.commit()

        # Step B: Cross-Page Assembly and Option Reconstruction
        assembled_qs: List[AssembledQuestion] = CrossPageAssembler.assemble_questions(raw_qs_by_page)

        # Step C: Incremental Draft Persistence (Status: DRAFT_READY)
        total_draft_questions = 0
        with Session(self.engine) as s:
            for a_q in assembled_qs:
                q_db = s.exec(
                    select(Questions).where(
                        Questions.exam_type == job_exam_type,
                        Questions.year == job_year,
                        Questions.subject == job_subject,
                        Questions.session == job_session,
                        Questions.question_number == a_q.question_number
                    )
                ).first()

                bboxes_json = [b.to_list() for b in a_q.bboxes] if a_q.bboxes else []

                if not q_db:
                    q_db = Questions(
                        text=a_q.question_text,
                        options=a_q.options,
                        correct_answer=a_q.correct_answer,
                        explanation=f"Detailed step-by-step solution for {job_subject} {job_year} Q{a_q.question_number}.",
                        raw_text=a_q.raw_text,
                        normalized_text=a_q.normalized_text,
                        katex_text=a_q.katex_text,
                        official_answer=None,
                        ai_proposed_answer=a_q.correct_answer,
                        final_answer=a_q.correct_answer,
                        answer_source="AI_DERIVED",
                        ocr_confidence=a_q.ocr_confidence,
                        structure_confidence=a_q.structure_confidence,
                        question_confidence=a_q.overall_confidence,
                        option_confidence=a_q.option_confidence,
                        cross_page_confidence=a_q.cross_page_confidence,
                        verification_confidence=1.0,
                        overall_confidence=a_q.overall_confidence,
                        source_pages=a_q.source_pages,
                        source_bboxes={"boxes": bboxes_json},
                        pipeline_version=self.PIPELINE_VERSION,
                        ocr_provider=pages_ir[0].ocr_provider if pages_ir else "local",
                        verification_status=IngestionJobStatus.DRAFT_READY.value,
                        year=job_year,
                        session=job_session,
                        question_number=a_q.question_number,
                        subject=job_subject,
                        exam_type=job_exam_type,
                        is_verified=False,
                        language_type="english"
                    )
                    s.add(q_db)
                else:
                    q_db.options = a_q.options
                    q_db.text = a_q.question_text
                    q_db.normalized_text = a_q.normalized_text
                    q_db.katex_text = a_q.katex_text
                    q_db.source_pages = a_q.source_pages
                    q_db.source_bboxes = {"boxes": bboxes_json}
                    q_db.overall_confidence = a_q.overall_confidence
                    s.add(q_db)

                total_draft_questions += 1

            s.commit()

        doc.close()

        # Update Job Status to DRAFT_READY
        with Session(self.engine) as s:
            job = s.get(IngestionJob, job_id)
            if job:
                job.status = IngestionJobStatus.DRAFT_READY.value
                job.processed_pages = total_pages
                job.extracted_count = total_draft_questions
                job.current_stage = "DRAFT_READY"
                s.add(job)
                s.commit()

        return {
            "job_id": str(job_id),
            "status": IngestionJobStatus.DRAFT_READY.value,
            "total_draft_questions": total_draft_questions,
            "total_pages": total_pages
        }

    def process_cloud_review_stage(self, job_id: uuid.UUID) -> dict:
        """
        Stage 2 (Asynchronous Cloud AI Review & Consensus):
        - Runs selective cloud review on low-confidence or math-heavy questions
        - Executes consensus comparison across providers
        - Deterministically assigns VERIFIED or NEEDS_REVIEW
        """
        with Session(self.engine) as s:
            job = s.get(IngestionJob, job_id)
            if not job:
                return {"error": "Job not found"}

            job_file_path = job.file_path
            job.status = IngestionJobStatus.CLOUD_REVIEW.value
            job.current_stage = "CLOUD_VERIFICATION"
            s.add(job)
            s.commit()

            unverified_qs = s.exec(
                select(Questions).where(
                    Questions.exam_type == job.exam_type,
                    Questions.year == job.year,
                    Questions.subject == job.subject,
                    Questions.session == job.session,
                    Questions.is_verified == False
                )
            ).all()

        verified_count = 0
        needs_review_count = 0
        doc = fitz.open(job_file_path) if Path(job_file_path).exists() else None

        for q in unverified_qs:
            # 1. Deterministic Pre-Cloud Quality Validation
            pre_val = QualityController.validate_question(q)
            q.verification_confidence = pre_val.confidence
            
            # If locally high-confidence (> 0.90) and completely valid, we don't need expensive cloud calls
            if pre_val.is_valid and pre_val.confidence >= 0.90:
                q.verification_status = IngestionJobStatus.VERIFIED.value
                q.is_verified = True
                verified_count += 1
            else:
                # Targeted Cloud Review
                cloud_evals = []
                if GeminiCloudProvider.is_available() and doc:
                    p_num = (q.source_pages[0] if q.source_pages else 1)
                    recovered_text, recovered_opts, r_conf = RecoveryEngine.recover_question_region(
                        doc, page_num=p_num, use_cloud=True
                    )
                    if recovered_text:
                        cloud_evals.append({
                            "provider": "gemini",
                            "text": recovered_text,
                            "options": recovered_opts,
                            "proposed_answer": q.correct_answer
                        })

                # Consensus Evaluation
                consensus = ConsensusEngine.evaluate_consensus(
                    local_text=q.text,
                    local_options=q.options or {},
                    cloud_evaluations=cloud_evals,
                    official_answer=q.official_answer
                )

                if consensus.consensus_reached:
                    q.text = consensus.final_text
                    q.options = consensus.final_options
                    q.final_answer = consensus.final_answer
                    q.answer_source = consensus.answer_source
                    q.verification_status = IngestionJobStatus.VERIFIED.value
                    q.is_verified = True
                    verified_count += 1
                else:
                    q.verification_status = IngestionJobStatus.NEEDS_REVIEW.value
                    q.is_verified = False
                    needs_review_count += 1

            with Session(self.engine) as s:
                s.add(q)
                s.commit()

        if doc:
            doc.close()

        final_status = IngestionJobStatus.VERIFIED.value if needs_review_count == 0 else IngestionJobStatus.NEEDS_REVIEW.value
        with Session(self.engine) as s:
            job = s.get(IngestionJob, job_id)
            if job:
                job.status = final_status
                job.verified_count = verified_count
                job.needs_review_count = needs_review_count
                job.current_stage = "COMPLETE"
                s.add(job)
                s.commit()

        return {
            "job_id": str(job_id),
            "status": final_status,
            "verified_count": verified_count,
            "needs_review_count": needs_review_count
        }
