import uuid
import logging
from datetime import datetime
from sqlmodel import select

from app.core.database import async_session_maker
from app.models.student_stats import StudentAttempt, StudentMastery
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger("tasks.student")

# Configurable constants for research phase tuning
VOLATILITY_THRESHOLD = 0.40
MASTERY_THRESHOLD = 0.70
WINDOW_SIZE = 5

async def flag_fragile_learning(
    user_id: str,
    subtopic_id: uuid.UUID,
    exam_type: str
):
    """
    Asynchronous background task to evaluate volatility, stability index, 
    and identify fragile learning conditions for a student's subtopic.
    """
    logger.info(f"Background Task: Checking fragile learning for user={user_id}, subtopic={subtopic_id}")
    
    async with async_session_maker() as session:
        try:
            # 1. Fetch chronological list of attempts
            stmt = (
                select(StudentAttempt.is_correct)
                .where(
                    StudentAttempt.user_id == user_id,
                    StudentAttempt.subtopic_id == subtopic_id,
                    StudentAttempt.exam_type == exam_type
                )
                .order_by(StudentAttempt.timestamp)
            )
            res = await session.execute(stmt)
            outcomes = list(res.scalars().all())
            
            if not outcomes:
                logger.warning(f"No attempts found for user={user_id}, subtopic={subtopic_id}")
                return
                
            # 2. Calculate rolling volatility
            volatility = AnalyticsService.calculate_volatility(outcomes, window_size=WINDOW_SIZE)
            
            # 3. Retrieve student mastery record
            mastery_stmt = select(StudentMastery).where(
                StudentMastery.user_id == user_id,
                StudentMastery.subtopic_id == subtopic_id,
                StudentMastery.exam_type == exam_type
            )
            mastery_res = await session.execute(mastery_stmt)
            mastery = mastery_res.scalars().first()
            
            if not mastery:
                logger.warning(f"Mastery record not found for user={user_id}, subtopic={subtopic_id}")
                return
                
            # 4. Update volatility and stability_index
            mastery.volatility = volatility
            mastery.stability_index = mastery.mastery_score * (1.0 - volatility)
            
            # 5. Evaluate Fragile Learning criteria
            if mastery.mastery_score > MASTERY_THRESHOLD and volatility > VOLATILITY_THRESHOLD:
                mastery.is_fragile = True
                mastery.needs_deep_review = True
                logger.info(
                    f"FRAGILE LEARNING DETECTED: user={user_id}, subtopic={subtopic_id} | "
                    f"Mastery={mastery.mastery_score:.4f}, Volatility={volatility:.4f} -> Flagged is_fragile=True"
                )
            else:
                mastery.is_fragile = False
                mastery.needs_deep_review = False
                
            # Save updates
            await session.commit()
            
        except Exception as e:
            logger.error(f"Error in background task flag_fragile_learning: {str(e)}", exc_info=True)
            # Rollback to avoid corrupt transaction state
            await session.rollback()
