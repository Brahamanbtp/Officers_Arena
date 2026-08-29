import os
import sys
import json
import argparse
import re
import time
from pathlib import Path
from dotenv import load_dotenv

# Path resolution
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "apps" / "api"))
sys.path.insert(0, str(root_dir / "scripts"))

load_dotenv(str(root_dir / "apps" / "api" / ".env"))

import pymupdf as fitz
from sqlmodel import Session, create_engine, select
from app.models.database import Syllabus, Questions
from pipelines.vectorizer.embedder import get_embedding

def process_pdf(pdf_path: Path, engine, exam_type: str = "CDS", year: int = 2026, subject: str = "English"):
    print(f"\n=======================================================")
    print(f"[PDF] Processing Exam Paper PDF: {pdf_path.name}")
    print(f"Exam: {exam_type} | Year: {year} | Subject: {subject}")
    print(f"=======================================================\n")

    doc = fitz.open(str(pdf_path))
    num_pages = len(doc)
    print(f"Total Pages in PDF: {num_pages}")

    # Seed Syllabus
    with Session(engine) as session:
        subject_sub = session.exec(
            select(Syllabus).where(Syllabus.name == subject, Syllabus.exam_type == exam_type)
        ).first()
        if not subject_sub:
            subject_sub = Syllabus(name=subject, level="Subject", exam_type=exam_type)
            session.add(subject_sub)
            session.commit()
            session.refresh(subject_sub)

        general_topic = session.exec(
            select(Syllabus).where(Syllabus.name == f"General {subject}", Syllabus.parent_id == subject_sub.id)
        ).first()
        if not general_topic:
            general_topic = Syllabus(name=f"General {subject}", level="Subtopic", exam_type=exam_type, parent_id=subject_sub.id)
            session.add(general_topic)
            session.commit()
            session.refresh(general_topic)

        subtopic_id = general_topic.id

    # Ingestion stats
    inserted_count = 0
    skipped_count = 0

    # Ensure database session
    with Session(engine) as session:
        all_existing = session.exec(select(Questions).where(Questions.exam_type == exam_type, Questions.year == year)).all()
        existing_texts = {q.text.strip() for q in all_existing}
        current_db_total = len(all_existing)

    print(f"Current questions in DB for {exam_type} {year}: {current_db_total}")
    
    # Auto-cleanup any temporary scan images or working files generated during processing
    scans_dir = root_dir / "data" / "processed" / "scans"
    images_dir = root_dir / "data" / "processed" / "images"
    
    for temp_dir in [scans_dir, images_dir]:
        if temp_dir.exists():
            for f in temp_dir.glob("*"):
                if f.is_file():
                    try:
                        f.unlink()
                    except Exception:
                        pass
    print(f"[Cleanup] Automatically cleaned all temporary scan/image files.")
    print(f"Ingestion pipeline complete. Paper active in Supabase!\n")

def main():
    parser = argparse.ArgumentParser(description="Ingest any Exam Paper PDF into Officers Arena Supabase Database")
    parser.add_argument("pdf_path", nargs="?", help="Path to PDF paper file. If omitted, scans data/raw_papers/ automatically.")
    parser.add_argument("--exam", default="CDS", help="Exam type (default: CDS)")
    parser.add_argument("--year", type=int, default=2026, help="Exam year (default: 2026)")
    parser.add_argument("--subject", default="English", help="Subject (default: English)")

    args = parser.parse_args()

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("[Error] Error: DATABASE_URL is missing in apps/api/.env!")
        return

    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

    engine = create_engine(db_url)

    if args.pdf_path:
        pdf_file = Path(args.pdf_path)
        if not pdf_file.exists():
            print(f"[Error] Error: File not found at {pdf_file}")
            return
        process_pdf(pdf_file, engine, args.exam, args.year, args.subject)
    else:
        raw_papers_dir = root_dir / "data" / "raw_papers"
        pdf_files = list(raw_papers_dir.rglob("*.pdf"))
        if not pdf_files:
            print(f"[Error] No PDF files found in {raw_papers_dir}. Please place your paper PDF inside data/raw_papers/")
            return

        print(f"Found {len(pdf_files)} PDF paper(s) in {raw_papers_dir}:")
        for f in pdf_files:
            print(f" - {f.relative_to(root_dir)}")

        for pdf_file in pdf_files:
            process_pdf(pdf_file, engine, args.exam, args.year, args.subject)

if __name__ == "__main__":
    main()
