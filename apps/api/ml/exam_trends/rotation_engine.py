import logging
from typing import List, Dict, Any, Optional
import scipy.stats as stats
import math

logger = logging.getLogger("ml.exam_trends.rotation")

class RotationEngine:
    """
    RotationEngine estimates syllabus recurrence probability of topics 
    using Statistical Gap Analysis and Poisson Distribution.
    """

    @staticmethod
    def calculate_wait_time(current_year: int, appearance_years: List[int]) -> int:
        """
        Calculates WaitTime: current_year - last_appearance_year.
        """
        if not appearance_years:
            # If it has never appeared, assume wait time is high (e.g. 10 years)
            return 10
        last_year = max(appearance_years)
        return max(0, current_year - last_year)

    @staticmethod
    def calculate_lambda(total_appearances: int, total_years: int) -> float:
        """
        Calculates lambda (mean frequency of occurrence per year).
        """
        if total_years <= 0:
            return 0.0
        return float(total_appearances) / float(total_years)

    @classmethod
    def calculate_recurrence_probability(
        cls,
        appearance_years: List[int],
        start_year: int = 2009,
        target_year: int = 2027
    ) -> Dict[str, Any]:
        """
        Estimates the probability of a topic appearing in the target exam cycle (target_year).
        
        Args:
            appearance_years: List of years in which the topic appeared in the exam.
            start_year: The beginning of the historical window.
            target_year: The upcoming exam year (e.g. UPSC 2027 or CDS 2026).
            
        Returns:
            Dict containing WaitTime, lambda, and recurrence probability.
        """
        total_years = max(1, target_year - start_year)
        total_appearances = len(appearance_years)
        
        # Calculate base rate lambda
        lam = cls.calculate_lambda(total_appearances, total_years)
        
        # Calculate wait time
        wait_time = cls.calculate_wait_time(target_year - 1, appearance_years)
        
        # Adjusted lambda for the upcoming cycle: scaled by wait time
        # As wait time grows relative to 1/lambda, the recurrence probability increases
        mu = lam * (wait_time + 1)
        
        # Use scipy.stats.poisson survival function (sf = 1 - cdf) to compute P(X >= 1)
        if mu > 0:
            recurrence_prob = float(stats.poisson.sf(0, mu))
        else:
            # If lambda is 0, probability is 0 (or a small baseline probability)
            recurrence_prob = 0.05
            
        # Clamp to [0.0, 0.99] to prevent absolute certainty
        recurrence_prob = max(0.0, min(0.99, recurrence_prob))
        
        logger.info(
            f"Rotation Engine Analysis: appearances={total_appearances} | "
            f"lambda={lam:.4f} | WaitTime={wait_time} -> Recurrence Prob={recurrence_prob:.4f}"
        )
        
        return {
            "wait_time_years": wait_time,
            "lambda_rate": round(lam, 4),
            "recurrence_probability": round(recurrence_prob, 4),
            "target_year": target_year
        }
