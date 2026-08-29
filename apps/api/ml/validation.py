import math
from typing import List, Dict, Any

class MLValidator:
    """
    Advanced Research Metrics Layer.
    Calculates Brier Score, Root Mean Square Error (RMSE), and Pearson Correlation 
    to validate BKT and HLR predictive accuracy and cognitive hypothesis testing.
    """
    
    @staticmethod
    def calculate_brier_score(predictions: List[float], outcomes: List[float]) -> float:
        """
        Calculates the Brier Score: Mean Squared Error of probability predictions.
        Brier = (1 / N) * sum((prediction_i - outcome_i) ^ 2)
        
        Args:
            predictions: List of estimated probabilities (e.g. recall probability).
            outcomes: List of binary outcomes (1.0 for correct/recall, 0.0 for incorrect/forget).
            
        Returns:
            float: Brier score (lower is better, 0.0 is perfect prediction).
        """
        if not predictions or len(predictions) != len(outcomes):
            return 0.0
            
        n = len(predictions)
        squared_errors = [(p - o) ** 2 for p, o in zip(predictions, outcomes)]
        return sum(squared_errors) / n

    @staticmethod
    def calculate_rmse(predictions: List[float], outcomes: List[float]) -> float:
        """
        Calculates Root Mean Square Error (RMSE):
        RMSE = sqrt((1 / N) * sum((prediction_i - outcome_i) ^ 2))
        
        Args:
            predictions: List of estimated mastery correct-rate predictions.
            outcomes: List of binary outcomes (1.0 for correct, 0.0 for incorrect).
            
        Returns:
            float: RMSE value (lower is better).
        """
        if not predictions or len(predictions) != len(outcomes):
            return 0.0
            
        n = len(predictions)
        squared_errors = [(p - o) ** 2 for p, o in zip(predictions, outcomes)]
        mean_squared_error = sum(squared_errors) / n
        return math.sqrt(mean_squared_error)

    @staticmethod
    def calculate_volatility_decay_correlation(volatilities: List[float], half_lives: List[float]) -> float:
        """
        Calculates the Pearson correlation coefficient between student subtopic volatility
        and memory half-life (h).
        
        A negative correlation validates the hypothesis: higher volatility (Fragile Learning)
        correlates with lower/faster-decaying memory half-lives.
        """
        n = len(volatilities)
        if n < 2 or len(half_lives) != n:
            return 0.0
            
        mean_v = sum(volatilities) / n
        mean_h = sum(half_lives) / n
        
        num = sum((v - mean_v) * (h - mean_h) for v, h in zip(volatilities, half_lives))
        den_v = sum((v - mean_v) ** 2 for v in volatilities)
        den_h = sum((h - mean_h) ** 2 for h in half_lives)
        
        if den_v == 0.0 or den_h == 0.0:
            return 0.0
            
        return num / math.sqrt(den_v * den_h)
        
        if den_v == 0.0 or den_h == 0.0:
            return 0.0
            
        return num / math.sqrt(den_v * den_h)
