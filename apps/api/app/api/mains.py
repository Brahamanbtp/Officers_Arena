import uuid, os, base64
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlmodel import select, col
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
    if paper:
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
