import logging
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger("services.priority")

class PriorityService:
    """
    Priority Service for calculating and explaining topic priority scores (P_s).
    Transforms raw scores into human-readable XAI justifications.
    """

    @staticmethod
    def generate_xai_justification(
        topic_name: str,
        freq_count: int,
        historical_freqs: List[int],
        priority_score: float,
        centrality_score: int = 3
    ) -> Dict[str, Any]:
        """
        Generates an Explainable AI (XAI) Justification Object breaking down the priority components.
        """
        # 1. Frequency Weight: count years out of last 5 with > 0 questions
        recent_5 = historical_freqs[-5:] if historical_freqs else []
        while len(recent_5) < 5:
            recent_5.insert(0, 0)
            
        appeared_years = sum(1 for f in recent_5 if f > 0)
        frequency_justification = f"Appeared in {appeared_years} of the last 5 years."

        # 2. Trend Momentum calculation
        # Compare base year (index 0) with target/last year (index -1)
        base_val = recent_5[0]
        latest_val = recent_5[-1]
        
        if base_val == 0:
            if latest_val > 0:
                trend_pct = 100.0
            else:
                trend_pct = 0.0
        else:
            trend_pct = round(((latest_val - base_val) / float(base_val)) * 100.0, 1)

        if trend_pct > 0:
            trend_justification = f"Appearance frequency has increased by {trend_pct}% since 2020."
        elif trend_pct < 0:
            trend_justification = f"Appearance frequency has decreased by {abs(trend_pct)}% since 2020."
        else:
            trend_justification = f"Appearance frequency remains stable since 2020."

        # 3. Centrality weightage
        centrality_justification = f"This topic is a prerequisite for {centrality_score} other high-weightage topics."

        # Radar chart/Progress bar components (normalized 0 to 100)
        recency_val = min(100.0, float(latest_val) * 25.0 if latest_val > 0 else 10.0)
        freq_val = min(100.0, float(freq_count) * 15.0)
        importance_val = min(100.0, priority_score * 100.0)

        return {
            "topic_name": topic_name,
            "priority_score": round(priority_score, 4),
            "justifications": {
                "frequency": frequency_justification,
                "trend": trend_justification,
                "centrality": centrality_justification
            },
            "metrics": {
                "recency": round(recency_val, 1),
                "frequency": round(freq_val, 1),
                "importance": round(importance_val, 1)
            }
        }
