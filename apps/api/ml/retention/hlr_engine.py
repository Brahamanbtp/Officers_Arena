import logging
from typing import Tuple

logger = logging.getLogger("ml.retention")

class HLREngine:
    """
    Half-Life Regression (HLR) Spaced Repetition Engine.
    
    Predicts student memory decay and calculates half-life updates.
    Recall probability decreases exponentially over time according to half-life.
    """
    
    @staticmethod
    def calculate_recall_probability(half_life: float, delta_t_days: float) -> float:
        """
        Calculates the probability of recall p = 2^(-delta_t / h).
        
        Args:
            half_life: Memory half-life in days (time after which recall probability is 50%).
            delta_t_days: Time elapsed since last practice in days.
            
        Returns:
            float: Probability of recall between 0.0 and 1.0.
        """
        if half_life <= 0:
            return 0.0
        
        # Clip delta_t_days to prevent negative time
        delta_t_days = max(0.0, delta_t_days)
        
        # Calculate recall probability
        p = 2.0 ** (-delta_t_days / half_life)
        return max(0.0, min(1.0, p))

    @staticmethod
    def update_half_life(
        h_old: float,
        stability_factor: float,
        is_correct: bool
    ) -> Tuple[float, float]:
        """
        Updates half-life based on attempt correctness.
        
        Args:
            h_old: Previous half-life value.
            stability_factor: Current stability expansion factor.
            is_correct: True if the attempt was correct, False otherwise.
            
        Returns:
            Tuple[float, float]: (new_half_life, new_stability_factor)
        """
        # Ensure values are sensible
        h_old = max(0.1, h_old)
        stability_factor = max(1.0, stability_factor)
        
        if is_correct:
            # Expand memory half-life based on stability
            h_new = h_old * (1.0 + stability_factor)
            # Expand stability factor for subsequent successful intervals
            sf_new = stability_factor * 1.1
        else:
            # Sharp decay for forgotten items
            h_new = h_old * 0.5
            # Reduce stability factor since memory strength reset
            sf_new = max(1.0, stability_factor * 0.5)
            
        # Ensure minimum half-life bounds (e.g. 0.1 days ~ 2.4 hours)
        h_new = max(0.1, h_new)
        
        logger.info(
            f"HLR Update: Correct={is_correct} | "
            f"Half-life: {h_old:.4f} days -> {h_new:.4f} days | "
            f"Stability Factor: {stability_factor:.4f} -> {sf_new:.4f}"
        )
        
        return h_new, sf_new
