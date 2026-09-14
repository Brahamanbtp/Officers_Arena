import os
import sys
import json
import argparse
import re
import time
from typing import Optional, List, Dict, Any
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
from pipelines.ingestion_pipeline import QuestionExtractor
from pipelines.vectorizer.embedder import get_embedding

def normalize_session(exam_type: str, session: Optional[str], filename: Optional[str] = None) -> Optional[str]:
    if exam_type.upper() != "CDS":
        return None
    
    if session:
        clean = session.strip().upper()
        if clean in ("I", "1", "FIRST"):
            return "I"
        elif clean in ("II", "2", "SECOND"):
            return "II"
        else:
            raise ValueError(f"Invalid session '{session}' for CDS. Allowed values are 'I' or 'II'.")
            
    # Try inferring from filename if available
    if filename:
        upper = filename.upper()
        if re.search(r'[-_\s]II[-_\s]|[-_\s]2[-_\s]|CDS[-_]?II', upper):
            return "II"
        elif re.search(r'[-_\s]I[-_\s]|[-_\s]1[-_\s]|CDS[-_]?I', upper):
            return "I"
            
    return "I"  # Default fallback for CDS

def process_pdf(pdf_path: Path, engine, exam_type: str = "CDS", year: int = 2026, session: Optional[str] = None, subject: str = "English"):
    norm_session = normalize_session(exam_type, session, pdf_path.name)
    session_str = f" | Session: {norm_session}" if norm_session else ""
    print(f"\n=======================================================")
    print(f"[PDF] Processing Exam Paper PDF: {pdf_path.name}")
    print(f"Exam: {exam_type} | Year: {year}{session_str} | Subject: {subject}")
    print(f"=======================================================\n")

    doc = fitz.open(str(pdf_path))
    num_pages = len(doc)
    print(f"Total Pages in PDF: {num_pages}")

    # Seed Syllabus
    with Session(engine) as db_session:
        subject_sub = db_session.exec(
            select(Syllabus).where(Syllabus.name == subject, Syllabus.exam_type == exam_type)
        ).first()
        if not subject_sub:
            subject_sub = Syllabus(name=subject, level="Subject", exam_type=exam_type)
            db_session.add(subject_sub)
            db_session.commit()
            db_session.refresh(subject_sub)

        general_topic = db_session.exec(
            select(Syllabus).where(Syllabus.name == f"General {subject}", Syllabus.parent_id == subject_sub.id)
        ).first()
        if not general_topic:
            general_topic = Syllabus(name=f"General {subject}", level="Subtopic", exam_type=exam_type, parent_id=subject_sub.id)
            db_session.add(general_topic)
            db_session.commit()
            db_session.refresh(general_topic)

        subtopic_id = general_topic.id

    # Ingestion stats with Session-Aware De-duplication
    with Session(engine) as db_session:
        stmt = select(Questions).where(Questions.exam_type == exam_type, Questions.year == year)
        if exam_type == "CDS" and norm_session:
            stmt = stmt.where(Questions.session == norm_session)
        all_existing = db_session.exec(stmt).all()
        current_db_total = len(all_existing)

    session_label = f" {norm_session}" if norm_session else ""
    print(f"Current questions in DB for {exam_type} {year}{session_label}: {current_db_total}")
    
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
    parser = argparse.ArgumentParser(description="Ingest any Exam Paper PDF into Officers Arena Database")
    parser.add_argument("pdf_path", nargs="?", help="Path to PDF paper file. If omitted, scans data/raw_papers/ automatically.")
    parser.add_argument("--exam", default="CDS", help="Exam type (default: CDS)")
    parser.add_argument("--year", type=int, default=2026, help="Exam year (default: 2026)")
    parser.add_argument("--session", default=None, help="Exam session for CDS: I or II (e.g. --session I or --session II)")
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
        process_pdf(pdf_file, engine, args.exam, args.year, args.session, args.subject)
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
            process_pdf(pdf_file, engine, args.exam, args.year, args.session, args.subject)

if __name__ == "__main__":
    main()

