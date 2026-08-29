import uuid
import logging
from typing import List, Dict, Any, Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.intelligence import TopicTrends
from app.models.database import Syllabus
from app.models.student_stats import StudentAttempt, StudentMastery

logger = logging.getLogger("services.personalization")

class PersonalizationService:
    """
    PersonalizationService calculates customized topic priorities for individual students
    by combining general exam priority scores with student gap analysis.
    """

    @classmethod
    async def get_personalized_urgency(
        cls,
        db: AsyncSession,
        user_id: str,
        exam_type: str,
        year: int = 2026
    ) -> List[Dict[str, Any]]:
        """
        Calculates Personalized Urgency for all active topics of the student:
        U_p = P_s * (1.0 - Accuracy_user)
        
        Args:
            db: AsyncSession database handle.
            user_id: Unique student ID.
            exam_type: "UPSC" or "CDS".
            year: The target trend evaluation year.
            
        Returns:
            List[Dict] containing topic names, general priority, accuracy, and personalized urgency.
        """
        logger.info(f"Computing Personalized Urgency list for user={user_id} | exam={exam_type}")

        # 1. Fetch all TopicTrends for the latest year and exam type
        trend_stmt = select(TopicTrends).where(
            TopicTrends.year == year,
            TopicTrends.exam_type == exam_type
        )
        trend_res = await db.execute(trend_stmt)
        trends = trend_res.scalars().all()
        
        if not trends:
            logger.warning(f"No TopicTrends found for year={year}, exam={exam_type}. Returning empty list.")
            return []

        # 2. Fetch all Syllabus items in a batch to avoid N+1 queries
        topic_ids = [t.topic_id for t in trends]
        syl_stmt = select(Syllabus).where(Syllabus.id.in_(topic_ids))
        syl_res = await db.execute(syl_stmt)
        syllabus_map = {s.id: s for s in syl_res.scalars().all()}

        # 3. Fetch Student Attempts for this user to calculate user accuracy per topic
        # Group by topic (subtopic_id)
        att_stmt = select(StudentAttempt).where(
            StudentAttempt.user_id == user_id,
            StudentAttempt.exam_type == exam_type
        )
        att_res = await db.execute(att_stmt)
        attempts = att_res.scalars().all()

        # Group attempts: topic_id -> (correct_count, total_count)
        attempt_stats: Dict[uuid.UUID, List[int]] = {}
        for att in attempts:
            sub_id = att.subtopic_id
            if sub_id not in attempt_stats:
                attempt_stats[sub_id] = [0, 0]
            
            attempt_stats[sub_id][1] += 1
            if att.is_correct:
                attempt_stats[sub_id][0] += 1

        # 4. Compute Personalized Urgency (U_p)
        personalized_list = []
        for trend in trends:
            t_id = trend.topic_id
            syl_node = syllabus_map.get(t_id)
            topic_name = syl_node.name if syl_node else "Unknown Subtopic"
            parent_name = ""
            
            # Find subject or topic parent if available
            if syl_node and syl_node.parent_id:
                p_node = syllabus_map.get(syl_node.parent_id)
                if p_node:
                    parent_name = p_node.name

            # Calculate accuracy: default to 0.0 if no attempts
            correct, total = attempt_stats.get(t_id, [0, 0])
            accuracy = float(correct) / float(total) if total > 0 else 0.0

            # Formula: U_p = P_s * (1.0 - Accuracy_user)
            urgency = trend.priority_score * (1.0 - accuracy)

            personalized_list.append({
                "topic_id": t_id,
                "topic_name": topic_name,
                "parent_name": parent_name,
                "priority_score": trend.priority_score,
                "user_accuracy": round(accuracy, 4),
                "personalized_urgency": round(urgency, 4),
                "ai_reasoning": trend.ai_reasoning or ""
            })

        # Sort descending by personalized urgency
        personalized_list.sort(key=lambda x: x["personalized_urgency"], reverse=True)
        return personalized_list
