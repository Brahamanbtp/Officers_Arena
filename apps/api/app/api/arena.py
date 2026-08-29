import uuid
import math
import random
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import select
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

class NextQuestionResponse(BaseModel):
    id: uuid.UUID
    text: str
    options: Dict[str, Any]
    correct_answer: str
    explanation: Optional[str] = None
    metadata: Dict[str, Any]

class SRSDashboardItem(BaseModel):
    question_id: uuid.UUID
    text: str
    urgency_score: float
    due_date: str

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

        # 3. Query candidates
        q_stmt = select(Questions).where(Questions.exam_type == exam_type)
        q_res = await db.execute(q_stmt)
        candidates = [q for q in q_res.scalars().all() if q.id not in answered_ids]

        if not candidates:
            q_res = await db.execute(q_stmt)
            candidates = q_res.scalars().all()
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
                candidates.sort(key=lambda q: abs((q.difficulty_b if q.difficulty_b is not None else 0.0) - student_state.theta))
                selected_q = candidates[0]

        if not selected_q:
            raise HTTPException(status_code=404, detail="Could not select a matching question.")

        return NextQuestionResponse(
            id=selected_q.id,
            text=selected_q.text,
            options=selected_q.options,
            correct_answer=selected_q.correct_answer,
            explanation=selected_q.explanation,
            metadata={
                "difficulty": selected_q.difficulty_b or 0.0,
                "discrimination": selected_q.discrimination_a or 1.0,
                "guessing": selected_q.guessing_c or 0.25
            }
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Next question failed: {str(e)}")

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
            .join(Questions, PerformanceLog.question_id == Questions.id)
            .where(PerformanceLog.user_id == request.user_id)
            .order_by(PerformanceLog.timestamp.desc())
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
        student_state.last_updated = datetime.utcnow()
        db.add(student_state)

        # 6. Update Spaced Repetition Metadata
        srs_stmt = select(SRSMetadata).where(
            SRSMetadata.user_id == request.user_id,
            SRSMetadata.question_id == request.question_id
        )
        srs_res = await db.execute(srs_stmt)
        srs_meta = srs_res.scalars().first()

        quality = SRSEngine.calculate_sm2_quality(is_correct, request.confidence_level)
        now = datetime.utcnow()

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

        stability = srs_meta.stability
        difficulty = srs_meta.difficulty
        interval = srs_meta.interval

        # SM-2 intervals logic
        if quality < 3:
            interval = 1.0
            stability = max(1.3, stability - 0.3)
            difficulty = min(5.0, difficulty + 0.5)
        else:
            if interval <= 1.0:
                interval = 1.0
            elif interval == 1.0:
                interval = 6.0
            else:
                interval = round(interval * stability)
            stability = max(1.3, stability + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
            difficulty = max(1.0, min(5.0, difficulty + (0.1 - (5 - quality) * 0.05)))

        srs_meta.stability = stability
        srs_meta.difficulty = difficulty
        srs_meta.interval = interval
        srs_meta.last_review = now
        srs_meta.due_date = now + timedelta(days=interval)
        db.add(srs_meta)

        # 7. Bayesian Knowledge Tracing (BKT) Update
        if question.subtopic_id:
            from app.models.student_stats import UserActivityLog
            activity_log = UserActivityLog(
                user_id=request.user_id,
                topic_id=question.subtopic_id,
                timestamp=datetime.utcnow()
            )
            db.add(activity_log)

            syllabus_stmt = select(Syllabus).where(Syllabus.id == question.subtopic_id)
            syllabus_res = await db.execute(syllabus_stmt)
            syllabus = syllabus_res.scalars().first()
            
            if syllabus:
                topic_name = syllabus.name
                
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
                difficulty_level = int(round(3.0 + diff_b))
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
            .order_by(PerformanceLog.timestamp.desc())
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
            .join(Questions, PerformanceLog.question_id == Questions.id)
            .where(PerformanceLog.user_id == user_id)
            .order_by(PerformanceLog.timestamp.asc())
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
            .join(Questions, SRSMetadata.question_id == Questions.id)
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
                due_date=srs.due_date.isoformat()
            ))

        due_items.sort(key=lambda x: x.urgency_score, reverse=True)

        return SRSDashboardResponse(due_questions=due_items)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SRS Dashboard failed: {str(e)}")
