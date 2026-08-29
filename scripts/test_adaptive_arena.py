import os
import sys
import asyncio
import numpy as np
import uuid
from pathlib import Path
from sqlmodel import select
from fastapi.testclient import TestClient

# Ensure apps/api is in Python's search path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir / "apps" / "api"))

from app.main import app  # type: ignore
from app.core.database import init_db, async_engine, async_session_maker  # type: ignore
from ml.irt_engine import IRTEngine  # type: ignore
from ml.srs_engine import SRSEngine  # type: ignore
from app.models.database import Questions  # type: ignore
from app.models.student_stats import StudentState, PerformanceLog, SRSMetadata  # type: ignore

client = TestClient(app)

def test_irt_probability():
    print("\n--- Testing IRT 3PL Probability ---")
    # Discrimination a=1.5, Difficulty b=0.5, Guessing c=0.25
    # For theta = 0.5, P(theta) should be c + (1-c)/2 = 0.25 + 0.75/2 = 0.625
    p = IRTEngine.calculate_3pl_probability(theta=0.5, a=1.5, b=0.5, c=0.25)
    print(f"P(theta=0.5 | a=1.5, b=0.5, c=0.25) = {p:.4f} (Expected: 0.6250)")
    assert abs(p - 0.625) < 1e-4

def test_irt_theta_estimation():
    print("\n--- Testing IRT Theta EAP Estimation ---")
    # Prior theta = 0.0
    # Questions parameter: (discrimination, difficulty, guessing)
    q_params = [
        (1.0, 0.0, 0.25),
        (1.0, 1.0, 0.25),
        (1.0, -1.0, 0.25)
    ]
    # Responses: correct, incorrect, correct
    responses = [1, 0, 1]
    
    new_theta = IRTEngine.estimate_theta_eap(
        current_theta=0.0,
        question_params=q_params,
        responses=responses
    )
    print(f"Estimated Theta after 3 responses: {new_theta:.4f}")
    assert -4.0 <= new_theta <= 4.0

def test_srs_sm2_quality():
    print("\n--- Testing SRS SM-2 Quality Mapping ---")
    q_correct_conf = SRSEngine.calculate_sm2_quality(is_correct=True, confidence_level=5)
    q_incorrect_conf = SRSEngine.calculate_sm2_quality(is_correct=False, confidence_level=5)
    
    print(f"Quality for Correct + Confident: {q_correct_conf} (Expected: 5)")
    print(f"Quality for Incorrect + Confident (Trap): {q_incorrect_conf} (Expected: 0)")
    
    assert q_correct_conf == 5
    assert q_incorrect_conf == 0

async def seed_test_database():
    print("\n--- Seeding Questions for Testing ---")
    async with async_session_maker() as session:
        from sqlalchemy import delete
        # Clear existing questions to prevent duplicates
        await session.execute(delete(Questions))

        
        q1 = Questions(
            id=uuid.uuid4(),
            text="Mock Polity Question: President's Rule",
            options={"A": "1 only", "B": "2 only", "C": "Both", "D": "Neither"},
            correct_answer="C",
            explanation="Explanation...",
            exam_type="UPSC",
            difficulty_b=0.0,
            discrimination_a=1.2,
            guessing_c=0.25,
            is_verified=True
        )
        q2 = Questions(
            id=uuid.uuid4(),
            text="Mock Polity Question: Attorney General",
            options={"A": "A", "B": "B", "C": "C", "D": "D"},
            correct_answer="D",
            explanation="Explanation...",
            exam_type="UPSC",
            difficulty_b=1.5,
            discrimination_a=1.5,
            guessing_c=0.25,
            is_verified=True
        )
        q3 = Questions(
            id=uuid.uuid4(),
            text="Mock Geography Question: River Mapping",
            options={"A": "A", "B": "B", "C": "C", "D": "D"},
            correct_answer="A",
            explanation="Explanation...",
            exam_type="CDS",
            difficulty_b=-1.0,
            discrimination_a=1.0,
            guessing_c=0.25,
            is_verified=True
        )
        session.add(q1)
        session.add(q2)
        session.add(q3)
        await session.commit()
        print("Questions seeded successfully.")

async def test_arena_endpoints():
    print("\n--- Testing API Endpoints ---")
    
    # 1. GET next question in calibration mode
    response = client.get("/api/v1/arena/next-question?user_id=student_999&exam_type=UPSC")
    assert response.status_code == 200
    q_data = response.json()
    print("GET next-question (Calibration) response:")
    print(q_data)
    assert q_data["text"] is not None

    # 2. POST response submission
    submit_payload = {
        "user_id": "student_999",
        "question_id": q_data["id"],
        "selected_option": "C",
        "response_time": 25.4,
        "confidence_level": 4
    }
    submit_res = client.post("/api/v1/arena/submit", json=submit_payload)
    if submit_res.status_code != 200:
        print("ERROR IN SUBMIT RESPONSE:", submit_res.status_code, submit_res.text)
    assert submit_res.status_code == 200
    result = submit_res.json()
    print("POST submit response:")
    print(result)
    assert "is_correct" in result
    assert "new_theta" in result
    assert "theta_delta" in result
    assert "mastery_percentage" in result
    assert "predicted_score" in result
    assert "accuracy_margin" in result

    # 3. GET explain response
    explain_res = client.get(f"/api/v1/arena/explain/{q_data['id']}?user_id=student_999")
    assert explain_res.status_code == 200
    explain_data = explain_res.json()
    print("GET explain response:")
    print(explain_data)
    assert "explanation" in explain_data

    # 4. GET mastery-map response
    mastery_res = client.get("/api/v1/arena/mastery-map?user_id=student_999")
    assert mastery_res.status_code == 200
    mastery_data = mastery_res.json()
    print("GET mastery-map response:")
    print(mastery_data)
    assert "mastery_map" in mastery_data

    # 5. GET next-question in normal mode
    response = client.get("/api/v1/arena/next-question?user_id=student_999&exam_type=UPSC")
    assert response.status_code == 200
    print("GET next-question (Active) response:")
    print(response.json())

    # 6. GET session-report response
    report_res = client.get("/api/v1/arena/session-report?user_id=student_999")
    assert report_res.status_code == 200
    report_data = report_res.json()
    print("GET session-report response:")
    print(report_data)
    assert "theta_progress" in report_data
    assert "bkt_mastery" in report_data
    assert "predictive_score" in report_data

    # 7. GET srs/dashboard
    srs_res = client.get("/api/v1/arena/srs/dashboard?user_id=student_999")
    assert srs_res.status_code == 200
    srs_data = srs_res.json()
    print("GET srs/dashboard response:")
    print(srs_data)
    assert "due_questions" in srs_data

    # 8. GET strategist/daily-plan response
    strat_res = client.get("/api/v1/strategist/daily-plan?user_id=student_999&hours=4&exam_type=UPSC")
    assert strat_res.status_code == 200
    strat_data = strat_res.json()
    print("GET strategist/daily-plan response:")
    print(strat_data)
    assert "readiness_score" in strat_data
    assert "bottlenecks" in strat_data
    assert "quadrants" in strat_data
    assert "schedule" in strat_data

async def run_all():
    print("="*60)
    print("STARTING TEST SUITE FOR ADAPTIVE ARENA ENGINE")
    print("="*60)
    
    # Setup test SQLite file
    db_file = root_dir / "data" / "test_officers_arena.db"
    if db_file.exists():
        try:
            os.remove(db_file)
            print("[Test DB] Cleared old test database file.")
        except Exception as e:
            print(f"[Test DB] Warning: Could not remove database file: {e}")

    await init_db()
    
    # Run unit tests
    test_irt_probability()
    test_irt_theta_estimation()
    test_srs_sm2_quality()
    
    # Seed data & run integration api tests
    await seed_test_database()
    await test_arena_endpoints()
    
    print("\n" + "="*60)
    print("ALL ARENA ENGINE TESTS COMPLETED SUCCESSFULLY")
    print("="*60)
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_all())
