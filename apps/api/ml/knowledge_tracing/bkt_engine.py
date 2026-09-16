import logging
from typing import Tuple, Optional

logger = logging.getLogger("ml.knowledge_tracing")

class BKTProcessor:
    """
    Bayesian Knowledge Tracing (BKT) Engine with Mathematically Regularized 
    Confidence & IRT Item Likelihood Parameterization.
    
    BKT models student knowledge state as a binary latent variable (known vs unknown).
    It updates the probability of mastery based on Bayes' Rule with item/response-specific 
    effective slip and guess likelihoods:
        P(L_t | Correct) = (P(L_{t-1}) * (1 - s_eff)) / (P(L_{t-1}) * (1 - s_eff) + (1 - P(L_{t-1})) * g_eff)
        P(L_t | Incorrect) = (P(L_{t-1}) * s_eff) / (P(L_{t-1}) * s_eff + (1 - P(L_{t-1})) * (1 - g_eff))
        P(L_t) = P(L_t | Obs) + (1 - P(L_t | Obs)) * p_transit
    """
    
    def __init__(
        self,
        p_init: float = 0.15,
        p_transit: float = 0.20,
        p_slip: float = 0.10,
        p_guess: float = 0.25
    ):
        """
        Initializes BKT parameters.
        Base guess is calibrated to 0.25 for standard 4-option MCQs.
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
        Updates the probability of mastery using exact Bayesian inference with 
        likelihood parameter adjustment.
        
        Args:
            p_prev: Previous probability of mastery P(L_{n-1})
            is_correct: Whether the student answered the question correctly.
            confidence_level: Student's self-reported confidence from 1 to 5.
            difficulty_level: Item response difficulty rating from 1 to 5.
            use_confidence: Toggle to apply confidence likelihood adjustment.
            use_irt: Toggle to apply difficulty likelihood adjustment.
            
        Returns:
            Tuple[float, float, float]: (updated_mastery, weight_factor, difficulty_scale)
        """
        # Clamp prior to safe numerical range
        p_prev = max(0.001, min(0.999, p_prev))
        
        # Step 1: Modulate effective slip and guess via IRT difficulty and metacognitive confidence
        s_eff = self.p_slip
        g_eff = self.p_guess
        
        weight_factor = 1.0
        difficulty_scale = 1.0
        
        if use_irt and difficulty_level is not None:
            diff = max(1, min(5, difficulty_level))
            difficulty_scale = 0.6 + 0.4 * (diff / 3.0)
            # Harder questions have lower guess probability and higher slip probability
            if diff >= 4:
                g_eff = max(0.10, self.p_guess * 0.6)
                s_eff = min(0.25, self.p_slip * 1.5)
            elif diff <= 2:
                g_eff = min(0.35, self.p_guess * 1.3)
                s_eff = max(0.05, self.p_slip * 0.6)

        if use_confidence and confidence_level is not None:
            conf = max(1, min(5, confidence_level))
            weight_factor = 0.5 + (conf / 5.0) * 0.5
            if is_correct:
                if conf <= 2:
                    # Low confidence correct answer indicates a lucky guess
                    g_eff = min(0.50, g_eff * 1.6)
                elif conf >= 4:
                    # High conviction correct answer reduces guess likelihood
                    g_eff = max(0.05, g_eff * 0.5)
            else:
                if conf >= 4:
                    # High confidence wrong answer indicates a deep misconception, not a casual slip
                    s_eff = max(0.03, s_eff * 0.4)
                elif conf <= 2:
                    # Low confidence wrong answer represents expected uncertainty
                    s_eff = min(0.30, s_eff * 1.4)

        # Step 2: Exact Bayesian Posterior Calculation
        if is_correct:
            num = p_prev * (1.0 - s_eff)
            den = num + (1.0 - p_prev) * g_eff
        else:
            num = p_prev * s_eff
            den = num + (1.0 - p_prev) * (1.0 - g_eff)
            
        if den <= 0.0:
            p_known = p_prev
        else:
            p_known = num / den
            
        # Step 3: Knowledge Transition (Learning step)
        p_updated = p_known + (1.0 - p_known) * self.p_transit
        
        # Enforce mathematical bounds [0.0, 1.0]
        p_updated = max(0.0, min(1.0, p_updated))
        
        logger.info(
            f"BKT Bayesian Regularized: Prior={p_prev:.4f} | Correct={is_correct} | "
            f"Conf={confidence_level} | Diff={difficulty_level} | "
            f"s_eff={s_eff:.3f}, g_eff={g_eff:.3f} -> Updated P(L)={p_updated:.4f}"
        )
        return p_updated, weight_factor, difficulty_scale

    def get_correct_prediction_probability(self, p_mastery: float) -> float:
        """
        Computes the probability of getting the next question correct based on current mastery.
        """
        return p_mastery * (1.0 - self.p_slip) + (1.0 - p_mastery) * self.p_guess
