import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.models.student_stats import StudentMastery, MetacognitiveStats
from ml.retention.hlr_engine import HLREngine

logger = logging.getLogger("services.xai")

class XAIFeedbackService:
    """
    Explainable AI (XAI) Feedback Service.
    Converts student machine learning metrics (BKT, HLR, Calibration) 
    into actionable, human-readable cognitive coaching advice.
    """
    
    @staticmethod
    def generate_feedback(
        subtopic_name: str,
        mastery: StudentMastery,
        meta_stats: Optional[MetacognitiveStats] = None
    ) -> Dict[str, str]:
        """
        Generates feedback messages for calibration, recall probability, and memory stability.
        """
        now = datetime.utcnow()
        delta_t_days = (now - mastery.last_practiced).total_seconds() / 86400.0
        recall_prob = HLREngine.calculate_recall_probability(mastery.half_life, delta_t_days)
        
        # 1. Calibration feedback
        calibration_msg = f"You are well-calibrated in '{subtopic_name}'. Your confidence matches your actual performance."
        if meta_stats:
            avg_cal = meta_stats.average_calibration
            if avg_cal > 0.3:
                calibration_msg = f"You are overconfident in '{subtopic_name}'. You're answering quickly but missing nuances."
            elif avg_cal < -0.3:
                calibration_msg = f"You are underconfident in '{subtopic_name}'. You know the material better than your confidence indicates."

        # 2. Recall feedback
        if recall_prob < 0.5:
            recall_msg = f"Your memory of '{subtopic_name}' is fading. Revise in the next 48 hours to avoid a total reset."
        elif recall_prob < 0.8:
            recall_msg = f"Your recall of '{subtopic_name}' is moderate. A quick review session soon will keep it fresh."
        else:
            recall_msg = f"Your recall of '{subtopic_name}' is excellent. No immediate revision is needed."

        # 3. Stability feedback (incorporating fragile review conditions)
        if getattr(mastery, "is_fragile", False):
            stability_msg = f"You've shown mastery in {subtopic_name}, but your performance is inconsistent. We recommend a Deep Review to solidify your understanding."
        elif mastery.half_life >= 10.0:
            stability_msg = f"Great job! Your '{subtopic_name}' mastery is now 'Stable'. You won't need to see this for another 14 days."
        else:
            stability_msg = f"Your mastery of '{subtopic_name}' is still developing. Continue regular practice to build stability."

        return {
            "calibration": calibration_msg,
            "recall": recall_msg,
            "stability": stability_msg
        }
