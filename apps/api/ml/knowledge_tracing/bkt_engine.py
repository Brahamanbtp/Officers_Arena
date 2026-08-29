import logging
from typing import Tuple, Optional

logger = logging.getLogger("ml.knowledge_tracing")

class BKTProcessor:
    """
    Bayesian Knowledge Tracing (BKT) Engine with advanced Confidence & IRT Weighting.
    
    BKT models student knowledge state as a binary latent variable (known vs unknown).
    It updates the probability of mastery based on whether the student's attempt was correct.
    
    RESEARCH VALIDATION: Evaluating BKT with AUC-ROC (Area Under the ROC Curve)
    --------------------------------------------------------------------------
    To validate the predictive accuracy of the BKT model:
    1. For each attempt n by a student on a specific subtopic, we calculate the prior 
       probability of getting the question correct. This is given by:
           P(Correct_n) = P(L_{n-1}) * (1 - P(Slip)) + (1 - P(L_{n-1})) * P(Guess)
    2. We record P(Correct_n) as our predicted probability, and the actual binary outcome 
       is_correct_n (1 for correct, 0 for incorrect) as our ground-truth label.
    3. Collecting this tuple of (P(Correct_n), is_correct_n) across all student attempts in 
       a historical test set allows us to construct a Receiver Operating Characteristic (ROC) curve.
    4. The Area Under the Curve (AUC-ROC) measures the model's ability to discriminate 
       between correct and incorrect responses. 
       - An AUC of 0.5 indicates random guessing.
       - An AUC > 0.7 indicates acceptable predictive discrimination.
       - An AUC > 0.8 is considered excellent, validating that P(L) is a strong representation of mastery.
    """
    
    def __init__(
        self,
        p_init: float = 0.15,
        p_transit: float = 0.20,
        p_slip: float = 0.10,
        p_guess: float = 0.20
    ):
        """
        Initializes BKT parameters.
        
        Args:
            p_init: Probability that the student already knows the skill before practice.
            p_transit: Probability that the student learns the skill after an attempt.
            p_slip: Probability that the student makes a slip/mistake despite knowing the skill.
            p_guess: Probability that the student guesses correctly despite not knowing the skill.
        """
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_slip = p_slip
        self.p_guess = p_guess

    def update_mastery(
        self,
        p_prev: float,
        is_correct: bool,
        confidence_level: Optional[int] = None,
        difficulty_level: Optional[int] = None,
        use_confidence: bool = True,
        use_irt: bool = True
    ) -> Tuple[float, float, float]:
        """
        Updates the probability of mastery based on correctness, confidence, and question difficulty.
        
        Args:
            p_prev: Previous probability of mastery P(L_{n-1})
            is_correct: Whether the student answered the question correctly.
            confidence_level: Student's self-reported confidence from 1 to 5.
            difficulty_level: Item response difficulty rating from 1 to 5.
            use_confidence: Toggle to apply confidence weighting adjustment.
            use_irt: Toggle to apply difficulty weighting adjustment.
            
        Returns:
            Tuple[float, float, float]: (updated_mastery, weight_factor, difficulty_scale)
        """
        # Step 1: Base Bayesian Knowledge Tracing update
        if is_correct:
            num = p_prev * (1.0 - self.p_slip)
            den = num + (1.0 - p_prev) * self.p_guess
        else:
            num = p_prev * self.p_slip
            den = num + (1.0 - p_prev) * (1.0 - self.p_guess)
            
        if den == 0.0:
            p_known = p_prev
        else:
            p_known = num / den
            
        p_updated_base = p_known + (1.0 - p_known) * self.p_transit
        delta_p_base = p_updated_base - p_prev
        
        # Step 2: Confidence-Weighted Calibration (Misconception & Guess factors)
        weight_factor = 1.0
        if use_confidence and confidence_level is not None:
            # Clamp level to [1, 5]
            conf = max(1, min(5, confidence_level))
            if is_correct:
                # If correct but low confidence (lucky guess), suppress mastery gain
                weight_factor = 0.2 + 0.8 * (conf / 5.0)
            else:
                # If incorrect but high confidence (severe misconception), exacerbate mastery penalty
                weight_factor = 0.5 + 1.0 * (conf / 5.0)
                
        # Step 3: Item Response Theory (IRT) Difficulty Adjustment
        difficulty_scale = 1.0
        if use_irt and difficulty_level is not None:
            # Clamp difficulty to [1, 5]
            diff = max(1, min(5, difficulty_level))
            if is_correct:
                # Getting a hard question correct accelerates mastery
                difficulty_scale = 0.5 + 0.5 * (diff / 3.0)
            else:
                # Getting an easy question wrong accelerates decay
                difficulty_scale = 1.5 - 0.5 * (diff / 3.0)
                
        # Step 4: Apply weighted delta
        adjusted_delta = delta_p_base * weight_factor * difficulty_scale
        p_updated = p_prev + adjusted_delta
        
        # Clamp values to avoid numerical overflow/underflow outside [0.0, 1.0]
        p_updated = max(0.0, min(1.0, p_updated))
        
        logger.info(
            f"BKT Advanced Update: Prior={p_prev:.4f} | Correct={is_correct} | "
            f"Conf={confidence_level} (W={weight_factor:.2f}) | "
            f"Diff={difficulty_level} (D={difficulty_scale:.2f}) -> "
            f"Updated P(L)={p_updated:.4f}"
        )
        return p_updated, weight_factor, difficulty_scale

    def get_correct_prediction_probability(self, p_mastery: float) -> float:
        """
        Computes the probability of getting the next question correct based on current mastery.
        Used directly for model evaluation (e.g. AUC-ROC prediction scoring).
        """
        return p_mastery * (1.0 - self.p_slip) + (1.0 - p_mastery) * self.p_guess
