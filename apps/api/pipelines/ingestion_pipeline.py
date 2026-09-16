import os
import re
import time
import json
import uuid
import sys
from typing import List, Dict, Optional, Any, Tuple
from sqlmodel import Session, create_engine, select

# Add parent directories to path to ensure proper module imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.database import Syllabus, Questions, QuestionImages
from app.schemas.question import QuestionIngestSchema, ExtractedQuestionsResponse
from pipelines.extractors.pdf_extractor import extract_pdf_content
from pipelines.vectorizer.embedder import get_embedding
from pipelines.schemas.manifest import PaperManifest, QuestionManifest, FigureManifest

import openai
from dotenv import load_dotenv

load_dotenv()

class QuestionExtractor:
    def __init__(
        self,
        db_url: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        syllabus_path: Optional[str] = None,
        image_output_dir: Optional[str] = None,
        exam_type: Optional[str] = None,
        year: Optional[int] = None,
        session: Optional[str] = None,
        subject: Optional[str] = None
    ):
        """
        Initializes the Ingestion Pipeline.
        """
        self.db_url = db_url or os.getenv("DATABASE_URL")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.syllabus_path = syllabus_path or os.path.join("data", "syllabus", "upsc_cds_hierarchy.json")
        self.image_output_dir = image_output_dir or os.path.join("data", "processed", "images")
        
        self.exam_type = exam_type
        self.year = year
        self.session = session
        self.subject = subject
        
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY must be set in environment or passed to constructor.")
            
        # Initialize database engine if database URL is provided
        self.engine = None
        if self.db_url:
            self.engine = create_engine(self.db_url)
            
        # Load syllabus hierarchy from JSON
        self.syllabus_hierarchy = {}
        if os.path.exists(self.syllabus_path):
            with open(self.syllabus_path, "r", encoding="utf-8") as f:
                self.syllabus_hierarchy = json.load(f)
        else:
            print(f"Warning: Syllabus hierarchy template not found at {self.syllabus_path}")

        # Initialize OpenAI Client
        self.client = openai.OpenAI(api_key=self.openai_api_key)

    def seed_syllabus(self) -> None:
        """
        Seeds the database Syllabus table with the hierarchy from syllabus_hierarchy.json.
        """
        if not self.engine:
            print("No database connection. Skipping syllabus seeding.")
            return

        print("Seeding syllabus hierarchy from JSON...")
        with Session(self.engine) as session:
            for exam_type, subjects in self.syllabus_hierarchy.items():
                for subject_name, topics in subjects.items():
                    # Create or find Subject
                    stmt = select(Syllabus).where(
                        Syllabus.name == subject_name,
                        Syllabus.level == "Subject",
                        Syllabus.exam_type == exam_type
                    )
                    subject_db = session.exec(stmt).first()
                    if not subject_db:
                        subject_db = Syllabus(
                            name=subject_name,
                            level="Subject",
                            exam_type=exam_type,
                            parent_id=None
                        )
                        session.add(subject_db)
                        session.commit()
                        session.refresh(subject_db)
                    
                    for topic_name, subtopics in topics.items():
                        # Create or find Topic
                        stmt = select(Syllabus).where(
                            Syllabus.name == topic_name,
                            Syllabus.level == "Topic",
                            Syllabus.exam_type == exam_type,
                            Syllabus.parent_id == subject_db.id
                        )
                        topic_db = session.exec(stmt).first()
                        if not topic_db:
                            topic_db = Syllabus(
                                name=topic_name,
                                level="Topic",
                                exam_type=exam_type,
                                parent_id=subject_db.id
                            )
                            session.add(topic_db)
                            session.commit()
                            session.refresh(topic_db)
                            
                        for subtopic_name in subtopics:
                            # Create or find Subtopic
                            stmt = select(Syllabus).where(
                                Syllabus.name == subtopic_name,
                                Syllabus.level == "Subtopic",
                                Syllabus.exam_type == exam_type,
                                Syllabus.parent_id == topic_db.id
                            )
                            subtopic_db = session.exec(stmt).first()
                            if not subtopic_db:
                                subtopic_db = Syllabus(
                                    name=subtopic_name,
                                    level="Subtopic",
                                    exam_type=exam_type,
                                    parent_id=topic_db.id
                                )
                                session.add(subtopic_db)
                                session.commit()

            print("Syllabus seeding complete.")

    def extract_layout(self, pdf_path: str) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Extracts raw text and saves extracted figures to the images directory.
        Returns the raw text with [IMAGE_REF:uuid] placeholders and list of images metadata.
        """
        print(f"Extracting layout and text from PDF: {pdf_path}")
        try:
            return extract_pdf_content(pdf_path, self.image_output_dir)
        except Exception as e:
            print(f"Error during PDF parsing: {e}")
            raise e

    def describe_image(self, image_path: str) -> str:
        """
        Uses gpt-4o-mini to generate semantic descriptions of extracted maps, charts, or chemistry diagrams.
        """
        import base64
        print(f"Describing image: {image_path}")
        
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")

        try:
            with open(image_path, "rb") as img_file:
                base64_image = base64.b64encode(img_file.read()).decode("utf-8")

            # Request description focusing on maps, charts, or formulas
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": "You are a Senior Subject Matter Expert for UPSC/CDS exams. Describe this exam question figure in detail. "
                                        "If it is a map, identify key rivers, borders, states, and coordinates shown. "
                                        "If it is a chart/graph, list the data points, axes labels, and trends. "
                                        "If it is a scientific or chemical structure diagram, describe the elements, bonds, and symbols exactly. "
                                        "Focus on enabling high-quality semantic vector search based on the visual contents."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )
            description = response.choices[0].message.content.strip() if hasattr(response, "choices") and response.choices[0].message.content else ""  # type: ignore
            return description
        except Exception as e:
            print(f"Error generating image description for {image_path}: {e}")
            return f"Error describing image: {e}"

    def _chunk_raw_text(self, raw_text: str, max_questions_per_chunk: int = 8) -> List[str]:
        """
        Splits raw text into bounded chunks of 5-8 questions to ensure LLM responses
        stay well within maximum output token limits (guaranteeing zero truncated JSON).
        """
        lines = raw_text.splitlines()
        chunks: List[str] = []
        current_chunk_lines: List[str] = []
        q_count = 0

        for line in lines:
            if re.match(r"^\s*(?:Q(?:uestion)?\s*[\.\:]?\s*)?\d{1,3}\s*[\.\:\)]\s*", line):
                q_count += 1
                if q_count > max_questions_per_chunk and len(current_chunk_lines) > 20:
                    chunks.append("\n".join(current_chunk_lines))
                    current_chunk_lines = []
                    q_count = 1
            current_chunk_lines.append(line)

        if current_chunk_lines:
            chunks.append("\n".join(current_chunk_lines))

        if not chunks:
            step = 3500
            chunks = [raw_text[i:i+step] for i in range(0, max(1, len(raw_text)), step)]

        return chunks

    def structure_content(self, raw_text: str, image_descriptions: Dict[str, str]) -> Tuple[List[QuestionIngestSchema], str]:
        """
        Converts the raw extracted text + vision descriptions into structured Pydantic models
        using windowed chunking to avoid output token limits.
        """
        print("Structuring content into JSON format using windowed chunking with gpt-4o-mini...")
        
        image_desc_text = ""
        if image_descriptions:
            image_desc_text = "\n".join([f"[{ref_id}]: {desc}" for ref_id, desc in image_descriptions.items()])

        system_prompt = (
            "You are a UPSC/CDS exam parser. Most input text is bilingual (English and Hindi).\n"
            "TASK: Extract only the English version of the questions. Ignore the Hindi translations completely. "
            "If a question contains a mix of both, extract the coherent English sentence structure.\n"
            "Convert all math, chemistry, and science formulas to standard KaTeX notation.\n"
            "Use single '$' for inline equations (e.g. $CH_4$ or $E=mc^2$) and double '$$' for block/centered equations.\n"
            "For multi-statement questions (e.g., 'Consider the following statements...'), preserve the numbered statement list inside the question text exactly, using linebreaks.\n"
            "Ensure options dictionary has non-empty values for A, B, C, and D without label duplication.\n"
            "Include the correct answer key ('A', 'B', 'C', or 'D'), options dictionary, and explanation.\n"
            "Ensure the output conforms exactly to the requested JSON structure."
        )

        chunks = self._chunk_raw_text(raw_text, max_questions_per_chunk=8)
        all_parsed_questions: List[QuestionIngestSchema] = []
        raw_responses: List[str] = []

        for c_idx, chunk in enumerate(chunks):
            print(f"Processing chunk {c_idx + 1}/{len(chunks)} ({len(chunk)} characters)...")
            user_content = (
                f"Here is a section of raw text extracted from the PDF:\n\n{chunk}\n\n"
                f"Here are the descriptions of the extracted images:\n\n{image_desc_text}\n\n"
                f"Please structure all questions in this chunk into the required JSON format."
            )

            try:
                response = self.client.beta.chat.completions.parse(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    response_format=ExtractedQuestionsResponse,
                    timeout=90
                )
                parsed = response.choices[0].message.parsed  # type: ignore
                if parsed and parsed.questions:
                    all_parsed_questions.extend(parsed.questions)
                raw_response = response.choices[0].message.content or ""  # type: ignore
                raw_responses.append(raw_response)
            except Exception as e:
                print(f"Error structuring chunk {c_idx + 1} with LLM: {e}")
                # Retry once on failure
                try:
                    time.sleep(2)
                    response = self.client.beta.chat.completions.parse(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content}
                        ],
                        response_format=ExtractedQuestionsResponse,
                        timeout=90
                    )
                    parsed = response.choices[0].message.parsed  # type: ignore
                    if parsed and parsed.questions:
                        all_parsed_questions.extend(parsed.questions)
                except Exception as retry_err:
                    print(f"Retry failed for chunk {c_idx + 1}: {retry_err}")

        # Deduplicate parsed questions by text/question number
        seen_texts = set()
        deduped_questions: List[QuestionIngestSchema] = []
        for q in all_parsed_questions:
            t_key = q.text[:50].strip().lower()
            if t_key not in seen_texts:
                seen_texts.add(t_key)
                deduped_questions.append(q)

        return deduped_questions, "\n---\n".join(raw_responses)

    def map_to_syllabus(self, question_text: str, exam_type: str) -> Optional[uuid.UUID]:
        """
        Semantically maps a question to a Syllabus subtopic using gpt-4o-mini classification,
        then retrieves the corresponding subtopic_id from the database.
        """
        if not self.engine:
            print("No database connection. Syllabus mapping will return None.")
            return None

        # Flatten the syllabus subtopics for this specific exam_type
        subtopics = []
        exam_syllabus = self.syllabus_hierarchy.get(exam_type, {})
        for subject, topics in exam_syllabus.items():
            for topic, subtopic_list in topics.items():
                for subtopic in subtopic_list:
                    subtopics.append(subtopic)

        if not subtopics:
            return None

        print(f"Mapping question to {exam_type} syllabus subtopic...")
        
        subject_context = f" (Subject: {self.subject})" if getattr(self, "subject", None) else ""
        system_prompt = (
            f"You are a syllabus classifier for the {exam_type} examination{subject_context}.\n"
            "You will be given a question text and a list of valid subtopics. "
            "Select the single most relevant subtopic from the list that matches the question's content. "
            "Return ONLY the exact subtopic name from the list. If none match, return 'None'."
        )

        user_content = (
            f"Question:\n{question_text}\n\n"
            f"Subtopics List:\n" + "\n".join(subtopics)
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                max_tokens=100,
                temperature=0.0
            )
            selected_subtopic = response.choices[0].message.content.strip() if hasattr(response, "choices") and response.choices[0].message.content else "None"  # type: ignore
            
            if selected_subtopic == "None" or selected_subtopic not in subtopics:
                return None
                
            # Query database for the subtopic ID
            with Session(self.engine) as session:
                stmt = select(Syllabus).where(
                    Syllabus.name == selected_subtopic,
                    Syllabus.level == "Subtopic",
                    Syllabus.exam_type == exam_type
                )
                subtopic_record = session.exec(stmt).first()
                if subtopic_record:
                    return subtopic_record.id
            return None
        except Exception as e:
            print(f"Error during syllabus mapping: {e}")
            return None

    def vectorize_and_upsert(
        self,
        question_data: QuestionIngestSchema,
        image_descriptions: Dict[str, str],
        image_metadata: List[Dict[str, Any]],
        subtopic_id: Optional[uuid.UUID] = None,
        raw_llm_response: Optional[str] = None
    ) -> uuid.UUID:
        """
        Generates embedding and upserts the question and its associated images into the database.
        """
        if not self.engine:
            raise RuntimeError("Database engine not initialized. Cannot upsert question.")

        # Combine text + image descriptions to generate a unified representation for semantic search
        associated_image_descs = []
        for ref_id in question_data.image_refs:
            desc = image_descriptions.get(ref_id)
            if desc:
                associated_image_descs.append(desc)
                
        text_to_embed = question_data.text
        if associated_image_descs:
            text_to_embed += "\n[Image Content Descriptions]: " + " | ".join(associated_image_descs)
            
        # Add exam type context to the embedding to prevent vector space crosstalk, 
        # but also we rely on strict metadata filtering (exam_type = 'UPSC' vs 'CDS').
        text_to_embed = f"[{question_data.exam_type}] {text_to_embed}"

        print("Generating embedding using text-embedding-3-small...")
        embedding_vector = get_embedding(text_to_embed, self.openai_api_key or "")

        with Session(self.engine) as session:
            # Create the Questions record
            db_question = Questions(
                text=question_data.text,
                options=question_data.options,
                correct_answer=question_data.correct_answer,
                explanation=question_data.explanation,
                embedding=embedding_vector,
                subtopic_id=subtopic_id,
                year=question_data.year,
                session=question_data.session,
                paper_type="PYQ",
                subject=getattr(self, "subject", None) or "English",
                cognitive_level=question_data.cognitive_level,
                exam_type=question_data.exam_type,
                is_verified=False,
                raw_llm_response=raw_llm_response,
                language_type=getattr(question_data, "language_type", "english") or "english"
            )
            session.add(db_question)
            session.commit()
            session.refresh(db_question)

            # Link any images found in the question_data.image_refs
            for ref_id in question_data.image_refs:
                # Find the file path from the image metadata list
                matching_metadata = next((item for item in image_metadata if item["uuid"] == ref_id), None)
                if matching_metadata:
                    db_image = QuestionImages(
                        question_id=db_question.id,
                        file_path=matching_metadata["file_path"],
                        description=image_descriptions.get(ref_id)
                    )
                    session.add(db_image)
            
            session.commit()
            print(f"Successfully upserted question (ID: {db_question.id}) into database.")
            return db_question.id

    def process_pdf(
        self, 
        pdf_path: str, 
        exam_type: Optional[str] = None, 
        year: Optional[int] = None,
        session: Optional[str] = None
    ) -> List[uuid.UUID]:
        """
        Executes the full pipeline for a given PDF paper.
        """
        final_exam_type = exam_type or getattr(self, "exam_type", None)
        final_year = year or getattr(self, "year", None)
        final_session = session or getattr(self, "session", None)
        if not final_exam_type or not final_year:
            raise ValueError("exam_type and year must be specified either at initialization or when calling process_pdf.")

        # 1. Seed syllabus first if not seeded
        self.seed_syllabus()

        # 2. Layout extraction
        raw_text, image_metadata = self.extract_layout(pdf_path)

        # 3. Vision AI processing for images
        image_descriptions = {}
        for img_info in image_metadata:
            img_uuid = img_info["uuid"]
            img_path = img_info["file_path"]
            description = self.describe_image(img_path)
            image_descriptions[img_uuid] = description

        # 4. LLM structuring
        structured_questions, raw_llm_response = self.structure_content(raw_text, image_descriptions)

        # 5. Syllabus mapping & DB insertion
        upserted_ids = []
        for q in structured_questions:
            # Override exam_type, year, and session from arguments if not set
            q.exam_type = final_exam_type
            q.year = final_year
            q.session = final_session
            
            # Map subtopic
            subtopic_id = self.map_to_syllabus(q.text, final_exam_type)
            
            # Vectorize & insert
            if self.engine:
                q_id = self.vectorize_and_upsert(
                    q, 
                    image_descriptions, 
                    image_metadata, 
                    subtopic_id,
                    raw_llm_response=raw_llm_response
                )
                upserted_ids.append(q_id)
            else:
                print(f"Skipping DB upsert for question: '{q.text[:60]}...' (No engine configured)")

        return upserted_ids

    def run_question_centric_pipeline(
        self,
        pdf_path: str,
        dry_run: bool = True
    ) -> PaperManifest:
        """
        Executes the question-centric ingestion & visual extraction architecture pipeline.
        Supports dry_run (local manifest artifacts without DB writes) and full persistence mode.
        """
        from pipelines.preflight import run_pdf_preflight
        from pipelines.segmentation import QuestionSegmenter
        from pipelines.visual_extractor import VisualExtractor
        try:
            import pymupdf as fitz
        except ImportError:
            import fitz

        print(f"=== Starting Question-Centric Pipeline for: {pdf_path} (dry_run={dry_run}) ===")
        doc = fitz.open(pdf_path)

        # Stage 1: Preflight inspection & caching
        paper_manifest = run_pdf_preflight(pdf_path)
        print(f"[Stage 1 Preflight] Paper: {paper_manifest.exam_type} {paper_manifest.year} {paper_manifest.session or ''} {paper_manifest.subject} (Hash: {paper_manifest.source_pdf_hash[:12]})")

        # Stage 2: Question Ownership Region Segmentation
        raw_qs_by_page = []
        for p_idx in range(len(doc)):
            p_qs = QuestionSegmenter.extract_page_questions(doc, p_idx)
            raw_qs_by_page.append(p_qs)

        stitched_qs = QuestionSegmenter.stitch_cross_page_questions(raw_qs_by_page)
        print(f"[Stage 2 Segmentation] Detected {len(stitched_qs)} stitched questions.")

        question_manifests: List[QuestionManifest] = []
        output_image_dir = os.path.join(self.image_output_dir, paper_manifest.source_pdf_hash[:12])
        os.makedirs(output_image_dir, exist_ok=True)

        # Stage 3: Spatial Visual Region Detection & Precision Cropping Engine
        for idx, q_data in enumerate(stitched_qs):
            q_num = q_data.get("question_number", idx + 1)
            p_nums = q_data.get("page_numbers", [0])
            first_p = p_nums[0]
            page = doc[first_p]

            q_text_content = "\n".join(q_data.get("text_blocks", []))
            
            # Compute Ownership Region
            next_y0 = stitched_qs[idx+1]["bboxes"][0].y0 if idx + 1 < len(stitched_qs) and stitched_qs[idx+1]["page_numbers"][0] == first_p else None
            ownership_reg = QuestionSegmenter.compute_ownership_region(q_data, page.rect.width, page.rect.height, next_y0)

            q_manifest = QuestionManifest(
                question_number=q_num,
                source_pdf=paper_manifest.source_pdf,
                source_pdf_hash=paper_manifest.source_pdf_hash,
                page_numbers=p_nums,
                text=q_text_content,
                options={"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
                correct_answer="A",
                year=paper_manifest.year,
                session=paper_manifest.session,
                subject=paper_manifest.subject,
                exam_type=paper_manifest.exam_type,
                ownership_region=ownership_reg
            )

            # Check if visual exhibit exists inside ownership region
            if VisualExtractor.contains_visual_reference(q_text_content):
                fig_bbox = VisualExtractor.find_figure_bounding_box(
                    page, q_num, q_text_content, column=q_data.get("column", "single")
                )
                if fig_bbox:
                    crop_path, crop_status = VisualExtractor.crop_and_save_figure(
                        doc, fig_bbox, output_image_dir, f"q{q_num}"
                    )
                    if crop_path:
                        fig_manifest = FigureManifest(
                            bbox=fig_bbox,
                            visual_type="diagram",
                            crop_file_path=crop_path,
                            source_question_number=q_num,
                            confidence=0.95
                        )
                        q_manifest.figures.append(fig_manifest)

            question_manifests.append(q_manifest)

        paper_manifest.questions = question_manifests
        paper_manifest.detected_question_count = len(question_manifests)

        # Stage 4: Structural Assertion Engine & 8-Link Validation
        paper_manifest = IngestionValidator.run_paper_validation_gates(paper_manifest)

        # Stage 5: Reports & Debug Contact Sheet Generation
        reports_dir = os.path.join("data", "processed", "reports", paper_manifest.source_pdf_hash[:12])
        report_path = os.path.join(reports_dir, "reconciliation_report.json")
        IngestionValidator.generate_reconciliation_report(paper_manifest, report_path)
        
        debug_sheet_path = os.path.join(reports_dir, "debug_contact_sheet.pdf")
        IngestionValidator.render_debug_contact_sheet(doc, paper_manifest, debug_sheet_path)

        doc.close()
        print(f"=== Pipeline Complete. Overall Status: {paper_manifest.overall_status} ===")
        print(f"Report saved to: {report_path}")
        print(f"Debug contact sheet saved to: {debug_sheet_path}")

        return paper_manifest

