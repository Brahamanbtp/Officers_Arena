import os
import sys
import asyncio
import random
import uuid
from pathlib import Path
from sqlmodel import select

# Ensure apps/api is in Python's search path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir / "apps" / "api"))

from app.core.database import init_db, async_engine, async_session_maker
from app.models.database import Syllabus, Questions

SUBJECTS = ["Indian Polity", "Geography", "Modern History", "General Science"]

async def seed():
    print("Initializing Database...")
    await init_db()
    
    async with async_session_maker() as session:
        # Check if we already have seeded questions
        res = await session.execute(select(Questions))
        existing_count = len(res.scalars().all())
        if existing_count >= 50:
            print(f"Database already contains {existing_count} questions. Skipping seed.")
            return

        print("Seeding Syllabus nodes...")
        syllabus_nodes = []
        for subject in SUBJECTS:
            for exam in ["UPSC", "CDS"]:
                node = Syllabus(
                    id=uuid.uuid4(),
                    name=subject,
                    exam_type=exam,
                    level="Subject"
                )
                session.add(node)
                syllabus_nodes.append(node)
        await session.commit()

        print("Seeding 50 mock questions with IRT parameters...")
        for i in range(1, 51):
            exam_type = "UPSC" if i <= 25 else "CDS"
            # Randomly select a syllabus node matching the exam type
            node = random.choice([n for n in syllabus_nodes if n.exam_type == exam_type])
            
            # IRT parameter ranges: difficulty_b [-3.0, 3.0], discrimination_a [0.5, 2.5]
            difficulty_b = round(random.uniform(-3.0, 3.0), 3)
            discrimination_a = round(random.uniform(0.5, 2.5), 3)
            guessing_c = 0.25 # standard for 4 options

            correct = random.choice(["A", "B", "C", "D"])
            
            q = Questions(
                id=uuid.uuid4(),
                text=f"Sample Question {i} for {exam_type}: Analyze the core principles of {node.name} regarding federal frameworks and regulatory bodies.",
                options={
                    "A": f"Representative body structure for {node.name}",
                    "B": f"Constitutional decentralization procedures under {node.name}",
                    "C": f"Jurisdictional boundaries of states in relation to {node.name}",
                    "D": f"Financial allocation mechanisms and emergency clauses"
                },
                correct_answer=correct,
                explanation=f"Correct answer is {correct} because of standard operational guidelines defined in standard manuals.",
                subtopic_id=node.id,
                year=random.choice([2023, 2024, 2025, 2026]),
                difficulty="Medium" if -1.0 <= difficulty_b <= 1.0 else ("Easy" if difficulty_b < -1.0 else "Hard"),
                cognitive_level=random.choice(["Understanding", "Applying", "Analyzing"]),
                exam_type=exam_type,
                is_verified=True,
                difficulty_b=difficulty_b,
                discrimination_a=discrimination_a,
                guessing_c=guessing_c
            )
            session.add(q)
            
        await session.commit()
        print("Successfully seeded 50 mock questions.")

if __name__ == "__main__":
    asyncio.run(seed())
