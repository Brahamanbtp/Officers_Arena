import uuid
import logging
from typing import List, Dict, Any
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Syllabus
from app.models.intelligence import TopicTrends
from ml.exam_trends.rotation_engine import RotationEngine

logger = logging.getLogger("ml.exam_trends.predictor")

class PredictiveMockGenerator:
    """
    PredictiveMockGenerator compiles future exam blueprints (e.g., UPSC 2027 / CDS 2026-II)
    by selecting high-recurrence Poisson topics and high-drift subtopics.
    """

    @classmethod
    async def generate_blueprint(
        cls,
        db: AsyncSession,
        exam_type: str,
        target_year: int = 2027,
        total_expected_questions: int = 100
    ) -> Dict[str, Any]:
        """
        Generates a 2027 Probable Syllabus Blueprint:
        1. Evaluates Poisson recurrence probability for all subtopics.
        2. Filters subtopics where P_recurrence > 0.75 or drift_index > 0.05.
        3. Allocates expected question counts based on composite scores.
        """
        logger.info(f"Generating predictive blueprint for exam={exam_type} | target_year={target_year}")

        # 1. Fetch all syllabus subtopics
        syl_stmt = select(Syllabus).where(
            Syllabus.level == "Subtopic",
            Syllabus.exam_type == exam_type
        )
        syl_res = await db.execute(syl_stmt)
        subtopics = syl_res.scalars().all()
        
        if not subtopics:
            return {"error": "No syllabus subtopics seeded in database."}

        # 2. Fetch TopicTrends to extract historical appearances and drift indices
        trend_stmt = select(TopicTrends).where(
            TopicTrends.exam_type == exam_type
        )
        trend_res = await db.execute(trend_stmt)
        all_trends = trend_res.scalars().all()

        # Group trend entries by topic_id
        topic_history: Dict[uuid.UUID, List[int]] = {}
        topic_drifts: Dict[uuid.UUID, float] = {}
        for tr in all_trends:
            tid = tr.topic_id
            if tid not in topic_history:
                topic_history[tid] = []
            topic_history[tid].append(tr.year)
            topic_drifts[tid] = max(topic_drifts.get(tid, 0.0), tr.drift_index)

        # 3. Calculate Poisson recurrence and identify candidates
        candidates = []
        total_weight = 0.0
        
        for sub in subtopics:
            history = topic_history.get(sub.id, [])
            
            # Poisson Recurrence calculation
            rot_metrics = RotationEngine.calculate_recurrence_probability(
                appearance_years=history,
                start_year=2009,
                target_year=target_year
            )
            p_rec = rot_metrics["recurrence_probability"]
            drift = topic_drifts.get(sub.id, 0.0)

            # Filter candidates: high recurrence (> 0.75) OR high drift (> 0.05)
            # Or if history is empty (cold-start topics), give a baseline probability of 0.20
            is_high_rec = p_rec > 0.75
            is_high_drift = drift > 0.05
            
            if is_high_rec or is_high_drift or not history:
                weight = p_rec * 0.7 + drift * 0.3
                if not history:
                    weight = 0.20 # baseline
                candidates.append({
                    "topic_id": sub.id,
                    "topic_name": sub.name,
                    "recurrence_probability": p_rec,
                    "drift_index": drift,
                    "allocation_weight": weight
                })
                total_weight += weight

        # 4. Proportional question allocation
        blueprint_items = []
        allocated_questions = 0
        
        if total_weight > 0.0 and candidates:
            # Sort candidates by weight
            candidates.sort(key=lambda x: x["allocation_weight"], reverse=True)
            
            for cand in candidates:
                share = cand["allocation_weight"] / total_weight
                q_count = int(round(share * total_expected_questions))
                # Ensure each candidate gets at least 1 question if weight is significant
                if q_count == 0 and cand["allocation_weight"] > 0.15:
                    q_count = 1
                    
                allocated_questions += q_count
                blueprint_items.append({
                    "topic_id": cand["topic_id"],
                    "topic_name": cand["topic_name"],
                    "recurrence_probability": cand["recurrence_probability"],
                    "drift_index": cand["drift_index"],
                    "expected_questions": q_count
                })
                
            # Adjust difference due to rounding
            diff = total_expected_questions - allocated_questions
            if diff != 0 and blueprint_items:
                # Add/subtract from top candidate
                blueprint_items[0]["expected_questions"] = max(0, blueprint_items[0]["expected_questions"] + diff)

        # Remove items with 0 expected questions to keep blueprint clean
        blueprint_items = [b for b in blueprint_items if b["expected_questions"] > 0]

        return {
            "target_year": target_year,
            "exam_type": exam_type,
            "total_questions_blueprint": total_expected_questions,
            "blueprint": blueprint_items
        }
