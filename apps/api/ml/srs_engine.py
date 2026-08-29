import math
from datetime import datetime, timedelta
from typing import Tuple
from sqlmodel import Session, select
from app.models.student_stats import SRSMetadata

class SRSEngine:
    @staticmethod
    def calculate_sm2_quality(is_correct: bool, confidence_level: int) -> int:
        """
        Maps response accuracy and metacognitive confidence level (1-5) to SM-2 quality (0-5).
        - Correct & Certain -> 5
        - Correct & Guess -> 3
        - Incorrect & Confident (Trap) -> 0
        - Incorrect & Expected -> 2
        """
        if is_correct:
            if confidence_level == 5:
                return 5
            elif confidence_level >= 3:
                return 4
            else:
                return 3  # Correct by guess
        else:
            if confidence_level == 5:
                return 0  # High confidence slip / Trap
            elif confidence_level >= 3:
                return 1
            else:
                return 2  # Low confidence incorrect / Expected

    @staticmethod
    def update_srs_metadata(
        db: Session,
        user_id: str,
        question_id: str,
        is_correct: bool,
        confidence_level: int
    ) -> SRSMetadata:
        """
        Updates stability, difficulty, interval, and due_date for a reviewed question.
        Returns the updated SRSMetadata object.
        """
        # Find existing SRSMetadata or create a new one
        stmt = select(SRSMetadata).where(
            SRSMetadata.user_id == user_id,
            SRSMetadata.question_id == question_id
        )
        srs_meta = db.exec(stmt).first()

        now = datetime.utcnow()
        quality = SRSEngine.calculate_sm2_quality(is_correct, confidence_level)

        if not srs_meta:
            # First-time insertion
            srs_meta = SRSMetadata(
                user_id=user_id,
                question_id=question_id,
                stability=2.0,
                difficulty=3.0,
                interval=1.0,
                due_date=now,
                sa_column_kwargs={"index": True}
            )
            db.add(srs_meta)
            db.commit()
            db.refresh(srs_meta)

        stability = srs_meta.stability
        difficulty = srs_meta.difficulty
        interval = srs_meta.interval

        # Apply SM-2 update logic
        if quality < 3:
            # Reset intervals on failure
            interval = 1.0
            stability = max(1.3, stability - 0.3)
            difficulty = min(5.0, difficulty + 0.5)
        else:
            # Successful recall
            if interval <= 1.0:
                interval = 1.0
            elif interval == 1.0:
                interval = 6.0
            else:
                interval = round(interval * stability)

            # Update stability based on quality
            stability = max(1.3, stability + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
            # Adjust difficulty parameter (1.0 to 5.0)
            difficulty = max(1.0, min(5.0, difficulty + (0.1 - (5 - quality) * 0.05)))

        # Update columns
        srs_meta.stability = stability
        srs_meta.difficulty = difficulty
        srs_meta.interval = interval
        srs_meta.last_review = now
        srs_meta.due_date = now + timedelta(days=interval)

        db.add(srs_meta)
        db.commit()
        db.refresh(srs_meta)
        return srs_meta

    @staticmethod
    def calculate_urgency_score(srs_meta: SRSMetadata) -> float:
        """
        Calculates Urgency Score based on time elapsed since the last review:
        Urgency = 1.0 - P_recall
        where P_recall = exp(-ln(2) * elapsed_days / stability)
        """
        now = datetime.utcnow()
        elapsed_time = now - srs_meta.last_review
        elapsed_days = elapsed_time.total_seconds() / 86400.0  # Convert to days

        # Compute probability of recall
        p_recall = math.exp(-math.log(2) * elapsed_days / max(srs_meta.stability, 0.1))
        
        # Urgency is probability of forgetting
        return max(0.0, min(1.0, 1.0 - p_recall))
