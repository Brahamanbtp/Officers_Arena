import os
import math
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.intelligence import TopicTrends

logger = logging.getLogger("services.analytics")

class AnalyticsService:
    """
    Analytics Service for Student performance analysis and Exam Intelligence.
    Computes rolling performance volatility, Topic Priority Scores, and triggers XAI.
    """
    
    @staticmethod
    def calculate_volatility(attempts_is_correct: List[bool], window_size: int = 5) -> float:
        """
        Calculates the rolling volatility (standard deviation of correctness outcomes)
        for the last N attempts of a student.
        """
        recent_attempts = attempts_is_correct[-window_size:]
        n = len(recent_attempts)
        
        if n < 2:
            return 0.0
            
        values = [1.0 if x else 0.0 for x in recent_attempts]
        mean = sum(values) / n
        variance = sum((val - mean) ** 2 for val in values) / n
        return math.sqrt(variance)

    @staticmethod
    def calculate_priority_score(
        freq_count: int,
        max_freq: int,
        historical_freqs: List[int],
        subtopic_vector: Optional[np.ndarray] = None,
        recent_news_vector: Optional[np.ndarray] = None,
        w1: float = 0.4,
        w2: float = 0.3,
        w3: float = 0.3
    ) -> float:
        """
        Calculates Priority Score: P_s = (w1 * Freq) + (w2 * Trend) + (w3 * CurrentAffairLink)
        """
        norm_freq = float(freq_count) / float(max_freq) if max_freq > 0 else 0.0
        
        recent_history = historical_freqs[-3:] if historical_freqs else []
        while len(recent_history) < 3:
            recent_history.insert(0, 0)
        mean_trend = sum(recent_history) / 3.0
        norm_trend = mean_trend / float(max_freq) if max_freq > 0 else 0.0

        current_affair_link = 0.0
        if subtopic_vector is not None and recent_news_vector is not None:
            norm_sub = np.linalg.norm(subtopic_vector)
            norm_news = np.linalg.norm(recent_news_vector)
            if norm_sub > 0.0 and norm_news > 0.0:
                current_affair_link = float(np.dot(subtopic_vector, recent_news_vector) / (norm_sub * norm_news))
                current_affair_link = max(0.0, min(1.0, current_affair_link))
                
        priority_score = (w1 * norm_freq) + (w2 * norm_trend) + (w3 * current_affair_link)
        return round(priority_score, 4)

    @classmethod
    async def generate_priority_reasoning(
        cls,
        topic_name: str,
        Ps: float,
        w: int,
        t: float,
        c: float,
        api_key: Optional[str] = None
    ) -> str:
        """
        Queries a lightweight LLM (gpt-4o-mini) to generate a 1-sentence 
        professional explanation for the topic ranking (max 150 characters).
        """
        key = api_key or os.environ.get("OPENAI_API_KEY")
        if not key:
            # Deterministic mock fallback for local testing
            if Ps >= 0.70:
                reason = f"Ranked high due to a {w}-year appearance gap and strong alignment with current affairs."
            elif Ps >= 0.40:
                reason = f"Moderately prioritized based on consistent 3-year frequency trends."
            else:
                reason = f"Lower priority reflecting recent appearances and low recent news overlap."
            return reason[:150]

        from openai import OpenAI
        try:
            client = OpenAI(api_key=key)
            prompt = (
                f"Topic: {topic_name}. Priority Score: {Ps}. "
                f"Metrics: WaitTime={w} years, 3-yr Trend={t}, Current Affair Similarity={c}. "
                f"Generate a 1-sentence professional explanation for a student why this topic is ranked this way."
            )
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful EdTech tutor. Output exactly one sentence, max 150 characters."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=60,
                temperature=0.2
            )
            reasoning = response.choices[0].message.content.strip()
            if reasoning.startswith('"') and reasoning.endswith('"'):
                reasoning = reasoning[1:-1]
            return reasoning[:150]
        except Exception as e:
            logger.error(f"XAI reasoning generation failed: {e}")
            return f"Ranked at {Ps} reflecting a {w}-year gap and recent news relevance."

    @classmethod
    async def persist_topic_trends(
        cls,
        db: AsyncSession,
        topic_id: Any,
        year: int,
        exam_type: str,
        freq_count: int,
        max_freq: int,
        historical_freqs: List[int],
        drift_index: float = 0.0,
        subtopic_vector: Optional[np.ndarray] = None,
        recent_news_vector: Optional[np.ndarray] = None,
        expert_weight: float = 1.0,
        expert_note: Optional[str] = None,
        cross_exam_factor: float = 1.0,
        topic_name: str = "Subtopic"
    ) -> TopicTrends:
        """
        Calculates priority score with Leading Indicators (CDS synergy) and HITL Override.
        Then, queries XAI reasonings and commits to TopicTrends table.
        """
        # 1. Base priority score
        base_ps = cls.calculate_priority_score(
            freq_count=freq_count,
            max_freq=max_freq,
            historical_freqs=historical_freqs,
            subtopic_vector=subtopic_vector,
            recent_news_vector=recent_news_vector
        )

        # 2. Scale by cross exam leading indicator synergy factor
        ps_scaled = base_ps * cross_exam_factor

        # 3. Multiply by expert HITL weight
        ps_final = ps_scaled * expert_weight
        ps_final = max(0.0, min(1.0, ps_final))  # Clamp value to bounds

        # Context metrics for XAI call
        last_year = max(historical_freqs) if historical_freqs else (year - 1)
        wait_time = max(0, year - last_year)
        
        recent_history = historical_freqs[-3:] if historical_freqs else []
        t_val = sum(recent_history) / len(recent_history) if recent_history else 0.0
        
        c_val = 0.0
        if subtopic_vector is not None and recent_news_vector is not None:
            norm_sub = np.linalg.norm(subtopic_vector)
            norm_news = np.linalg.norm(recent_news_vector)
            if norm_sub > 0.0 and norm_news > 0.0:
                c_val = float(np.dot(subtopic_vector, recent_news_vector) / (norm_sub * norm_news))

        # 4. Generate reasoning text
        ai_reasoning = await cls.generate_priority_reasoning(
            topic_name=topic_name,
            Ps=round(ps_final, 4),
            w=wait_time,
            t=round(t_val, 4),
            c=round(c_val, 4)
        )

        # 5. Save/Update DB record
        trend_stmt = select(TopicTrends).where(
            TopicTrends.topic_id == topic_id,
            TopicTrends.year == year,
            TopicTrends.exam_type == exam_type
        )
        res = await db.execute(trend_stmt)
        trend = res.scalars().first()

        if not trend:
            trend = TopicTrends(
                topic_id=topic_id,
                year=year,
                exam_type=exam_type,
                freq_count=freq_count,
                priority_score=round(ps_final, 4),
                drift_index=drift_index,
                cross_exam_factor=cross_exam_factor,
                expert_weight=expert_weight,
                expert_note=expert_note,
                ai_reasoning=ai_reasoning
            )
            db.add(trend)
        else:
            trend.freq_count = freq_count
            trend.priority_score = round(ps_final, 4)
            trend.drift_index = drift_index
            trend.cross_exam_factor = cross_exam_factor
            trend.expert_weight = expert_weight
            trend.expert_note = expert_note
            trend.ai_reasoning = ai_reasoning

        await db.commit()
        await db.refresh(trend)
        return trend
