import math
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

router = APIRouter()

class UpdateStateRequest(BaseModel):
    user_id: str
    topic_name: str
    is_correct: bool
    current_theta: float = 0.0
    current_mastery: float = 0.15
    difficulty_b: float = 0.5
    discrimination_a: float = 1.0
    guessing_c: float = 0.25
    response_time_ms: int = 0

class StudentStateResponse(BaseModel):
    user_id: str
    topic_name: str
    new_theta: float
    theta_delta: float
    new_mastery: float
    mastery_percentage: float
    p_correct_predicted: float

class CognitiveEngine:
    @staticmethod
    def calculate_3pl_probability(theta: float, a: float, b: float, c: float) -> float:
        """3-Parameter Logistic IRT model"""
        exp_val = math.exp(-a * (theta - b))
        return c + (1.0 - c) / (1.0 + exp_val)

    @staticmethod
    def update_irt_theta(theta: float, is_correct: bool, a: float, b: float, c: float, learning_rate: float = 0.15) -> float:
        """EAP update step for latent ability theta"""
        p_val = CognitiveEngine.calculate_3pl_probability(theta, a, b, c)
        actual = 1.0 if is_correct else 0.0
        delta = learning_rate * (actual - p_val) * a
        return max(-3.0, min(3.0, theta + delta))

    @staticmethod
    def update_bkt_mastery(
        p_l: float, 
        is_correct: bool, 
        p_t: float = 0.10, 
        p_s: float = 0.10, 
        p_g: float = 0.25
    ) -> float:
        """Bayesian Knowledge Tracing (BKT) posterior update"""
        if is_correct:
            p_obs = (p_l * (1.0 - p_s)) / (p_l * (1.0 - p_s) + (1.0 - p_l) * p_g)
        else:
            p_obs = (p_l * p_s) / (p_l * p_s + (1.0 - p_l) * (1.0 - p_g))
        
        # Transition to learned state
        p_next = p_obs + (1.0 - p_obs) * p_t
        return max(0.01, min(0.99, p_next))

@router.post(
    "/v1/engine/update-state",
    response_model=StudentStateResponse,
    summary="Update BKT mastery and IRT theta based on student performance",
    description="Calculates 3PL IRT expected probability, updates latent ability theta, and computes BKT posterior mastery."
)
async def update_student_state(request: UpdateStateRequest):
    try:
        p_pred = CognitiveEngine.calculate_3pl_probability(
            request.current_theta, request.discrimination_a, request.difficulty_b, request.guessing_c
        )
        new_theta = CognitiveEngine.update_irt_theta(
            request.current_theta, request.is_correct, request.discrimination_a, request.difficulty_b, request.guessing_c
        )
        new_mastery = CognitiveEngine.update_bkt_mastery(
            request.current_mastery, request.is_correct
        )

        return StudentStateResponse(
            user_id=request.user_id,
            topic_name=request.topic_name,
            new_theta=round(new_theta, 4),
            theta_delta=round(new_theta - request.current_theta, 4),
            new_mastery=round(new_mastery, 4),
            mastery_percentage=round(new_mastery * 100.0, 1),
            p_correct_predicted=round(p_pred, 4)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Adaptive Engine update failed: {str(e)}")
