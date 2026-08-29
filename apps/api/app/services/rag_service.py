from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.student_stats import TopicMastery

class RAGService:
    @staticmethod
    async def get_student_mastery_instruction(
        db: AsyncSession,
        user_id: str,
        topic_name: str
    ) -> str:
        """
        Queries student stats for mastery score and injects pedagogical
        language instructions depending on the cognitive level.
        """
        # Query TopicMastery for the subtopic/topic
        stmt = select(TopicMastery).where(
            TopicMastery.user_id == user_id,
            TopicMastery.topic_name == topic_name
        )
        try:
            res = await db.execute(stmt)
            record = res.scalars().first()
            score = record.p_mastery if record else 0.15
        except Exception:
            score = 0.15

        # Prompt Injection Logic based on score thresholds
        if score < 0.4:
            return (
                "Instruction: Use 8th-grade vocabulary, explain basic terms like 'Preamble' "
                "or 'Integer' explicitly, and use real-world analogies."
            )
        elif score > 0.8:
            return (
                "Instruction: Use technical legal/mathematical terminology and link to "
                "advanced Constitutional Articles or Theorem derivations."
            )
        else:
            return (
                "Instruction: Maintain standard Socratic guidance. Help the user establish "
                "logical connections without giving away direct answers."
            )
