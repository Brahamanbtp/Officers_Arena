from typing import List
from app.models.database import Questions

class CalibrationSet:
    @staticmethod
    def get_calibration_question(candidates: List[Questions], attempt_index: int) -> Questions:
        """
        Forces a balanced calibration set of 5 questions:
        - attempt 0: 1 Easy (target difficulty_b = -1.5)
        - attempt 1: 1st Medium (target difficulty_b = -0.5)
        - attempt 2: 2nd Medium (target difficulty_b = 0.0)
        - attempt 3: 3rd Medium (target difficulty_b = 0.5)
        - attempt 4: 1 Hard (target difficulty_b = 1.5)
        """
        # Map attempt index to target difficulty centroids
        difficulty_targets = {
            0: -1.5, # Easy
            1: -0.5, # Medium
            2: 0.0,  # Medium
            3: 0.5,  # Medium
            4: 1.5   # Hard
        }
        
        target_diff = difficulty_targets.get(attempt_index, 0.0)
        
        # Sort candidate questions by how close they are to the target difficulty centroid
        candidates.sort(key=lambda q: abs((q.difficulty_b if q.difficulty_b is not None else 0.0) - target_diff))
        
        return candidates[0]
