import logging

logger = logging.getLogger("ml.metacognitive")

class MetacognitiveCalibration:
    """
    Metacognitive Calibration logic.
    
    Measures the alignment between a student's self-reported confidence and their actual correctness.
    """
    
    @staticmethod
    def calculate_score(confidence_level: int, is_correct: bool) -> float:
        """
        Calculates the Calibration Score:
        CalibrationScore = (Confidence_Level / 5.0) - (1.0 if is_correct else 0.0)
        
        Args:
            confidence_level: Integer from 1 to 5.
            is_correct: Boolean indicating if the answer was correct.
            
        Returns:
            float: Calibration score between -1.0 and 1.0.
        """
        # Ensure confidence level is bound to 1-5 scale
        confidence_clamped = max(1, min(5, confidence_level))
        score = (confidence_clamped / 5.0) - (1.0 if is_correct else 0.0)
        
        logger.info(
            f"Metacognitive Calibration: Confidence={confidence_level} | "
            f"Correct={is_correct} -> Score={score:.2f}"
        )
        return score

    @staticmethod
    def get_bias_type(score: float) -> str:
        """
        Labels calibration based on score:
        - Score > 0.3: Overconfident
        - Score < -0.3: Underconfident
        - Otherwise: Calibrated
        """
        if score > 0.3:
            return "Overconfident"
        elif score < -0.3:
            return "Underconfident"
        else:
            return "Calibrated"
