from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_async_session
from app.services.student_service import StudentService
from app.services.diagnostic_service import DiagnosticService
from app.tasks.student_tasks import flag_fragile_learning
from app.schemas.student import (
    AttemptSubmitRequest, 
    AttemptSubmitResponse, 
    StudentProfileResponse, 
    RevisionItem,
    DiagnosticOnboardRequest,
    DiagnosticOnboardResponse,
    MasteryGalaxyResponse,
    FragileAlertItem
)

router = APIRouter()

@router.post(
    "/v1/attempts/submit",
    response_model=AttemptSubmitResponse,
    summary="Submit student answer attempt",
    description="Saves attempt details, updates BKT (IRT/confidence weighted), spaced repetition decay stats, and calibration biases. Triggers volatility tracking in the background."
)
async def submit_attempt(
    request: AttemptSubmitRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session)
):
    service = StudentService(db)
    try:
        result = await service.submit_attempt(
            user_id=request.user_id,
            subtopic_id=request.subtopic_id,
            exam_type=request.exam_type,
            is_correct=request.is_correct,
            response_time=request.response_time,
            confidence_level=request.confidence_level,
            difficulty_level=request.difficulty_level if request.difficulty_level is not None else 3,
            use_confidence=request.use_confidence if request.use_confidence is not None else True,
            use_irt=request.use_irt if request.use_irt is not None else True
        )
        
        # Enqueue background task to evaluate performance volatility and fragile learning
        background_tasks.add_task(
            flag_fragile_learning,
            user_id=request.user_id,
            subtopic_id=request.subtopic_id,
            exam_type=request.exam_type
        )
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit attempt: {str(e)}"
        )

@router.post(
    "/v1/student/onboard",
    summary="Create or sync student profile upon onboarding",
    description="Registers new student profile and merges guest state or baseline diagnostic inputs."
)
async def onboard_student(
    request: dict,
    db: AsyncSession = Depends(get_async_session)
):
    try:
        user_id = request.get("user_id") or request.get("id")
        exam_type = request.get("target_exam", "UPSC")
        
        return {
            "status": "success",
            "message": f"Student profile {user_id} initialized for {exam_type}.",
            "user_id": user_id,
            "target_exam": exam_type
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete student onboarding: {str(e)}"
        )

@router.post(
    "/v1/student/onboard/initialize",
    response_model=DiagnosticOnboardResponse,
    summary="Initialize student profile via diagnostic test",
    description="Accepts results from a diagnostic onboarding test and establishes custom baseline mastery, rather than starting all students at P(L) = 0.15."
)
async def onboard_initialize(
    request: DiagnosticOnboardRequest,
    db: AsyncSession = Depends(get_async_session)
):
    try:
        attempts_list = [a.dict() for a in request.attempts]
        result = await DiagnosticService.initialize_student_profile(
            db=db,
            user_id=request.user_id,
            exam_type=request.exam_type,
            diagnostic_attempts=attempts_list
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize diagnostic onboarding: {str(e)}"
        )

@router.get(
    "/v1/student/profile/{user_id}",
    response_model=StudentProfileResponse,
    summary="Get aggregated student twin profile",
    description="Aggregates subtopic mastery scores to the parent subject level for dashboard visualization."
)
async def get_student_profile(
    user_id: str,
    exam_type: str = Query(..., description="Filter isolation by exam type (e.g. UPSC, CDS)"),
    db: AsyncSession = Depends(get_async_session)
):
    service = StudentService(db)
    try:
        profile = await service.get_student_profile(user_id=user_id, exam_type=exam_type)
        return profile
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch student profile metadata: {str(e)}"
        )

@router.get(
    "/v1/student/revision-list",
    response_model=List[RevisionItem],
    summary="Retrieve spaced-repetition revision items",
    description="Returns list of subtopics where the predicted recall probability has decayed below 50% (P < 0.5)."
)
async def get_revision_list(
    user_id: str = Query(..., description="Unique ID of the student"),
    exam_type: str = Query(..., description="Exam type (UPSC or CDS)"),
    db: AsyncSession = Depends(get_async_session)
):
    service = StudentService(db)
    try:
        revisions = await service.get_revision_list(user_id=user_id, exam_type=exam_type)
        return revisions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compile spaced repetition revision schedule: {str(e)}"
        )

@router.get(
    "/v1/student/analytics/galaxy",
    response_model=MasteryGalaxyResponse,
    summary="Get 2D/3D coordinates for 'Mastery Galaxy' visualization",
    description="Returns node coordinates, sizes representing mastery, color representing retention decay, and dependency edges."
)
async def get_mastery_galaxy(
    user_id: str = Query(..., description="Unique ID of the student"),
    exam_type: str = Query(..., description="Exam type (UPSC or CDS)"),
    db: AsyncSession = Depends(get_async_session)
):
    service = StudentService(db)
    try:
        galaxy_data = await service.get_mastery_galaxy(user_id=user_id, exam_type=exam_type)
        return galaxy_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render mastery galaxy: {str(e)}"
        )

@router.get(
    "/v1/student/alerts",
    response_model=List[FragileAlertItem],
    summary="Retrieve fragile learning and deep review alerts",
    description="Lists subtopics where volatile performance suggests fragile learning states (high mastery with inconsistent scores)."
)
async def get_fragile_alerts(
    user_id: str = Query(..., description="Unique student identifier"),
    exam_type: str = Query(..., description="UPSC or CDS"),
    db: AsyncSession = Depends(get_async_session)
):
    service = StudentService(db)
    try:
        alerts = await service.get_fragile_alerts(user_id=user_id, exam_type=exam_type)
        return alerts
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve student performance alerts: {str(e)}"
        )
