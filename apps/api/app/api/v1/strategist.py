import uuid
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_async_session
from app.models.database import Syllabus
from app.models.student_stats import TopicMastery, StudentState
from app.models.intelligence import TopicTrends
from app.services.strategist_service import StrategistEngine
from app.services.behavior_service import BehaviorService

router = APIRouter()

class TopicDetail(BaseModel):
    topic_name: str
    priority: float
    mastery: float
    explanation: str

class QuadrantsGroup(BaseModel):
    Q1: List[TopicDetail] = []
    Q2: List[TopicDetail] = []
    Q3: List[TopicDetail] = []
    Q4: List[TopicDetail] = []

class ScheduleItem(BaseModel):
    activity: str
    duration_hours: float
    description: str
    quadrant: str
    badge: Optional[str] = None

class DailyPlanResponse(BaseModel):
    readiness_score: float
    bottlenecks: List[str]
    quadrants: QuadrantsGroup
    schedule: List[ScheduleItem]
    adherence_status: Dict[str, Any]
    behavioral_insight: str
    nudge_style: str
    nudge_message: Optional[str] = None

@router.get(
    "/api/v1/strategist/daily-plan",
    response_model=DailyPlanResponse,
    summary="Fetch dynamic study strategist daily plan",
    description="Groups syllabus subtopics into strategic quadrants, analyzes student behavior drift, and outputs a time-blocked study schedule."
)
async def get_daily_plan(
    user_id: str = Query(..., description="Student identifier"),
    hours: float = Query(..., ge=0.5, le=24.0, description="Available hours for study"),
    exam_type: str = Query(..., description="Exam type filter (e.g. UPSC, CDS)"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        # 1. Fetch Student State
        state_stmt = select(StudentState).where(StudentState.user_id == user_id)
        state_res = await db.execute(state_stmt)
        student_state = state_res.scalars().first()
        if not student_state:
            # Create a student state if it doesn't exist
            student_state = StudentState(user_id=user_id, theta=0.0, total_answered=0, is_adaptive=True)
            db.add(student_state)
            await db.flush()

        # 2. Fetch Syllabus (Subtopics) for the specific exam type (Exam Isolation)
        syl_stmt = select(Syllabus).where(
            Syllabus.exam_type == exam_type,
            Syllabus.level == "Subtopic"
        )
        syl_res = await db.execute(syl_stmt)
        subtopics = list(syl_res.scalars().all())

        if not subtopics:
            # Fallback to level="Topic" if no subtopics found
            syl_stmt = select(Syllabus).where(Syllabus.exam_type == exam_type)
            syl_res = await db.execute(syl_stmt)
            subtopics = list(syl_res.scalars().all())

        use_mock_data = False
        mock_items: List[Dict[str, Any]] = []
        if not subtopics:
            use_mock_data = True
            mock_items = [
                {"name": "Emergency Provisions (Article 352-360)", "priority": 0.85, "mastery": 0.15, "drift": 0.3},
                {"name": "Governor's Discretionary Powers", "priority": 0.78, "mastery": 0.65, "drift": 0.2},
                {"name": "Mapping of Indian Rivers and Lakes", "priority": 0.20, "mastery": 0.30, "drift": 0.1},
                {"name": "Carbon and its Compounds", "priority": 0.15, "mastery": 0.80, "drift": 0.05},
                {"name": "Attorney General & Solicitor General", "priority": 0.90, "mastery": 0.20, "drift": 0.4},
                {"name": "Fundamental Rights & Directive Principles", "priority": 0.88, "mastery": 0.75, "drift": 0.15}
            ]

        # Fetch all TopicTrends and TopicMastery records for bulk cache (performance optimization)
        trends = {}
        masteries = {}
        if not use_mock_data:
            trends_stmt = select(TopicTrends).where(TopicTrends.exam_type == exam_type)
            trends_res = await db.execute(trends_stmt)
            trends = {t.topic_id: t for t in trends_res.scalars().all()}

            masteries_stmt = select(TopicMastery).where(TopicMastery.user_id == user_id)
            masteries_res = await db.execute(masteries_stmt)
            masteries = {m.topic_name: m.p_mastery for m in masteries_res.scalars().all()}

        # 3. Behavior Deviation & Nudge Analysis
        q1_topic_names = []
        q4_topic_names = []
        if use_mock_data:
            for item in mock_items:
                name = str(item["name"])
                priority = float(item["priority"])
                mastery = float(item["mastery"])
                quadrant = StrategistEngine.get_quadrant(priority, mastery)
                if quadrant == "Q1":
                    q1_topic_names.append(name)
                elif quadrant == "Q4":
                    q4_topic_names.append(name)
        else:
            for sub in subtopics:
                trend = trends.get(sub.id)
                priority = trend.priority_score if trend else 0.15
                mastery = masteries.get(sub.name, 0.15)
                quadrant = StrategistEngine.get_quadrant(priority, mastery)
                if quadrant == "Q1":
                    q1_topic_names.append(sub.name)
                elif quadrant == "Q4":
                    q4_topic_names.append(sub.name)

        adherence_status, behavioral_insight, nudge_style, nudge_message, avoided_topics = await BehaviorService.get_behavior_metrics(
            db, user_id, exam_type, q1_topic_names, q4_topic_names
        )

        quadrant_lists = {"Q1": [], "Q2": [], "Q3": [], "Q4": []}
        weighted_mastery_sum = 0.0
        priority_weight_sum = 0.0

        if use_mock_data:
            for item in mock_items:
                name = str(item["name"])
                priority = float(item["priority"])
                
                # Recalibration Logic: Increase urgency weight if skipped
                if name in avoided_topics:
                    priority = min(1.0, priority + 0.15)

                mastery = float(item["mastery"])
                drift = float(item["drift"])

                quadrant = StrategistEngine.get_quadrant(priority, mastery)
                explanation = StrategistEngine.generate_explanation(name, priority, mastery, drift)

                detail = TopicDetail(
                    topic_name=name,
                    priority=round(priority, 3),
                    mastery=round(mastery, 3),
                    explanation=explanation
                )
                quadrant_lists[quadrant].append(detail)
                weighted_mastery_sum += (mastery * priority)
                priority_weight_sum += priority
        else:
            for sub in subtopics:
                trend = trends.get(sub.id)
                priority = trend.priority_score if trend else 0.15
                
                # Recalibration Logic: Increase urgency weight if skipped
                if sub.name in avoided_topics:
                    priority = min(1.0, priority + 0.15)

                drift = trend.drift_index if trend else 0.0
                mastery = masteries.get(sub.name, 0.15)

                quadrant = StrategistEngine.get_quadrant(priority, mastery)
                explanation = StrategistEngine.generate_explanation(sub.name, priority, mastery, drift)

                detail = TopicDetail(
                    topic_name=sub.name,
                    priority=round(priority, 3),
                    mastery=round(mastery, 3),
                    explanation=explanation
                )
                quadrant_lists[quadrant].append(detail)
                weighted_mastery_sum += (mastery * priority)
                priority_weight_sum += priority

        # 4. Readiness score calculation
        readiness_score = 50.0
        if priority_weight_sum > 0:
            readiness_score = (weighted_mastery_sum / priority_weight_sum) * 100.0

        # 5. Extract bottlenecks (Top Q1 priority issues)
        q1_sorted = sorted(quadrant_lists["Q1"], key=lambda x: x.priority, reverse=True)
        bottlenecks = [item.explanation for item in q1_sorted[:3]]

        # 6. Distribute study schedule hours
        quadrants_dict = {
            "Q1": [item.model_dump() for item in quadrant_lists["Q1"]],
            "Q2": [item.model_dump() for item in quadrant_lists["Q2"]],
            "Q3": [item.model_dump() for item in quadrant_lists["Q3"]],
            "Q4": [item.model_dump() for item in quadrant_lists["Q4"]]
        }
        schedule_data = StrategistEngine.distribute_hours(hours, quadrants_dict)

        schedule = []
        for idx, item in enumerate(schedule_data):
            # Dynamic Timeline Badging: Check if this activity corresponds to an avoided topic
            badge = None
            for av_topic in avoided_topics:
                if av_topic in item["activity"]:
                    badge = "Missed Yesterday" if idx % 2 == 0 else "Rescheduled"
                    break

            schedule.append(
                ScheduleItem(
                    activity=item["activity"],
                    duration_hours=item["duration_hours"],
                    description=item["description"],
                    quadrant=item["quadrant"],
                    badge=badge
                )
            )

        response_data = DailyPlanResponse(
            readiness_score=round(readiness_score, 1),
            bottlenecks=bottlenecks if bottlenecks else ["No major priority bottlenecks detected. Good job!"],
            quadrants=QuadrantsGroup(
                Q1=quadrant_lists["Q1"],
                Q2=quadrant_lists["Q2"],
                Q3=quadrant_lists["Q3"],
                Q4=quadrant_lists["Q4"]
            ),
            schedule=schedule,
            adherence_status=adherence_status,
            behavioral_insight=behavioral_insight,
            nudge_style=nudge_style,
            nudge_message=nudge_message
        )

        return response_data

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate study plan: {str(e)}")
