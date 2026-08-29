import os
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
            description = response.choices[0].message.content.strip()
            return description
        except Exception as e:
            print(f"Error generating image description for {image_path}: {e}")
            return f"Error describing image: {e}"

    def structure_content(self, raw_text: str, image_descriptions: Dict[str, str]) -> Tuple[List[QuestionIngestSchema], str]:
        """
        Converts the raw extracted text + vision descriptions into structured Pydantic models.
        """
        print("Structuring content into JSON format with gpt-4o-mini...")
        
        # Format the image descriptions for the LLM
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
            "Include the correct answer key ('A', 'B', 'C', or 'D'), options dictionary, and detailed explanation.\n"
            "Ensure the output conforms exactly to the requested JSON structure."
        )

        user_content = (
            f"Here is the raw text extracted from the PDF:\n\n{raw_text}\n\n"
            f"Here are the descriptions of the extracted images:\n\n{image_desc_text}\n\n"
            f"Please structure this content into a list of questions using the required format."
        )

        try:
            # Use beta parsing API for guaranteed schema adherence
            response = self.client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format=ExtractedQuestionsResponse,
                timeout=120
            )
            parsed_questions = response.choices[0].message.parsed.questions
            raw_response = response.choices[0].message.content or ""
            return parsed_questions, raw_response
        except Exception as e:
            print(f"Error structuring content with LLM: {e}")
            raise e

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
            selected_subtopic = response.choices[0].message.content.strip()
            
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
        embedding_vector = get_embedding(text_to_embed, self.openai_api_key)

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
                difficulty=question_data.difficulty,
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

    def process_pdf(self, pdf_path: str, exam_type: Optional[str] = None, year: Optional[int] = None) -> List[uuid.UUID]:
        """
        Executes the full pipeline for a given PDF paper.
        """
        final_exam_type = exam_type or getattr(self, "exam_type", None)
        final_year = year or getattr(self, "year", None)
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
            # Override exam_type and year from arguments if not set
            q.exam_type = final_exam_type
            q.year = final_year
            
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
