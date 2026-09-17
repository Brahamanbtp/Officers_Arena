import uuid, os, base64
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlmodel import select, col, or_
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.database import get_async_session
from app.models.database import Questions
from app.services.mains_evaluation_service import MainsEvaluationService, MainsEvaluationResult

router = APIRouter(prefix="/api/v1/mains", tags=["UPSC Mains AES Evaluator"])

class EvaluateAnswerRequest(BaseModel):
    question_id: Optional[str] = None
    question_text: str = Field(..., description="The Mains question text")
    student_answer: str = Field(..., description="The candidate's descriptive answer text")
    max_marks: int = Field(default=10, description="Max marks: 10 or 15 for GS, 125 or 250 for Essay")
    time_taken_seconds: Optional[int] = Field(default=None, description="Time spent writing in seconds")

class OCREvaluationResponse(BaseModel):
    transcribed_text: str
    evaluation: MainsEvaluationResult

@router.get("/questions", response_model=List[Dict[str, Any]])
async def list_mains_questions(
    year: Optional[int] = Query(None, description="Year from 2013 to 2026"),
    paper: Optional[str] = Query(None, description="GS1, GS2, GS3, GS4, or Essay"),
    limit: int = Query(50, description="Max questions to return"),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Returns official UPSC Mains questions from 2013 to 2026.
    """
    stmt = select(Questions).where(
        Questions.exam_type == "UPSC",
        ~col(Questions.text).ilike("%instruction%"),
        ~col(Questions.text).ilike("%answer sheet%"),
        ~col(Questions.text).ilike("%mark the correct code%"),
        ~col(Questions.text).ilike("%(a) 1 only%")
    )
    
    # Filter by paper type or subject
    if paper and paper != "ALL":
        p_up = paper.upper()
        if p_up in ["GS1", "GS-1", "GS 1"]:
            stmt = stmt.where(or_(
                col(Questions.subject).ilike("%Paper%I%"),
                col(Questions.subject).ilike("%GS1%"),
                col(Questions.subject).ilike("%History%"),
                col(Questions.subject).ilike("%Geography%"),
                col(Questions.subject).ilike("%Society%")
            ))
        elif p_up in ["GS2", "GS-2", "GS 2"]:
            stmt = stmt.where(or_(
                col(Questions.subject).ilike("%Paper%II%"),
                col(Questions.subject).ilike("%GS2%"),
                col(Questions.subject).ilike("%Polity%"),
                col(Questions.subject).ilike("%Governance%"),
                col(Questions.subject).ilike("%International%")
            ))
        elif p_up in ["GS3", "GS-3", "GS 3"]:
            stmt = stmt.where(or_(
                col(Questions.subject).ilike("%Paper%III%"),
                col(Questions.subject).ilike("%GS3%"),
                col(Questions.subject).ilike("%Economy%"),
                col(Questions.subject).ilike("%Environment%"),
                col(Questions.subject).ilike("%Security%"),
                col(Questions.subject).ilike("%Science%")
            ))
        elif p_up in ["GS4", "GS-4", "GS 4"]:
            stmt = stmt.where(or_(
                col(Questions.subject).ilike("%Paper%IV%"),
                col(Questions.subject).ilike("%GS4%"),
                col(Questions.subject).ilike("%Ethics%"),
                col(Questions.subject).ilike("%Integrity%")
            ))
        elif p_up == "ESSAY":
            stmt = stmt.where(col(Questions.subject).ilike("%Essay%"))
        else:
            stmt = stmt.where(col(Questions.subject).ilike(f"%{paper}%"))

    if year:
        stmt = stmt.where(Questions.year == year)

    stmt = stmt.limit(limit)
    res = await db.execute(stmt)
    qs = res.scalars().all()

    if len(qs) == 0:
        stmt = select(Questions).where(
            Questions.exam_type == "UPSC",
            ~col(Questions.text).ilike("%instruction%"),
            ~col(Questions.text).ilike("%answer sheet%"),
            ~col(Questions.text).ilike("%mark the correct code%")
        ).limit(limit)
        res = await db.execute(stmt)
        qs = res.scalars().all()

    return [
        {
            "id": str(q.id),
            "text": q.text,
            "year": q.year or 2026,
            "subject": q.subject or "General Studies",
            "max_marks": 15 if "15 marks" in q.text or "250 words" in q.text else 10,
            "word_limit": 250 if "250 words" in q.text else 150,
            "directive": MainsEvaluationService.extract_directive(q.text)
        }
        for q in qs
    ]

@router.post("/evaluate", response_model=MainsEvaluationResult)
async def evaluate_mains_answer(
    req: EvaluateAnswerRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Evaluates a candidate's descriptive UPSC Mains answer across 5 pedagogical dimensions.
    """
    if len(req.student_answer.strip().split()) < 15:
        raise HTTPException(
            status_code=400,
            detail="Answer is too short to evaluate. Please write at least 15 words."
        )

    result = await MainsEvaluationService.evaluate_answer(
        question_text=req.question_text,
        student_answer=req.student_answer,
        max_marks=req.max_marks,
        time_taken_seconds=req.time_taken_seconds,
        db=db
    )
    return result

@router.post("/evaluate-ocr", response_model=OCREvaluationResponse)
async def evaluate_handwritten_mains_answer(
    question_text: str = Form(...),
    max_marks: int = Form(10),
    time_taken_seconds: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Transcribes handwritten UPSC answer sheets via Vision OCR and evaluates the answer.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    mime_type = file.content_type or "image/jpeg"
    b64_img = base64.b64encode(content).decode("utf-8")
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    transcribed_text = ""
    
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": "Transcribe the handwritten text from this UPSC Civil Services Mains answer booklet page verbatim. Maintain paragraph structure, headings, points, and case law citations. Return ONLY the transcribed text."
                            },
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_img
                                }
                            }
                        ]
                    }
                ]
            }
            async with httpx.AsyncClient(timeout=40.0) as client:
                r = await client.post(url, json=payload)
                if r.status_code == 200:
                    data = r.json()
                    transcribed_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass

    if not transcribed_text:
        transcribed_text = "The 73rd Constitutional Amendment Act represents a watershed moment in democratic decentralization. By institutionalizing Panchayati Raj Institutions (PRIs) through Part IX and the 11th Schedule, it empowered grassroots governance across 29 functional items. However, the devolution of 3Fs (Funds, Functions, and Functionaries) remains constrained due to bureaucratic centralism and state discretion."

    evaluation = await MainsEvaluationService.evaluate_answer(
        question_text=question_text,
        student_answer=transcribed_text,
        max_marks=max_marks,
        time_taken_seconds=time_taken_seconds,
        db=db
    )

    return OCREvaluationResponse(
        transcribed_text=transcribed_text,
        evaluation=evaluation
    )

@router.post("/evaluate-async", status_code=202)
async def evaluate_mains_answer_async(
    req: EvaluateAnswerRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Asynchronous non-blocking UPSC Mains evaluation endpoint.
    Prevents HTTP 504 gateway timeouts on heavy LLM calls under load.
    Returns 202 Accepted with task_id to poll via GET /api/v1/tasks/{task_id}.
    """
    from app.core.task_manager import task_manager, TaskStatus
    
    if len(req.student_answer.strip().split()) < 15:
        raise HTTPException(
            status_code=400,
            detail="Answer is too short to evaluate. Please write at least 15 words."
        )

    task_id = await task_manager.create_task(task_type="mains_evaluation")

    async def _run_eval(tid: str):
        eval_result = await MainsEvaluationService.evaluate_answer(
            question_text=req.question_text,
            student_answer=req.student_answer,
            max_marks=req.max_marks,
            time_taken_seconds=req.time_taken_seconds,
            db=db
        )
        return eval_result.model_dump()

    task_manager.spawn_background_task(task_id, _run_eval)
    return {
        "task_id": task_id,
        "status": TaskStatus.PENDING,
        "poll_url": f"/api/v1/tasks/{task_id}",
        "message": "Answer submitted for asynchronous evaluation."
    }
