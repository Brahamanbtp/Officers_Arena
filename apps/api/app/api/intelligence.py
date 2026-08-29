import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_async_session
from app.models.intelligence import TopicTrends, CostLogs
from app.models.database import Syllabus
from app.services.analytics_service import AnalyticsService
from app.services.personalization_service import PersonalizationService
from ml.exam_trends.drift_analyzer import TrendAnalyzer
from ml.exam_trends.difficulty_analyzer import DifficultyEstimator

router = APIRouter()

class ExpertOverrideRequest(BaseModel):
    topic_id: uuid.UUID = Field(..., description="UUID of the syllabus topic/subtopic.")
    year: int = Field(..., description="Exam year.")
    exam_type: str = Field(..., description="UPSC or CDS")
    expert_weight: float = Field(..., ge=0.0, le=5.0, description="Expert weighting factor (e.g. 1.5).")
    expert_note: Optional[str] = Field(None, description="Expert reason for the override.")

class ExpertOverrideResponse(BaseModel):
    topic_id: uuid.UUID
    year: int
    exam_type: str
    previous_priority: float
    updated_priority: float
    expert_weight: float
    ai_reasoning: str

class DashboardSummaryResponse(BaseModel):
    radar_data: List[Dict[str, Any]] = Field(..., description="K-Means topic cluster distributions per year.")
    priority_list: List[Dict[str, Any]] = Field(..., description="Active topic priority scores with XAI reasonings.")
    student_gap: List[Dict[str, Any]] = Field(..., description="Personalized urgency rankings.")
    difficulty_trend: List[Dict[str, Any]] = Field(..., description="Complexity gradient timeline.")

@router.post(
    "/api/v1/intelligence/expert-override",
    response_model=ExpertOverrideResponse,
    summary="Human-in-the-Loop Expert Override",
    description="Allows subject matter experts to manually scale topic priority weights and triggers automatic recalculation and XAI update."
)
async def expert_override(
    request: ExpertOverrideRequest,
    db: AsyncSession = Depends(get_async_session)
):
    try:
        stmt = select(TopicTrends).where(
            TopicTrends.topic_id == request.topic_id,
            TopicTrends.year == request.year,
            TopicTrends.exam_type == request.exam_type
        )
        res = await db.execute(stmt)
        trend = res.scalars().first()
        
        if not trend:
            raise HTTPException(
                status_code=404,
                detail="No historical trends record found for this topic, year, and exam type."
            )
            
        previous_priority = trend.priority_score
        old_mult = trend.expert_weight * trend.cross_exam_factor
        base_ps = previous_priority / old_mult if old_mult > 0.0 else previous_priority
        
        updated_priority = base_ps * trend.cross_exam_factor * request.expert_weight
        updated_priority = max(0.0, min(1.0, updated_priority))
        
        sub_stmt = select(Syllabus).where(Syllabus.id == request.topic_id)
        sub_res = await db.execute(sub_stmt)
        sub_node = sub_res.scalars().first()
        topic_name = sub_node.name if sub_node else "Subtopic"
        
        new_reasoning = await AnalyticsService.generate_priority_reasoning(
            topic_name=topic_name,
            Ps=round(updated_priority, 4),
            w=max(0, request.year - 2021),
            t=0.33,
            c=0.5
        )
        
        trend.expert_weight = request.expert_weight
        trend.expert_note = request.expert_note
        trend.priority_score = round(updated_priority, 4)
        trend.ai_reasoning = new_reasoning
        
        audit_trail = CostLogs(
            task_name="Expert_Override_Audit",
            model_id=f"HITL-SME (Override Note: {request.expert_note or 'None'})",
            prompt_tokens=0,
            completion_tokens=0,
            tokens_used=0,
            cost_usd=0.0
        )
        db.add(audit_trail)
        await db.commit()
        await db.refresh(trend)
        
        return ExpertOverrideResponse(
            topic_id=trend.topic_id,
            year=trend.year,
            exam_type=trend.exam_type,
            previous_priority=previous_priority,
            updated_priority=trend.priority_score,
            expert_weight=trend.expert_weight,
            ai_reasoning=trend.ai_reasoning
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Expert override failed: {str(e)}"
        )

@router.get(
    "/api/v1/intelligence/dashboard-summary",
    response_model=DashboardSummaryResponse,
    summary="Fetch complete exam intelligence dashboard payload",
    description="Consolidates Semantic Drift radar charts, XAI Priority Lists, Personalized Urgency gaps, and historical Difficulty gradients."
)
async def get_dashboard_summary(
    user_id: str = Query(..., description="Student ID for personalized gaps."),
    exam_type: str = Query(..., description="UPSC or CDS"),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        # 1. Fetch Priority Lists
        trend_stmt = select(TopicTrends).where(
            TopicTrends.exam_type == exam_type
        ).order_by(TopicTrends.year.desc())
        trend_res = await db.execute(trend_stmt)
        trends = trend_res.scalars().all()
        
        # Batch load syllabus items for names
        topic_ids = list(set([t.topic_id for t in trends]))
        syl_stmt = select(Syllabus).where(Syllabus.id.in_(topic_ids))
        syl_res = await db.execute(syl_stmt)
        syl_map = {s.id: s.name for s in syl_res.scalars().all()}
        
        priority_list = []
        for t in trends:
            priority_list.append({
                "topic_id": t.topic_id,
                "topic_name": syl_map.get(t.topic_id, "Subtopic"),
                "year": t.year,
                "priority_score": t.priority_score,
                "drift_index": t.drift_index,
                "ai_reasoning": t.ai_reasoning or ""
            })
            
        # 2. Fetch Personalized Urgency Gaps
        student_gap = await PersonalizationService.get_personalized_urgency(
            db=db,
            user_id=user_id,
            exam_type=exam_type,
            year=2026
        )
        
        # 3. Generate Semantic Drift Radar Data (K-Means)
        # Mock high-dimensional embeddings for K-Means (10 embeddings across 2024-2025)
        np_seed = 42
        import numpy as np
        np.random.seed(np_seed)
        mock_embs = [np.random.rand(1536) for _ in range(10)]
        mock_years = [2024]*5 + [2025]*5
        drift_clusters = TrendAnalyzer.identify_topic_shifts(mock_embs, mock_years, n_clusters=3)
        radar_raw = drift_clusters.get("radar_data", [])
        
        # Structure for Recharts radar chart compatibility:
        # Each item represents a year with topic cluster percentages
        radar_data = []
        for r in radar_raw:
            radar_data.append({
                "year": str(r["year"]),
                "Cluster_1_Static": r["distribution"][0],
                "Cluster_2_Dynamic": r["distribution"][1],
                "Cluster_3_Applied": r["distribution"][2]
            })
            
        # 4. Generate Difficulty Complexity Gradient
        # Create mock questions list over years 2021-2026 to run gradient calculations
        yearly_questions = {}
        correct_vectors_by_year = {}
        distractor_vectors_by_year = {}
        
        for yr in range(2021, 2027):
            # 5 mock questions per year
            yearly_questions[yr] = [
                {"text": f"Question {i} text describing structural concepts of federalism."} for i in range(5)
            ]
            correct_vectors_by_year[yr] = [np.random.rand(1536) for _ in range(5)]
            distractor_vectors_by_year[yr] = [[np.random.rand(1536) for _ in range(3)] for _ in range(5)]
            
        difficulty_trend = DifficultyEstimator.calculate_difficulty_gradient(
            yearly_questions=yearly_questions,
            correct_vectors_by_year=correct_vectors_by_year,
            distractor_vectors_by_year=distractor_vectors_by_year
        )
        
        return DashboardSummaryResponse(
            radar_data=radar_data,
            priority_list=priority_list,
            student_gap=student_gap,
            difficulty_trend=difficulty_trend
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compile dashboard summary payload: {str(e)}"
        )
