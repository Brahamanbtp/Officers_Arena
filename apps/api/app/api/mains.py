import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import select, col
from sqlalchemy.ext.asyncio import AsyncSession

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
    stmt = select(Questions).where(Questions.exam_type == "UPSC")
    
    # Filter by paper type or subject
    if paper:
        stmt = stmt.where(Questions.subject.ilike(f"%{paper}%"))
    if year:
        stmt = stmt.where(Questions.year == year)

    stmt = stmt.limit(limit)
    res = await db.execute(stmt)
    qs = res.scalars().all()

    # If few returned, fetch without paper filter
    if len(qs) == 0:
        stmt = select(Questions).where(Questions.exam_type == "UPSC").limit(limit)
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
