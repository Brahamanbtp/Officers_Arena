import math
import numpy as np
from typing import List, Optional, Tuple
from sqlmodel import Session, select
from app.models.database import Questions
from app.models.student_stats import StudentState, PerformanceLog
from ml.calibration_set import CalibrationSet

class IRTEngine:
    @staticmethod
    def calculate_3pl_probability(theta: float, a: float, b: float, c: float) -> float:
        """
        Computes 3-Parameter Logistic (3PL) model probability:
        P(theta) = c + (1 - c) / (1 + exp(-a * (theta - b)))
        """
        try:
            exp_term = math.exp(-a * (theta - b))
            return c + (1.0 - c) / (1.0 + exp_term)
        except OverflowError:
            return c if (theta - b) < 0 else 1.0

    @staticmethod
    def estimate_theta_eap(
        current_theta: float,
        question_params: List[Tuple[float, float, float]], # List of (a, b, c)
        responses: List[int] # List of 1 (correct) or 0 (incorrect)
    ) -> float:
        """
        Estimates theta using Expected A Posteriori (EAP) over a discrete grid.
        Prior is assumed to be Normal(current_theta, 1.0) to stabilize updates.
        """
        if not question_params or not responses:
            return current_theta

        # Define grid from -4.0 to 4.0 with step 0.1
        grid = np.arange(-4.0, 4.1, 0.1)
        
        # Define prior: Normal(current_theta, 1.0)
        prior = np.exp(-0.5 * ((grid - current_theta) / 1.0) ** 2)
        prior /= np.sum(prior)

        # Compute likelihood for each grid point
        likelihoods = np.ones_like(grid)
        for (a, b, c), resp in zip(question_params, responses):
            p_grid = np.array([IRTEngine.calculate_3pl_probability(theta_val, a, b, c) for theta_val in grid])
            term_prob = p_grid if resp == 1 else (1.0 - p_grid)
            likelihoods *= term_prob

        # Posterior proportional to likelihood * prior
        posterior = likelihoods * prior
        post_sum = np.sum(posterior)
        
        if post_sum > 0:
            posterior /= post_sum
            new_theta = float(np.sum(grid * posterior))
            return max(min(new_theta, 4.0), -4.0)
        
        return current_theta

    @staticmethod
    def get_next_question(
        db: Session,
        user_id: str,
        exam_type: str
    ) -> Tuple[Questions, bool]:
        """
        Selects the next best question based on flow-state probability:
        1. P(theta) in [0.5, 0.7] (Flow State target)
        2. Widen to [0.4, 0.8] (Widened Search)
        3. Closest difficulty b to theta (Hard Fallback)
        """
        # 1. Get or create student state
        stmt_state = select(StudentState).where(StudentState.user_id == user_id)
        student_state = db.exec(stmt_state).first()
        
        if not student_state:
            student_state = StudentState(user_id=user_id, theta=0.0, total_answered=0)
            db.add(student_state)
            db.commit()
            db.refresh(student_state)

        # 2. Get set of already answered question IDs by the user
        stmt_logs = select(PerformanceLog.question_id).where(PerformanceLog.user_id == user_id)
        answered_ids = set(db.exec(stmt_logs).all())

        # 3. Check for Calibration Mode (First 5 questions)
        is_calibration = student_state.total_answered < 5
        
        # Query verified questions of this exam type
        stmt_questions = select(Questions).where(
            Questions.exam_type == exam_type
        )
        all_questions = db.exec(stmt_questions).all()
        
        # Filter out already answered questions
        candidates = [q for q in all_questions if q.id not in answered_ids]
        
        if not candidates:
            # Fallback to allow repeating if depleted
            candidates = all_questions
            if not candidates:
                raise ValueError("No questions available in the database for the given exam type.")

        if is_calibration:
            selected_q = CalibrationSet.get_calibration_question(candidates, student_state.total_answered)
            return selected_q, True

        # Flow state search [0.5, 0.7]
        best_question = None
        closest_diff = 1.0
        
        for q in candidates:
            a = q.discrimination_a if q.discrimination_a is not None else 1.0
            b = q.difficulty_b if q.difficulty_b is not None else 0.0
            c = q.guessing_c if q.guessing_c is not None else 0.25
            p = IRTEngine.calculate_3pl_probability(student_state.theta, a, b, c)
            
            if 0.5 <= p <= 0.7:
                diff = abs(p - 0.6)
                if diff < closest_diff:
                    closest_diff = diff
                    best_question = q
        
        # Widening search [0.4, 0.8]
        if not best_question:
            closest_diff = 1.0
            for q in candidates:
                a = q.discrimination_a if q.discrimination_a is not None else 1.0
                b = q.difficulty_b if q.difficulty_b is not None else 0.0
                c = q.guessing_c if q.guessing_c is not None else 0.25
                p = IRTEngine.calculate_3pl_probability(student_state.theta, a, b, c)
                
                if 0.4 <= p <= 0.8:
                    diff = abs(p - 0.6)
                    if diff < closest_diff:
                        closest_diff = diff
                        best_question = q

        # Hard Fallback: Closest difficulty_b to theta
        if not best_question:
            candidates.sort(key=lambda q: abs((q.difficulty_b if q.difficulty_b is not None else 0.0) - student_state.theta))
            best_question = candidates[0]

        return best_question, False
