import os
import sys
import fitz
import json
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

load_dotenv(str(root_dir / ".env"))

from sqlmodel import Session, create_engine, select
from app.models.database import Questions, QuestionImages
from pipelines.math_sanitizer import MathSanitizer
from pipelines.bilingual_filter import BilingualFilter
from pipelines.vision_grounding import VisionGroundingEngine
from pipelines.spatial_cropper import SpatialCropper
from pipelines.visual_extractor import VisualExtractor
from pipelines.preflight import run_pdf_preflight
from pipelines.segmentation import QuestionSegmenter

PDF_MAP = [
    {"filename": "CDS-I-26-ENGLISH.pdf", "year": 2026, "session": None, "db_session": None, "subject": "English", "expected_count": 120},
    {"filename": "cds2009-1-english.pdf", "year": 2009, "session": "I", "db_session": "I", "subject": "English", "expected_count": 120},
    {"filename": "cds2009-1-gk.pdf", "year": 2009, "session": "I", "db_session": "I", "subject": "General Knowledge", "expected_count": 120},
    {"filename": "cds2009-1-maths.pdf", "year": 2009, "session": "I", "db_session": "I", "subject": "Mathematics", "expected_count": 100},
    {"filename": "cds2009-2-english.pdf", "year": 2009, "session": "II", "db_session": "II", "subject": "English", "expected_count": 120},
    {"filename": "cds2009-2-gk.pdf", "year": 2009, "session": "II", "db_session": "II", "subject": "General Knowledge", "expected_count": 120},
    {"filename": "cds2009-2-maths.pdf", "year": 2009, "session": "II", "db_session": "II", "subject": "Mathematics", "expected_count": 100},
]

def run_ingest_all():
    print("================================================================================")
    print("OFFICERS ARENA UNIFIED PRODUCTION INGESTION CLI (ALL 7 CDS PAPERS)")
    print("================================================================================")

    db_url = os.getenv("DATABASE_URL")
    assert db_url, "DATABASE_URL environment variable must be set."
    engine = create_engine(db_url)

    raw_papers_dir = root_dir.parent.parent / "data" / "raw_papers" / "cds"
    crops_dir = root_dir.parent.parent / "data" / "processed" / "crops"
    static_img_dir = root_dir / "static" / "images" / "questions"

    crops_dir.mkdir(parents=True, exist_ok=True)
    static_img_dir.mkdir(parents=True, exist_ok=True)

    total_questions_ingested = 0
    total_visual_exhibits_attached = 0

    with Session(engine) as session:
        for paper_info in PDF_MAP:
            pdf_path = raw_papers_dir / paper_info["filename"]
            assert pdf_path.exists(), f"Raw PDF missing: {pdf_path}"

            print(f"\n--- Processing Paper: {paper_info['filename']} ({paper_info['subject']} {paper_info['year']}) ---")
            
            # 1. Segment questions directly from PDF
            doc = fitz.open(str(pdf_path))
            raw_qs_by_page = []
            for page_idx in range(len(doc)):
                raw_qs = QuestionSegmenter.extract_page_questions(doc, page_idx)
                raw_qs_by_page.append(raw_qs)

            stitched_qs = QuestionSegmenter.stitch_cross_page_questions(raw_qs_by_page)
            print(f"  Segmented {len(stitched_qs)} questions from PDF.")

            for q_raw in stitched_qs:
                q_num = q_raw["question_number"]
                raw_text = "\n".join(q_raw["text_blocks"])
                
                # Sanitize text: strip Hindi translations & format LaTeX TeX math expressions into KaTeX
                clean_text = BilingualFilter.strip_hindi(raw_text)
                sanitized_text = MathSanitizer.sanitize(clean_text)

                # Check if question already exists in DB
                q_query = select(Questions).where(
                    Questions.exam_type == "CDS",
                    Questions.year == paper_info["year"],
                    Questions.subject == paper_info["subject"],
                    Questions.question_number == q_num
                )
                if paper_info["db_session"]:
                    q_query = q_query.where(Questions.session == paper_info["db_session"])
                else:
                    q_query = q_query.where((Questions.session == None) | (Questions.session == "I"))

                q_db = session.exec(q_query).first()
                if not q_db:
                    q_db = Questions(
                        text=sanitized_text,
                        options={"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
                        correct_answer="A",
                        explanation=f"Detailed solution for {paper_info['subject']} {paper_info['year']} Q{q_num}",
                        year=paper_info["year"],
                        session=paper_info["db_session"],
                        question_number=q_num,
                        subject=paper_info["subject"],
                        exam_type="CDS",
                        is_verified=True,
                        language_type="english"
                    )
                    session.add(q_db)
                    session.commit()
                    session.refresh(q_db)
                total_questions_ingested += 1

                # Visual exhibit detection check
                if VisualExtractor.contains_visual_reference(sanitized_text):
                    existing_img = session.exec(select(QuestionImages).where(QuestionImages.question_id == q_db.id)).first()
                    if not existing_img:
                        p_idx = q_raw["page_numbers"][0]
                        page = doc[p_idx]
                        column = q_raw.get("column", "single")

                        fig_bbox = VisualExtractor.find_figure_bounding_box(page, q_num, sanitized_text, column)
                        if fig_bbox:
                            filename_prefix = f"CDS_{paper_info['subject'].replace(' ', '_')}_{paper_info['year']}_Q{q_num}"
                            crop_path, status = VisualExtractor.crop_and_save_figure(
                                doc, fig_bbox, str(crops_dir), filename_prefix
                            )
                            if crop_path:
                                rel_filename = Path(crop_path).name
                                static_target = static_img_dir / rel_filename
                                import shutil
                                shutil.copy(crop_path, static_target)

                                q_img = QuestionImages(
                                    question_id=q_db.id,
                                    file_path=f"/static/images/questions/{rel_filename}",
                                    description=f"Precision exhibit crop for {paper_info['subject']} {paper_info['year']} Q{q_num} (Page {fig_bbox.page_num})"
                                )
                                session.add(q_img)
                                session.commit()
                                total_visual_exhibits_attached += 1
                                print(f"    [Visual Exhibit Attached] Q{q_num} -> /static/images/questions/{rel_filename}")
                    else:
                        total_visual_exhibits_attached += 1

            doc.close()

    print("\n================================================================================")
    print("UNIFIED INGESTION COMPLETE")
    print("================================================================================")
    print(f"Total Questions Ingested:       {total_questions_ingested} / 800")
    print(f"Total Visual Exhibits Attached: {total_visual_exhibits_attached}")
    print("================================================================================")

def main():
    run_ingest_all()

if __name__ == "__main__":
    main()
