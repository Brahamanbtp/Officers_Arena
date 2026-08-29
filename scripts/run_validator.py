import os
import sys
import asyncio
from pathlib import Path
from typing import List

# Ensure apps/api is in Python's search path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir / "apps" / "api"))

from sqlmodel import select
from app.core.database import async_session_maker, async_engine
from app.models.student_stats import StudentAttempt, StudentMastery
from ml.knowledge_tracing.bkt_engine import BKTProcessor
from ml.retention.hlr_engine import HLREngine
from ml.validation import MLValidator

async def calculate_database_validation_metrics():
    """
    Chronologically reads all attempts to compute predictive RMSE and Brier Score,
    and computes the correlation between performance volatility and memory half-life.
    """
    print("\n" + "="*60)
    print("RUNNING RESEARCH VALIDATION: BKT RMSE & HLR BRIER SCORE")
    print("="*60)
    
    bkt = BKTProcessor()
    hlr = HLREngine()
    
    async with async_session_maker() as session:
        # Fetch all student attempts ordered by timestamp
        stmt = select(StudentAttempt).order_by(StudentAttempt.timestamp)
        result = await session.execute(stmt)
        attempts = result.scalars().all()
        
        if not attempts:
            print("[Warning] No student attempts found in database. Run test_student_twin.py first.")
            return
            
        print(f"Found {len(attempts)} total attempt logs to analyze.\n")
        
        # Track running state per (user_id, subtopic_id, exam_type)
        # state: (running_mastery, running_half_life, last_practiced_timestamp, stability_factor)
        user_states = {}
        
        bkt_predictions = []
        hlr_predictions = []
        outcomes = []
        
        for att in attempts:
            key = (att.user_id, att.subtopic_id, att.exam_type)
            outcome = 1.0 if att.is_correct else 0.0
            outcomes.append(outcome)
            
            if key not in user_states:
                p_prior = bkt.p_init
                h_prior = 1.0
                last_time = None
                stability = 2.0
            else:
                p_prior, h_prior, last_time, stability = user_states[key]
                
            p_correct_pred = bkt.get_correct_prediction_probability(p_prior)
            bkt_predictions.append(p_correct_pred)
            
            if last_time is None:
                p_recall_pred = 1.0
            else:
                delta_t_days = (att.timestamp - last_time).total_seconds() / 86400.0
                p_recall_pred = hlr.calculate_recall_probability(h_prior, delta_t_days)
            hlr_predictions.append(p_recall_pred)
            
            p_updated, w_fact, d_scale = bkt.update_mastery(
                p_prev=p_prior,
                is_correct=att.is_correct,
                confidence_level=att.confidence_level,
                difficulty_level=int(att.difficulty_weight * 3.0),
                use_confidence=True,
                use_irt=True
            )
            
            h_updated, sf_updated = hlr.update_half_life(
                h_old=h_prior,
                stability_factor=stability,
                is_correct=att.is_correct
            )
            
            user_states[key] = (p_updated, h_updated, att.timestamp, sf_updated)
            
        brier = MLValidator.calculate_brier_score(hlr_predictions, outcomes)
        rmse = MLValidator.calculate_rmse(bkt_predictions, outcomes)
        
        print("-" * 40)
        print(f"Brier Score (HLR Spaced Repetition): {brier:.6f}")
        print(f"RMSE (BKT Predictive Accuracy):     {rmse:.6f}")
        print("-" * 40)
        
        # 4. Volatility vs Memory Decay Correlation Check
        mastery_stmt = select(StudentMastery)
        mastery_res = await session.execute(mastery_stmt)
        masteries = mastery_res.scalars().all()
        
        volatilities = [m.volatility for m in masteries if m.volatility > 0.0]
        half_lives = [m.half_life for m in masteries if m.volatility > 0.0]
        
        print("\nHypothesis Testing: Volatility vs. Memory Decay Correlation")
        print("-" * 40)
        if len(volatilities) >= 2:
            r = MLValidator.calculate_volatility_decay_correlation(volatilities, half_lives)
            print(f"Pearson Correlation Coefficient (r): {r:.6f}")
            if r < 0:
                print("  [Confirmed] Negative correlation supports the research hypothesis:")
                print("              High Volatility (Fragile Learning) correlates with faster memory decay.")
            else:
                print("  [Null] Non-negative correlation. Requires larger, more diverse dataset for validation.")
        else:
            print("  [Insufficient Data] Need at least 2 active volatility records to compute correlation.")
        print("-" * 40)
        
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(calculate_database_validation_metrics())
