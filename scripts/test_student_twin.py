import os
import sys
import asyncio
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# Ensure apps/api is in Python's search path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir / "apps" / "api"))

from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.main import app
from app.core.database import init_db, async_engine, async_session_maker
from app.models.database import Syllabus
from app.models.student_stats import StudentAttempt, StudentMastery, MetacognitiveStats

# Client setup
client = TestClient(app)

async def seed_test_data():
    """
    Seeds a basic syllabus structure for isolation testing.
    """
    print("\n[Test DB] Seeding syllabus hierarchy...")
    
    async with async_session_maker() as session:
        await session.execute(select(StudentAttempt)) # Warmup
        
        # 1. Seed UPSC Syllabus hierarchy
        upsc_subject = Syllabus(
            id=uuid.uuid4(),
            name="Indian Polity",
            level="Subject",
            exam_type="UPSC",
            parent_id=None
        )
        upsc_topic = Syllabus(
            id=uuid.uuid4(),
            name="Constitutional Framework",
            level="Topic",
            exam_type="UPSC",
            parent_id=upsc_subject.id
        )
        upsc_subtopic = Syllabus(
            id=uuid.uuid4(),
            name="Preamble",
            level="Subtopic",
            exam_type="UPSC",
            parent_id=upsc_topic.id
        )
        
        # 2. Seed CDS Syllabus hierarchy
        cds_subject = Syllabus(
            id=uuid.uuid4(),
            name="CDS English",
            level="Subject",
            exam_type="CDS",
            parent_id=None
        )
        cds_topic = Syllabus(
            id=uuid.uuid4(),
            name="Grammar",
            level="Topic",
            exam_type="CDS",
            parent_id=cds_subject.id
        )
        cds_subtopic = Syllabus(
            id=uuid.uuid4(),
            name="Tenses",
            level="Subtopic",
            exam_type="CDS",
            parent_id=cds_topic.id
        )
        
        session.add(upsc_subject)
        session.add(upsc_topic)
        session.add(upsc_subtopic)
        session.add(cds_subject)
        session.add(cds_topic)
        session.add(cds_subtopic)
        
        await session.commit()
        
        print("Seeding complete.")
        return upsc_subtopic.id, cds_subtopic.id, upsc_topic.id

async def simulate_time_decay(user_id: str, subtopic_id: uuid.UUID, days_ago: float):
    """
    Simulates a memory decay by manually updating the last_practiced timestamp backwards in the DB.
    """
    async with async_session_maker() as session:
        stmt = select(StudentMastery).where(
            StudentMastery.user_id == user_id,
            StudentMastery.subtopic_id == subtopic_id
        )
        result = await session.execute(stmt)
        mastery = result.scalars().first()
        if mastery:
            decayed_time = datetime.utcnow() - timedelta(days=days_ago)
            mastery.last_practiced = decayed_time
            await session.commit()
            print(f"\n[Test DB] Manually simulated decay: last_practiced for subtopic={subtopic_id} updated to {days_ago} days ago.")

async def main_test():
    # Setup test SQLite file
    db_file = root_dir / "data" / "test_officers_arena.db"
    if db_file.exists():
        try:
            os.remove(db_file)
            print("[Test DB] Cleared old test database file.")
        except Exception as e:
            print(f"[Test DB] Warning: Could not remove database file: {e}")
            
    # Initialize DB schema asynchronously
    print("[Test DB] Initializing tables...")
    await init_db()
    
    # Seed syllabus data
    upsc_sub_id, cds_sub_id, upsc_topic_id = await seed_test_data()
    
    print("\n" + "="*50)
    print("TEST 1: DIAGNOSTIC ONBOARDING (COLD START)")
    print("="*50)
    
    # Onboard student_007 to set high baseline on UPSC Preamble (so mastery > 0.70)
    diagnostic_attempts_upsc = []
    for _ in range(9):
        diagnostic_attempts_upsc.append({
            "subtopic_id": str(upsc_sub_id),
            "is_correct": True,
            "confidence_level": 4,
            "response_time": 10.0,
            "difficulty": 3
        })
    diagnostic_attempts_upsc.append({
        "subtopic_id": str(upsc_sub_id),
        "is_correct": False,
        "confidence_level": 2,
        "response_time": 12.0,
        "difficulty": 3
    })
        
    response = client.post("/v1/student/onboard/initialize", json={
        "user_id": "student_007",
        "exam_type": "UPSC",
        "attempts": diagnostic_attempts_upsc
    })
    print("UPSC Diagnostic Onboarding Response:")
    print(response.json())
    
    # Onboard student_007 on CDS Tenses as well
    diagnostic_attempts_cds = []
    for _ in range(7):
        diagnostic_attempts_cds.append({
            "subtopic_id": str(cds_sub_id),
            "is_correct": True,
            "confidence_level": 3,
            "response_time": 10.0,
            "difficulty": 3
        })
    for _ in range(3):
        diagnostic_attempts_cds.append({
            "subtopic_id": str(cds_sub_id),
            "is_correct": False,
            "confidence_level": 2,
            "response_time": 11.0,
            "difficulty": 3
        })
        
    response = client.post("/v1/student/onboard/initialize", json={
        "user_id": "student_007",
        "exam_type": "CDS",
        "attempts": diagnostic_attempts_cds
    })
    print("CDS Diagnostic Onboarding Response:")
    print(response.json())

    print("\n" + "="*50)
    print("TEST 2: TRIGGER FRAGILE LEARNING VOLATILITY CHECK")
    print("="*50)
    
    # Submit 5 attempts with swinging outcomes for UPSC Preamble
    print("\n[UPSC Preamble attempts...]")
    outcomes_upsc = [True, False, True, False, True]
    for idx, is_correct in enumerate(outcomes_upsc):
        client.post("/v1/attempts/submit", json={
            "user_id": "student_007",
            "subtopic_id": str(upsc_sub_id),
            "exam_type": "UPSC",
            "is_correct": is_correct,
            "response_time": 10.0,
            "confidence_level": 4,
            "difficulty_level": 3,
            "use_confidence": True,
            "use_irt": True
        })
        
    # Submit 5 attempts for CDS Tenses as well to generate second active volatility record
    print("\n[CDS Tenses attempts...]")
    outcomes_cds = [True, True, False, True, False]
    for idx, is_correct in enumerate(outcomes_cds):
        client.post("/v1/attempts/submit", json={
            "user_id": "student_007",
            "subtopic_id": str(cds_sub_id),
            "exam_type": "CDS",
            "is_correct": is_correct,
            "response_time": 8.0,
            "confidence_level": 4,
            "difficulty_level": 3,
            "use_confidence": True,
            "use_irt": True
        })
        
    print("\n" + "="*50)
    print("TEST 3: FETCH FRAGILE LEARNING DEEP REVIEW ALERTS")
    print("="*50)
    
    # Query fragile alerts route
    response = client.get("/v1/student/alerts?user_id=student_007&exam_type=UPSC")
    print("GET /v1/student/alerts Response:")
    print(response.json())
    
    print("\n" + "="*50)
    print("TEST 4: MASTERY GALAXY ANALYTICS")
    print("="*50)
    
    response = client.get("/v1/student/analytics/galaxy?user_id=student_007&exam_type=UPSC")
    print("UPSC Mastery Galaxy Visual Map:")
    print(response.json())

    # Close DB Engine
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(main_test())
