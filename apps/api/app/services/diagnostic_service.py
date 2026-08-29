import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_stats import StudentAttempt, StudentMastery, MetacognitiveStats
from ml.metacognitive.calibration import MetacognitiveCalibration

logger = logging.getLogger("services.diagnostic")

class DiagnosticService:
    @staticmethod
    async def initialize_student_profile(
        db: AsyncSession,
        user_id: str,
        exam_type: str,
        diagnostic_attempts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Receives diagnostic test outcomes and initializes Custom Baseline Mastery.
        
        Args:
            db: AsyncSession database handle.
            user_id: Unique identifier for the student.
            exam_type: "UPSC" or "CDS".
            diagnostic_attempts: List of dicts, each with:
                - subtopic_id: uuid.UUID
                - is_correct: bool
                - confidence_level: int
                - response_time: float
                - difficulty: int
        """
        now = datetime.utcnow()
        
        # 1. Group outcomes by subtopic_id
        subtopic_groups: Dict[uuid.UUID, List[Dict[str, Any]]] = {}
        for attempt_data in diagnostic_attempts:
            sub_id = uuid.UUID(str(attempt_data["subtopic_id"]))
            if sub_id not in subtopic_groups:
                subtopic_groups[sub_id] = []
            subtopic_groups[sub_id].append(attempt_data)
            
        initialized_subtopics = []
        calibration_scores = []
        
        # 2. Iterate through each subtopic group to calculate baseline mastery
        for sub_id, attempts in subtopic_groups.items():
            correct_count = sum(1 for a in attempts if a["is_correct"])
            total_count = len(attempts)
            success_rate = correct_count / total_count
            
            # Custom Baseline Mastery mapping:
            # 0% correct -> 0.15 (Default p_init)
            # 100% correct -> 0.75
            baseline_mastery = 0.15 + 0.60 * success_rate
            
            # Scale initial half life and stability index based on diagnostic performance
            initial_half_life = 1.0 + 4.0 * success_rate  # 1 to 5 days
            initial_stability = 2.0 + 2.0 * success_rate  # 2 to 4 stability index
            
            # Create StudentMastery record
            mastery = StudentMastery(
                user_id=user_id,
                subtopic_id=sub_id,
                exam_type=exam_type,
                mastery_score=baseline_mastery,
                half_life=initial_half_life,
                stability_factor=initial_stability,
                last_practiced=now,
                volatility=0.0,
                stability_index=1.0
            )
            db.add(mastery)
            
            # Create StudentAttempt records for the audit trail
            for a in attempts:
                cal_score = MetacognitiveCalibration.calculate_score(a["confidence_level"], a["is_correct"])
                calibration_scores.append(cal_score)
                
                db_attempt = StudentAttempt(
                    user_id=user_id,
                    subtopic_id=sub_id,
                    exam_type=exam_type,
                    is_correct=a["is_correct"],
                    response_time=a["response_time"],
                    confidence_level=a["confidence_level"],
                    timestamp=now,
                    difficulty_weight=float(a.get("difficulty", 3)) / 3.0,
                    calibration_impact=cal_score
                )
                db.add(db_attempt)
                
            initialized_subtopics.append({
                "subtopic_id": str(sub_id),
                "baseline_mastery": baseline_mastery,
                "initial_half_life_days": initial_half_life
            })
            
        # 3. Create or update MetacognitiveStats
        if calibration_scores:
            avg_cal = sum(calibration_scores) / len(calibration_scores)
            bias_type = MetacognitiveCalibration.get_bias_type(avg_cal)
            
            meta_stats = MetacognitiveStats(
                user_id=user_id,
                exam_type=exam_type,
                average_calibration=avg_cal,
                bias_type=bias_type
            )
            db.add(meta_stats)
            
        await db.commit()
        
        logger.info(f"Successfully onboarded student={user_id} for exam={exam_type} across {len(initialized_subtopics)} subtopics.")
        return {
            "user_id": user_id,
            "exam_type": exam_type,
            "initialized_subtopics_count": len(initialized_subtopics),
            "subtopics": initialized_subtopics
        }
