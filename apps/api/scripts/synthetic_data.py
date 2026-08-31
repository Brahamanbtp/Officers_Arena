import os
import sys
import uuid
import random
import asyncio
from datetime import datetime, timedelta
from sqlmodel import select
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Add apps/api/app to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import async_engine, async_session_maker, init_db
from app.models.database import Questions, Syllabus
from app.models.student_stats import StudentAttempt, PerformanceLog

async def generate_synthetic_population():
    print("============================================================")
    print("SYNTHETIC STUDENT POPULATION GENERATOR")
    print("============================================================")
    
    # Initialize DB schema
    await init_db()
    
    async with async_session_maker() as db:
        # 1. Fetch questions and syllabus items
        q_res = await db.execute(select(Questions))
        questions = q_res.scalars().all()
        
        syl_res = await db.execute(select(Syllabus))
        syllabus_items = syl_res.scalars().all()
        
        # If DB is empty, seed some mock questions and syllabus items to run simulation
        if not syllabus_items:
            print("Syllabus is empty. Seeding mock syllabus nodes...")
            sub_id = uuid.uuid4()
            syl_node = Syllabus(
                id=sub_id,
                name="Indian Polity",
                exam_type="UPSC",
                level="Subject",
                parent_id=None
            )
            db.add(syl_node)
            
            topic_id = uuid.uuid4()
            syl_topic = Syllabus(
                id=topic_id,
                name="Constitutional Framework",
                exam_type="UPSC",
                level="Topic",
                parent_id=sub_id
            )
            db.add(syl_topic)
            
            subtopic_id = uuid.uuid4()
            syl_subtopic = Syllabus(
                id=subtopic_id,
                name="Emergency Provisions",
                exam_type="UPSC",
                level="Subtopic",
                parent_id=topic_id
            )
            db.add(syl_subtopic)
            await db.commit()
            
            # Refetch
            syl_res = await db.execute(select(Syllabus))
            syllabus_items = syl_res.scalars().all()
            
        subtopics = [s for s in syllabus_items if s.level == "Subtopic"]
        if not subtopics:
            subtopics = syllabus_items
            
        if not questions:
            print("Questions table is empty. Seeding mock questions...")
            for i in range(50):
                q = Questions(
                    id=uuid.uuid4(),
                    text=f"Mock Question {i + 1} regarding Indian Administration",
                    options={"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
                    correct_answer="A",
                    explanation="Mock explanation text.",
                    subtopic_id=subtopics[0].id,
                    year=2020 + (i % 5),
                    difficulty="Medium" if i % 2 == 0 else "Hard",
                    exam_type="UPSC",
                    is_verified=True,
                    difficulty_b=0.0 if i % 2 == 0 else 1.5,
                    discrimination_a=1.0,
                    guessing_c=0.25
                )
                db.add(q)
            await db.commit()
            
            # Refetch
            q_res = await db.execute(select(Questions))
            questions = q_res.scalars().all()

        print(f"Loaded {len(questions)} questions and {len(syllabus_items)} syllabus nodes.")
        
        # Clear existing attempts and logs to start fresh (or leave them)
        print("Clearing old student attempts and logs...")
        await db.execute(text("DELETE FROM student_attempts;"))
        await db.execute(text("DELETE FROM performance_log;"))
        await db.commit()

        # 2. Generate 500 students
        student_profiles = []
        for idx in range(1, 501):
            # Assign profile types: Pro (15%), Beginner (45%), Inconsistent (40%)
            rand = random.random()
            if rand < 0.15:
                profile = "The Pro"
            elif rand < 0.60:
                profile = "The Beginner"
            else:
                profile = "Inconsistent"
                
            student_profiles.append({
                "id": f"student_{idx}",
                "profile": profile
            })
            
        print(f"Generated student config: 500 profiles created.")
        
        attempts_added = 0
        logs_added = 0
        
        # 3. Simulate History for each student (100 to 200 events)
        for s in student_profiles:
            num_events = random.randint(100, 200)
            user_id = s["id"]
            profile = s["profile"]
            
            # Baseline accuracy based on profile
            if profile == "The Pro":
                base_accuracy = 0.88
                variance = 0.05
            elif profile == "The Beginner":
                base_accuracy = 0.40
                variance = 0.08
            else:  # Inconsistent
                base_accuracy = 0.60
                variance = 0.25 # High variance
                
            from datetime import timezone
            start_date = datetime.now(timezone.utc) - timedelta(days=60)
            
            for ev_idx in range(num_events):
                # Choose random question
                q = random.choice(questions)
                subtopic_id = q.subtopic_id or subtopics[0].id
                
                # Determine accuracy for this attempt
                acc = base_accuracy + random.normalvariate(0, variance)
                acc = max(0.05, min(0.95, acc))
                
                # Adjust accuracy slightly by question difficulty
                is_hard = (q.difficulty_b or 0.0) > 1.0
                is_easy = (q.difficulty_b or 0.0) < -1.0
                
                if is_hard:
                    acc -= 0.10
                elif is_easy:
                    acc += 0.10
                acc = max(0.05, min(0.95, acc))
                
                is_correct = random.random() < acc
                response_time = random.uniform(20.0, 120.0)
                confidence = random.randint(1, 5)
                timestamp = start_date + timedelta(minutes=random.randint(10, 1440) * ev_idx)
                
                # Create StudentAttempt
                attempt = StudentAttempt(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    subtopic_id=subtopic_id,
                    exam_type=q.exam_type,
                    is_correct=is_correct,
                    response_time=response_time,
                    confidence_level=confidence,
                    timestamp=timestamp,
                    difficulty_weight=1.5 if is_hard else 1.0,
                    calibration_impact=0.05
                )
                db.add(attempt)
                attempts_added += 1
                
                # Create PerformanceLog
                log = PerformanceLog(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    question_id=q.id,
                    is_correct=is_correct,
                    response_time=response_time,
                    confidence_level=confidence,
                    timestamp=timestamp
                )
                db.add(log)
                logs_added += 1
                
            # Commit in batches of 50 students
            if int(user_id.split("_")[1]) % 50 == 0:
                await db.commit()
                print(f"Progress: Committed data for {user_id}...")
                
        await db.commit()
        print(f"Successfully generated and committed {attempts_added} attempts and {logs_added} logs.")
        print("============================================================")

from sqlalchemy import text

if __name__ == "__main__":
    asyncio.run(generate_synthetic_population())
