import uuid
import math
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import select, col, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_async_session
from app.models.database import Questions, Syllabus
from app.models.student_stats import StudentState, PerformanceLog, SRSMetadata, TopicMastery
from ml.irt_engine import IRTEngine
from ml.srs_engine import SRSEngine
from ml.knowledge_tracing.bkt_engine import BKTProcessor
from app.services.tutor_service import TutorService

router = APIRouter()

class SubmitResponseRequest(BaseModel):
    user_id: str = Field(..., description="Student identifier")
    question_id: uuid.UUID = Field(..., description="UUID of the question responded to")
    selected_option: str = Field(..., description="Selected option choice (e.g., A, B, C, D)")
    response_time: float = Field(..., description="Time taken to respond in seconds")
    confidence_level: int = Field(..., ge=1, le=5, description="Student's metacognitive confidence rating")

class SubmitResponseResult(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    new_theta: float
    theta_delta: float
    mastery_percentage: float
    predicted_score: float
    accuracy_margin: float

class BatchItemAnswer(BaseModel):
    question_id: uuid.UUID
    selected_option: Optional[str] = None
    confidence_level: Optional[int] = 3
    response_time: Optional[float] = 45.0

class SubmitBatchRequest(BaseModel):
    user_id: str
    exam_type: str
    paper_name: Optional[str] = "Mock Test"
    answers: List[BatchItemAnswer]
    total_time_seconds: Optional[float] = 0.0

class SubmitBatchResult(BaseModel):
    total_items: int
    attempted: int
    correct_count: int
    incorrect_count: int
    unattempted_count: int
    raw_score: float
    penalty: float
    net_score: float
    max_marks: float
    cutoff_cleared: bool
    new_theta: float
    theta_delta: float
    mastery_percentage: float

from fastapi.responses import FileResponse
from app.models.database import QuestionImages

class NextQuestionResponse(BaseModel):
    id: uuid.UUID
    text: str
    options: Dict[str, Any]
    correct_answer: str
    explanation: Optional[str] = None
    images: List[Dict[str, Any]] = []
    metadata: Dict[str, Any]

class SRSDashboardItem(BaseModel):
    question_id: uuid.UUID
    text: str
    urgency_score: float
    due_date: str
    subject: Optional[str] = None

class SRSDashboardResponse(BaseModel):
    due_questions: List[SRSDashboardItem]

class ExplainResponse(BaseModel):
    explanation: str

class MasteryMapResponse(BaseModel):
    mastery_map: Dict[str, float]

class SessionReportResponse(BaseModel):
    theta_progress: str
    bkt_mastery: str
    predictive_score: str

@router.get(
    "/api/v1/arena/next-question",
    response_model=NextQuestionResponse,
    summary="Fetch flow-state matched question based on IRT Theta",
    description="Selects the next optimal question matching the flow-state challenge window [0.5, 0.7] of the student's current estimated theta."
)
async def next_question(
    user_id: str = Query(..., description="Student identifier"),
    exam_type: str = Query(..., description="UPSC or CDS"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        # 1. Fetch student state
        state_stmt = select(StudentState).where(StudentState.user_id == user_id)
        state_res = await db.execute(state_stmt)
        student_state = state_res.scalars().first()

        if not student_state:
            student_state = StudentState(user_id=user_id, theta=0.0, total_answered=0, is_adaptive=True)
            db.add(student_state)
            await db.commit()
            await db.refresh(student_state)

        # 2. Get answered questions
        log_stmt = select(PerformanceLog.question_id).where(PerformanceLog.user_id == user_id)
        log_res = await db.execute(log_stmt)
        answered_ids = set(log_res.scalars().all())

        # 3. Query candidates with SQL-level filtering & limit
        q_stmt = select(Questions).where(Questions.exam_type == exam_type)
        if answered_ids:
            q_stmt = q_stmt.where(col(Questions.id).notin_(list(answered_ids)))
        if student_state.is_adaptive and student_state.total_answered >= 5:
            theta_min = student_state.theta - 1.5
            theta_max = student_state.theta + 1.5
            q_stmt = q_stmt.where(col(Questions.difficulty_b).between(theta_min, theta_max))
        q_stmt = q_stmt.limit(100)
        q_res = await db.execute(q_stmt)
        candidates: List[Questions] = list(q_res.scalars().all())

        if not candidates:
            fallback_stmt = select(Questions).where(Questions.exam_type == exam_type).limit(100)
            q_res = await db.execute(fallback_stmt)
            candidates = list(q_res.scalars().all())
            if not candidates:
                raise HTTPException(status_code=404, detail="No questions available for this exam type.")

        # 4. Calibration vs Flow State vs Control (Non-adaptive) group
        selected_q = None

        if not student_state.is_adaptive:
            # Research control group: pick random candidate
            selected_q = random.choice(candidates)
        elif student_state.total_answered < 5:
            # Calibration set (first 5 questions)
            from ml.calibration_set import CalibrationSet
            selected_q = CalibrationSet.get_calibration_question(candidates, student_state.total_answered)
        else:
            # Flow state search [0.5, 0.7]
            closest_diff = 1.0
            for q in candidates:
                a = q.discrimination_a if q.discrimination_a is not None else 1.0
                b = q.difficulty_b if q.difficulty_b is not None else 0.0
                c = q.guessing_c if q.guessing_c is not None else 0.25
                p = IRTEngine.calculate_3pl_probability(student_state.theta, a, b, c)
                
                if 0.5 <= p <= 0.7:
                    diff = abs(p - 0.6)
                    if diff < closest_diff:
                        closest_diff = diff
                        selected_q = q
            
            # Widening search [0.4, 0.8]
            if not selected_q:
                closest_diff = 1.0
                for q in candidates:
                    a = q.discrimination_a if q.discrimination_a is not None else 1.0
                    b = q.difficulty_b if q.difficulty_b is not None else 0.0
                    c = q.guessing_c if q.guessing_c is not None else 0.25
                    p = IRTEngine.calculate_3pl_probability(student_state.theta, a, b, c)
                    
                    if 0.4 <= p <= 0.8:
                        diff = abs(p - 0.6)
                        if diff < closest_diff:
                            closest_diff = diff
                            selected_q = q

            # Hard Fallback
            if not selected_q:
                candidates = sorted(candidates, key=lambda q: abs((q.difficulty_b if q.difficulty_b is not None else 0.0) - student_state.theta))
                selected_q = candidates[0]

        if not selected_q:
            raise HTTPException(status_code=404, detail="Could not select a matching question.")

        # Query associated QuestionImages
        img_stmt = select(QuestionImages).where(QuestionImages.question_id == selected_q.id)
        img_res = await db.execute(img_stmt)
        q_images = img_res.scalars().all()
        
        image_list = []
        for img in q_images:
            image_list.append({
                "id": str(img.id),
                "url": f"/api/v1/images/{img.id}",
                "file_path": img.file_path,
                "description": img.description or ""
            })

        return NextQuestionResponse(
            id=selected_q.id,
            text=selected_q.text,
            options=selected_q.options,
            correct_answer=selected_q.correct_answer,
            explanation=selected_q.explanation,
            images=image_list,
            metadata={
                "difficulty": selected_q.difficulty_b or 0.0,
                "discrimination": selected_q.discrimination_a or 1.0,
                "guessing": selected_q.guessing_c or 0.25,
                "subject": selected_q.subject,
                "year": selected_q.year,
                "exam_type": selected_q.exam_type
            }
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Next question failed: {str(e)}")

@router.get(
    "/api/v1/images/{image_id}",
    summary="Serve question exhibit image",
    description="Streams the binary PNG/JPEG image for a given QuestionImages record ID or file UUID."
)
async def serve_question_image(
    image_id: str,
    db: AsyncSession = Depends(get_async_session)
):
    import os
    from pathlib import Path
    
    # Check if image_id is valid UUID
    try:
        uuid_obj = uuid.UUID(image_id)
        stmt = select(QuestionImages).where(QuestionImages.id == uuid_obj)
        res = await db.execute(stmt)
        qi_rec = res.scalars().first()
        if qi_rec:
            rel_path = qi_rec.file_path.lstrip("/").replace("static/images/questions/", "")
            base_dir = Path(__file__).resolve().parent.parent.parent
            possible_paths = [
                base_dir / "static" / "images" / "questions" / rel_path,
                base_dir.parent.parent / "data" / "processed" / "crops" / rel_path,
                Path(qi_rec.file_path)
            ]
            for p in possible_paths:
                if p.exists() and p.is_file():
                    return FileResponse(str(p), media_type="image/png")
    except ValueError:
        pass
        
    # Search by filename match or relative path
    images_dir = Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed" / "crops"
    if images_dir.exists():
        for img_file in images_dir.rglob("*.png"):
            if image_id in img_file.name or image_id in str(img_file):
                return FileResponse(str(img_file), media_type="image/png")
            
    raise HTTPException(status_code=404, detail="Question image exhibit not found.")

@router.post(
    "/api/v1/arena/submit",
    response_model=SubmitResponseResult,
    summary="Submit student answer & calculate IRT / Spaced Repetition / BKT adjustments",
    description="Registers response logs, computes Bayesian EAP ability parameters (Theta), updates FSRS/SM-2, updates BKT topic mastery."
)
async def submit_response(
    request: SubmitResponseRequest,
    db: AsyncSession = Depends(get_async_session)
):
    try:
        # 1. Fetch Question
        q_stmt = select(Questions).where(Questions.id == request.question_id)
        q_res = await db.execute(q_stmt)
        question = q_res.scalars().first()

        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")

        # 2. Check correctness
        is_correct = (request.selected_option.strip() == question.correct_answer.strip())

        # 3. Log Performance
        log = PerformanceLog(
            user_id=request.user_id,
            question_id=request.question_id,
            is_correct=is_correct,
            response_time=request.response_time,
            confidence_level=request.confidence_level
        )
        db.add(log)
        await db.flush()

        # 4. Get Student State
        state_stmt = select(StudentState).where(StudentState.user_id == request.user_id)
        state_res = await db.execute(state_stmt)
        student_state = state_res.scalars().first()

        if not student_state:
            student_state = StudentState(user_id=request.user_id, theta=0.0, total_answered=0, is_adaptive=True)
            db.add(student_state)
            await db.flush()

        old_theta = student_state.theta

        # 5. Fetch past 5 performance logs with question parameters to update theta
        history_stmt = (
            select(PerformanceLog, Questions)
            .join(Questions, col(PerformanceLog.question_id) == col(Questions.id))
            .where(PerformanceLog.user_id == request.user_id)
            .order_by(col(PerformanceLog.timestamp).desc())
            .limit(5)
        )
        history_res = await db.execute(history_stmt)
        history_rows = history_res.all()

        params = []
        responses = []
        for pl, q in history_rows:
            a = q.discrimination_a if q.discrimination_a is not None else 1.0
            b = q.difficulty_b if q.difficulty_b is not None else 0.0
            c = q.guessing_c if q.guessing_c is not None else 0.25
            params.append((a, b, c))
            responses.append(1 if pl.is_correct else 0)

        # Update student ability estimation (Theta) - only if adaptive
        if student_state.is_adaptive:
            new_theta = IRTEngine.estimate_theta_eap(old_theta, params, responses)
        else:
            new_theta = old_theta # Control group stays static or updates via simple averages (here we keep theta static to show control)

        student_state.theta = new_theta
        student_state.total_answered += 1
        student_state.last_updated = datetime.now(timezone.utc)
        db.add(student_state)

        # 6. Update Spaced Repetition Metadata
        srs_stmt = select(SRSMetadata).where(
            SRSMetadata.user_id == request.user_id,
            SRSMetadata.question_id == request.question_id
        )
        srs_res = await db.execute(srs_stmt)
        srs_meta = srs_res.scalars().first()

        quality = SRSEngine.calculate_sm2_quality(is_correct, request.confidence_level)
        now = datetime.now(timezone.utc)

        if not srs_meta:
            srs_meta = SRSMetadata(
                user_id=request.user_id,
                question_id=request.question_id,
                stability=2.0,
                difficulty=3.0,
                interval=1.0,
                due_date=now,
                last_review=now
            )
            db.add(srs_meta)
            await db.flush()

        new_interval, new_stability, new_difficulty = SRSEngine.update_sm2_repetition(
            quality=quality,
            repetition_count=1 if srs_meta.interval <= 1.0 else 2,
            interval=srs_meta.interval,
            ease_factor=srs_meta.stability
        )

        srs_meta.interval = new_interval
        srs_meta.stability = new_stability
        srs_meta.difficulty = new_difficulty
        srs_meta.last_review = now
        srs_meta.due_date = now + timedelta(days=new_interval)
        db.add(srs_meta)

        # 7. Bayesian Knowledge Tracing (BKT) Update with Subject Fallback
        topic_name = None
        if question.subtopic_id:
            from app.models.student_stats import UserActivityLog
            activity_log = UserActivityLog(
                user_id=request.user_id,
                topic_id=question.subtopic_id,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(activity_log)

            syllabus_stmt = select(Syllabus).where(Syllabus.id == question.subtopic_id)
            syllabus_res = await db.execute(syllabus_stmt)
            syllabus = syllabus_res.scalars().first()
            if syllabus:
                topic_name = syllabus.name
        
        if not topic_name and question.subject:
            topic_name = question.subject

        if topic_name:
            # Fetch or create TopicMastery
            tm_stmt = select(TopicMastery).where(
                TopicMastery.user_id == request.user_id,
                TopicMastery.topic_name == topic_name
            )
            tm_res = await db.execute(tm_stmt)
            topic_mastery = tm_res.scalars().first()
            
            if not topic_mastery:
                topic_mastery = TopicMastery(
                    user_id=request.user_id,
                    topic_name=topic_name,
                    p_mastery=0.15,
                    p_transit=0.10
                )
                db.add(topic_mastery)
                await db.flush()
            
            # Map difficulty_b to 1-5 difficulty_level
            diff_b = question.difficulty_b if question.difficulty_b is not None else 0.0
            difficulty_level = round(3.0 + diff_b)
            difficulty_level = max(1, min(5, difficulty_level))
            
            # Perform BKT update
            bkt = BKTProcessor(p_init=0.15, p_transit=topic_mastery.p_transit)
            updated_p, _, _ = bkt.update_mastery(
                p_prev=topic_mastery.p_mastery,
                is_correct=is_correct,
                confidence_level=request.confidence_level,
                difficulty_level=difficulty_level
            )
            topic_mastery.p_mastery = updated_p
            db.add(topic_mastery)

        await db.commit()

        # Delta and percentage mappings
        theta_delta = new_theta - old_theta
        mastery_percentage = max(0.0, min(100.0, ((new_theta + 4.0) / 8.0) * 100.0))

        # Predictive Score Modeling
        predicted_score = 100.0 + (new_theta * 25.0)
        predicted_score = max(0.0, min(200.0, predicted_score))
        
        accuracy_margin = 40.0 / math.sqrt(student_state.total_answered + 1)

        return SubmitResponseResult(
            is_correct=is_correct,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            new_theta=new_theta,
            theta_delta=round(theta_delta, 4),
            mastery_percentage=round(mastery_percentage, 2),
            predicted_score=round(predicted_score, 2),
            accuracy_margin=round(accuracy_margin, 2)
        )

    except HTTPException as he:
        await db.rollback()
        raise he
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Response submission failed: {str(e)}")


@router.post(
    "/api/v1/arena/submit-batch",
    response_model=SubmitBatchResult,
    summary="Submit complete Mock Test attempt batch with atomic DB persistence",
    description="Logs candidate performance for all mock items, updates Bayesian knowledge tracing (BKT), recalculates Expected A Posteriori (EAP) Theta, updates Spaced Repetition (SRS), and returns full official marking results."
)
async def submit_batch(
    request: SubmitBatchRequest,
    db: AsyncSession = Depends(get_async_session)
):
    try:
        if not request.answers:
            raise HTTPException(status_code=400, detail="Answer list cannot be empty.")

        now = datetime.now(timezone.utc)
        exam_type = request.exam_type or "UPSC"

        # Marking constants
        mark_per_correct = 2.0 if exam_type == "UPSC" else 0.83
        penalty_per_incorrect = 0.66 if exam_type == "UPSC" else 0.27
        cutoff_pct = 50.0 if exam_type == "UPSC" else 42.0

        # Fetch all target questions in one query
        q_ids = [a.question_id for a in request.answers]
        q_stmt = select(Questions).where(col(Questions.id).in_(q_ids))
        q_res = await db.execute(q_stmt)
        questions_map = {q.id: q for q in q_res.scalars().all()}

        # Fetch or initialize StudentState
        state_stmt = select(StudentState).where(StudentState.user_id == request.user_id)
        state_res = await db.execute(state_stmt)
        student_state = state_res.scalars().first()
        if not student_state:
            student_state = StudentState(user_id=request.user_id, theta=0.0, total_answered=0, is_adaptive=True)
            db.add(student_state)
            await db.flush()

        old_theta = student_state.theta

        correct_count = 0
        incorrect_count = 0
        unattempted_count = 0

        irt_params = []
        irt_responses = []

        # Process each answered item
        for ans in request.answers:
            q = questions_map.get(ans.question_id)
            if not q:
                continue

            sel = ans.selected_option.strip() if ans.selected_option else None
            conf = ans.confidence_level or 3
            resp_time = ans.response_time or 45.0

            if not sel:
                unattempted_count += 1
                continue

            is_corr = (sel == q.correct_answer.strip())
            if is_corr:
                correct_count += 1
            else:
                incorrect_count += 1

            # Log PerformanceLog
            log = PerformanceLog(
                user_id=request.user_id,
                question_id=q.id,
                is_correct=is_corr,
                response_time=resp_time,
                confidence_level=conf
            )
            db.add(log)

            # Accumulate IRT parameters for Theta estimation
            a = q.discrimination_a if q.discrimination_a is not None else 1.0
            b = q.difficulty_b if q.difficulty_b is not None else 0.0
            c = q.guessing_c if q.guessing_c is not None else 0.25
            irt_params.append((a, b, c))
            irt_responses.append(1 if is_corr else 0)

            # Update SRS item
            srs_stmt = select(SRSMetadata).where(
                SRSMetadata.user_id == request.user_id,
                SRSMetadata.question_id == q.id
            )
            srs_res = await db.execute(srs_stmt)
            srs_meta = srs_res.scalars().first()

            quality = SRSEngine.calculate_sm2_quality(is_corr, conf)
            if not srs_meta:
                srs_meta = SRSMetadata(
                    user_id=request.user_id,
                    question_id=q.id,
                    stability=2.0,
                    difficulty=3.0,
                    interval=1.0,
                    due_date=now,
                    last_review=now
                )
                db.add(srs_meta)
                await db.flush()

            new_interval, new_stability, new_difficulty = SRSEngine.update_sm2_repetition(
                quality=quality,
                repetition_count=1 if srs_meta.interval <= 1.0 else 2,
                interval=srs_meta.interval,
                ease_factor=srs_meta.stability
            )
            srs_meta.interval = new_interval
            srs_meta.stability = new_stability
            srs_meta.difficulty = new_difficulty
            srs_meta.last_review = now
            srs_meta.due_date = now + timedelta(days=new_interval)
            db.add(srs_meta)

            # BKT Topic update
            t_name = q.subject or "General Studies"
            if q.subtopic_id:
                syl_stmt = select(Syllabus).where(Syllabus.id == q.subtopic_id)
                syl_res = await db.execute(syl_stmt)
                syl = syl_res.scalars().first()
                if syl:
                    t_name = syl.name

            tm_stmt = select(TopicMastery).where(
                TopicMastery.user_id == request.user_id,
                TopicMastery.topic_name == t_name
            )
            tm_res = await db.execute(tm_stmt)
            topic_mastery = tm_res.scalars().first()

            if not topic_mastery:
                topic_mastery = TopicMastery(
                    user_id=request.user_id,
                    topic_name=t_name,
                    p_mastery=0.15,
                    p_transit=0.10
                )
                db.add(topic_mastery)
                await db.flush()

            diff_level = max(1, min(5, round(3.0 + (q.difficulty_b or 0.0))))
            bkt = BKTProcessor(p_init=0.15, p_transit=topic_mastery.p_transit)
            updated_p, _, _ = bkt.update_mastery(
                p_prev=topic_mastery.p_mastery,
                is_correct=is_corr,
                confidence_level=conf,
                difficulty_level=diff_level
            )
            topic_mastery.p_mastery = updated_p
            db.add(topic_mastery)

        # Update student global Theta via IRT EAP
        if irt_params:
            new_theta = IRTEngine.estimate_theta_eap(old_theta, irt_params, irt_responses)
            student_state.theta = new_theta
            student_state.total_answered += len(irt_params)
            student_state.last_updated = now
            db.add(student_state)
        else:
            new_theta = old_theta

        await db.commit()

        # Score computations
        raw_score = correct_count * mark_per_correct
        penalty = incorrect_count * penalty_per_incorrect
        net_score = max(0.0, raw_score - penalty)
        max_marks = len(request.answers) * mark_per_correct
        cutoff_marks = max_marks * (cutoff_pct / 100.0)
        cutoff_cleared = net_score >= cutoff_marks

        theta_delta = new_theta - old_theta
        mastery_pct = max(0.0, min(100.0, ((new_theta + 4.0) / 8.0) * 100.0))

        return SubmitBatchResult(
            total_items=len(request.answers),
            attempted=correct_count + incorrect_count,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            unattempted_count=unattempted_count,
            raw_score=round(raw_score, 2),
            penalty=round(penalty, 2),
            net_score=round(net_score, 2),
            max_marks=round(max_marks, 2),
            cutoff_cleared=cutoff_cleared,
            new_theta=round(new_theta, 4),
            theta_delta=round(theta_delta, 4),
            mastery_percentage=round(mastery_pct, 2)
        )

    except HTTPException as he:
        await db.rollback()
        raise he
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Batch test submission failed: {str(e)}")

@router.get(
    "/api/v1/arena/explain/{question_id}",
    response_model=ExplainResponse,
    summary="Get dynamic AI explanation based on student theta level",
    description="Asynchronously streams or fetches Gemini 1.5 Flash generated personalized explanations based on student current level."
)
async def explain_question(
    question_id: uuid.UUID,
    user_id: str = Query(..., description="Student identifier"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        # 1. Fetch Question
        q_stmt = select(Questions).where(Questions.id == question_id)
        q_res = await db.execute(q_stmt)
        question = q_res.scalars().first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")

        # 2. Fetch last attempt
        attempt_stmt = (
            select(PerformanceLog)
            .where(PerformanceLog.user_id == user_id, PerformanceLog.question_id == question_id)
            .order_by(col(PerformanceLog.timestamp).desc())
        )
        attempt_res = await db.execute(attempt_stmt)
        attempt = attempt_res.scalars().first()
        selected_option = attempt.selected_option if (attempt and hasattr(attempt, 'selected_option')) else "N/A"
        if attempt and not hasattr(attempt, 'selected_option'):
            selected_option = "Incorrect Choice" if not attempt.is_correct else question.correct_answer

        # 3. Fetch Student State
        state_stmt = select(StudentState).where(StudentState.user_id == user_id)
        state_res = await db.execute(state_stmt)
        student_state = state_res.scalars().first()
        theta = student_state.theta if student_state else 0.0

        explanation = await TutorService.generate_explanation(
            question_text=question.text,
            correct_answer=question.correct_answer,
            student_answer=selected_option,
            theta=theta
        )

        return ExplainResponse(explanation=explanation)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")

@router.get(
    "/api/v1/arena/mastery-map",
    response_model=MasteryMapResponse,
    summary="Get BKT subtopic mastery map data",
    description="Returns BKT calculated mastery percentages for each subtopic to populate the radar chart."
)
async def get_mastery_map(
    user_id: str = Query(..., description="Student identifier"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        stmt = select(TopicMastery).where(TopicMastery.user_id == user_id)
        res = await db.execute(stmt)
        masteries = res.scalars().all()

        mastery_map = {}
        for tm in masteries:
            mastery_map[tm.topic_name] = round(tm.p_mastery * 100.0, 2)

        default_topics = ["Indian Polity", "Geography", "Modern History", "General Science"]
        for topic in default_topics:
            if topic not in mastery_map:
                mastery_map[topic] = 15.0

        return MasteryMapResponse(mastery_map=mastery_map)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mastery map: {str(e)}")

@router.get(
    "/api/v1/arena/session-report",
    response_model=SessionReportResponse,
    summary="Generate session report after 10 questions",
    description="Calculates theta ability growth, BKT mastery shift, and UPSC/CDS predictive scores based on the last 10 attempts."
)
async def get_session_report(
    user_id: str = Query(..., description="Student identifier"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        state_stmt = select(StudentState).where(StudentState.user_id == user_id)
        state_res = await db.execute(state_stmt)
        student_state = state_res.scalars().first()
        if not student_state:
            raise HTTPException(status_code=404, detail="Student state not found.")

        # Get performance logs
        stmt = (
            select(PerformanceLog, Questions)
            .join(Questions, col(PerformanceLog.question_id) == col(Questions.id))
            .where(PerformanceLog.user_id == user_id)
            .order_by(col(PerformanceLog.timestamp).asc())
        )
        res = await db.execute(stmt)
        all_logs = res.all()

        if not all_logs:
            return SessionReportResponse(
                theta_progress="No sufficient attempts recorded to calculate progress.",
                bkt_mastery="No subtopic mastery calibration available yet.",
                predictive_score="Insufficient data to compute predicted UPSC score."
            )

        total_logs = len(all_logs)
        session_size = min(10, total_logs)
        history_excluding_last_10 = all_logs[:-session_size]

        if history_excluding_last_10:
            params = []
            responses = []
            for pl, q in history_excluding_last_10:
                a = q.discrimination_a if q.discrimination_a is not None else 1.0
                b = q.difficulty_b if q.difficulty_b is not None else 0.0
                c = q.guessing_c if q.guessing_c is not None else 0.25
                params.append((a, b, c))
                responses.append(1 if pl.is_correct else 0)
            initial_theta = IRTEngine.estimate_theta_eap(0.0, params, responses)
        else:
            initial_theta = 0.0

        current_theta = student_state.theta
        mastery_now = max(0.0, min(100.0, ((current_theta + 4.0) / 8.0) * 100.0))
        mastery_then = max(0.0, min(100.0, ((initial_theta + 4.0) / 8.0) * 100.0))
        growth = mastery_now - mastery_then

        last_q = all_logs[-1][1]
        subject_name = last_q.exam_type or "General Studies"

        theta_progress = f"Your ability in {subject_name} grew by {growth:.1f}% during this session." if growth > 0 else f"Your ability in {subject_name} stabilized at {mastery_now:.1f}% mastery."

        # BKT Mastery
        tm_stmt = select(TopicMastery).where(TopicMastery.user_id == user_id)
        tm_res = await db.execute(tm_stmt)
        tm_list = tm_res.scalars().all()

        if tm_list:
            best_tm = sorted(tm_list, key=lambda x: x.p_mastery, reverse=True)[0]
            p = best_tm.p_mastery
            status = "Novice" if p < 0.40 else ("Competent" if p < 0.75 else "Expert")
            bkt_mastery = f"You have officially achieved '{status}' status in {best_tm.topic_name}."
        else:
            bkt_mastery = "No subtopic mastery calibration available yet."

        # Predicted Score
        predicted_score = 100.0 + (current_theta * 25.0)
        predicted_score = max(0.0, min(200.0, predicted_score))
        predictive_score = f"If the UPSC exam were today, your predicted score is {predicted_score:.0f}."

        return SessionReportResponse(
            theta_progress=theta_progress,
            bkt_mastery=bkt_mastery,
            predictive_score=predictive_score
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session report failed: {str(e)}")

@router.get(
    "/api/v1/arena/srs/dashboard",
    response_model=SRSDashboardResponse,
    summary="Fetch spaced repetition memory queue",
    description="Calculates urgency scores for all student attempts and returns questions sorted by highest decay risk."
)
async def srs_dashboard(
    user_id: str = Query(..., description="Student identifier"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        stmt = (
            select(SRSMetadata, Questions)
            .join(Questions, col(SRSMetadata.question_id) == col(Questions.id))
            .where(SRSMetadata.user_id == user_id)
        )
        res = await db.execute(stmt)
        rows = res.all()

        due_items = []
        for srs, q in rows:
            urgency = SRSEngine.calculate_urgency_score(srs)
            due_items.append(SRSDashboardItem(
                question_id=q.id,
                text=q.text,
                urgency_score=round(urgency, 4),
                due_date=srs.due_date.isoformat(),
                subject=q.subject
            ))

        due_items.sort(key=lambda x: x.urgency_score, reverse=True)

        return SRSDashboardResponse(due_questions=due_items)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SRS Dashboard failed: {str(e)}")

class AvailablePaper(BaseModel):
    id: str
    exam_type: str
    year: int
    session: Optional[str] = None
    subjects: List[str] = []
    question_count: int = 0
    display_name: str

@router.get(
    "/api/v1/arena/questions",
    response_model=List[NextQuestionResponse],
    summary="Fetch questions filtered by exam, year, session, subject, book, and source",
    description="Queries database questions with dual-track filters for Year-Wise Official Mocks and Omni-Source Adaptive Practice."
)
async def get_questions(
    exam_type: str = Query(..., description="UPSC or CDS"),
    year: Optional[int] = Query(None, description="Year of the exam paper"),
    session: Optional[str] = Query(None, description="Exam session: I or II (for CDS)"),
    subject: Optional[str] = Query(None, description="Subject area (e.g. English, General Knowledge, Mathematics)"),
    source_filter: Optional[str] = Query("ALL", description="ALL, PYQ_ONLY, or BOOKS_ONLY"),
    book_id: Optional[str] = Query(None, description="Filter by specific textbook UUID"),
    limit: int = Query(120, description="Max questions to return"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        stmt = select(Questions)
        if exam_type and exam_type != "ALL":
            stmt = stmt.where(Questions.exam_type == exam_type)
        if isinstance(year, int):
            stmt = stmt.where(Questions.year == year)
        if isinstance(session, str) and session.strip():
            stmt = stmt.where(Questions.session == session.strip().upper())
        if isinstance(subject, str) and subject.strip() and subject not in ("All", "Whole Paper", "All Subjects"):
            stmt = stmt.where(col(Questions.subject).ilike(f"%{subject.strip()}%"))
        
        # Source & Book filtering
        if book_id and book_id.strip():
            try:
                b_uuid = uuid.UUID(book_id.strip())
                stmt = stmt.where(col(Questions.book_id) == b_uuid)
            except ValueError:
                pass
        elif source_filter == "BOOKS_ONLY":
            stmt = stmt.where(col(Questions.source_type).in_(["TEXTBOOK_PRACTICE", "BOOK_PRACTICE", "BOOK_GROUNDED_AI"]))
        elif source_filter == "PYQ_ONLY":
            stmt = stmt.where(col(Questions.source_type) == "OFFICIAL_PYQ")
        
        limit_val = limit if isinstance(limit, int) else 120
        stmt = stmt.limit(limit_val)
        res = await db.execute(stmt)
        questions = res.scalars().all()
        
        q_ids = [q.id for q in questions]
        img_map: Dict[str, List[QuestionImages]] = {}
        if q_ids:
            img_stmt = select(QuestionImages).where(col(QuestionImages.question_id).in_(q_ids))
            img_res = await db.execute(img_stmt)
            for img in img_res.scalars().all():
                q_id_str = str(img.question_id)
                if q_id_str not in img_map:
                    img_map[q_id_str] = []
                img_map[q_id_str].append(img)

        result_list = []
        for q in questions:
            q_images = img_map.get(str(q.id), [])
            
            image_list = [
                {
                    "id": str(img.id),
                    "url": f"/api/v1/images/{img.id}",
                    "file_path": img.file_path,
                    "description": img.description or ""
                }
                for img in q_images
            ]
            
            source_label = f"Book: {q.book_chapter}" if q.book_chapter else (f"{q.exam_type} {q.year or 2026}{(' ' + q.session) if q.session else ''}")
            
            result_list.append(
                NextQuestionResponse(
                    id=q.id,
                    text=q.text,
                    options=q.options,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation,
                    images=image_list,
                    metadata={
                        "difficulty": q.difficulty_b or 0.5,
                        "discrimination": q.discrimination_a or 1.0,
                        "guessing": q.guessing_c or 0.25,
                        "subject": q.subject or "General Studies",
                        "year": q.year or 2026,
                        "session": q.session,
                        "exam_type": q.exam_type,
                        "source_type": q.source_type or "OFFICIAL_PYQ",
                        "book_id": str(q.book_id) if q.book_id else None,
                        "book_page_number": q.book_page_number,
                        "book_chapter": q.book_chapter,
                        "source": source_label
                    }
                )
            )
            
        return result_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch questions: {str(e)}")


@router.get(
    "/api/v1/arena/available-papers",
    response_model=List[AvailablePaper],
    summary="List available examination papers dynamically from database",
    description="Returns all distinct official exam paper combinations (exam, year, session, subjects) present in the database."
)
async def get_available_papers(
    exam_type: Optional[str] = Query(None, description="Filter by exam type: UPSC or CDS"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        # Strictly query distinct official PYQ papers with valid years for instant response
        stmt = select(
            Questions.exam_type, Questions.year, Questions.session, Questions.subject
        ).where(
            Questions.source_type == "OFFICIAL_PYQ",
            col(Questions.year).isnot(None)
        ).distinct()
        if exam_type:
            stmt = stmt.where(Questions.exam_type == exam_type)
        res = await db.execute(stmt)
        rows = res.all()

        # Group by (exam_type, year, session)
        papers_map: Dict[str, Dict[str, Any]] = {}
        for e_type, yr, sess, subj in rows:
            e_type = e_type or "CDS"
            yr = yr or 2026
            sess = sess if e_type == "CDS" else None
            
            # Key identifier
            key = f"{e_type}-{yr}-{sess or 'NONE'}"
            if key not in papers_map:
                if e_type == "CDS":
                    disp = f"CDS {yr} {sess}" if sess else f"CDS {yr}"
                else:
                    disp = f"UPSC CSE {yr}"

                papers_map[key] = {
                    "id": key.lower(),
                    "exam_type": e_type,
                    "year": yr,
                    "session": sess,
                    "subjects": set(),
                    "question_count": 0,
                    "display_name": disp
                }

            if subj:
                papers_map[key]["subjects"].add(subj)
            papers_map[key]["question_count"] += 1

        result = []
        for p in papers_map.values():
            result.append(AvailablePaper(
                id=p["id"],
                exam_type=p["exam_type"],
                year=p["year"],
                session=p["session"],
                subjects=sorted(list(p["subjects"])),
                question_count=p["question_count"],
                display_name=p["display_name"]
            ))

        # Sort newest year first, then session II before I
        result.sort(key=lambda x: (x.year, x.session or ""), reverse=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch available papers: {str(e)}")





