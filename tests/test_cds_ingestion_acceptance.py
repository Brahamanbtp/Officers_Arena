import os
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "apps" / "api"))
sys.path.insert(0, str(root_dir / "scripts"))

from dotenv import load_dotenv
load_dotenv(str(root_dir / "apps" / "api" / ".env"))

from sqlmodel import Session, create_engine, select
from app.models.database import Questions, QuestionImages
from pipelines.bilingual_filter import BilingualFilter

def run_acceptance_tests():
    print("================================================================================")
    print("RUNNING CDS PDF INGESTION ACCEPTANCE TEST SUITE")
    print("================================================================================")

    db_url = os.getenv("DATABASE_URL")
    assert db_url is not None, "DATABASE_URL environment variable must be set"
    engine = create_engine(db_url)

    with Session(engine) as session:
        qs = session.exec(select(Questions)).all()
        print(f"[TEST 1] Total Questions in DB: {len(qs)} (Target: 800)")
        assert len(qs) == 800, f"Expected 800 canonical questions, found {len(qs)}!"
        print("   PASS: Exactly 800 canonical questions present in database.")

        english_qs = session.exec(select(Questions).where(Questions.language_type == "english")).all()
        print(f"[TEST 2] Checking {len(english_qs)} English questions for bilingual Hindi contamination...")
        hindi_found = 0
        for q in english_qs:
            if BilingualFilter.contains_hindi(q.text):
                hindi_found += 1
                print(f"   FAILED: QID {q.id} contains Hindi text: {q.text[:60]}")

        assert hindi_found == 0, f"Found {hindi_found} questions with Hindi contamination!"
        print("   PASS: 0 Hindi contamination found across all English questions.")

        imgs = session.exec(select(QuestionImages)).all()
        print(f"[TEST 3] Checking {len(imgs)} QuestionImages records for crop existence on disk...")
        static_base = root_dir / "apps" / "api"
        missing_crops = 0
        for img in imgs:
            clean_rel = img.file_path.lstrip("/")
            file_on_disk = static_base / clean_rel
            if not file_on_disk.exists():
                missing_crops += 1
                print(f"   FAILED: Image file missing on disk: {file_on_disk}")

        assert missing_crops == 0, f"Found {missing_crops} missing image crop files on disk!"
        print("   PASS: 100% of attached QuestionImages crop files exist on disk.")

    print("\n================================================================================")
    print("ALL ACCEPTANCE TESTS PASSED (100% SUCCESS)")
    print("================================================================================")

if __name__ == "__main__":
    run_acceptance_tests()
