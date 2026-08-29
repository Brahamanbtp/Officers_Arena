import sys
import os
from pathlib import Path

# Get the absolute path of the project root (officers-arena)
root_dir = Path(__file__).resolve().parent.parent
# Add the api folder to sys.path so we can import from 'app' and 'pipelines'
sys.path.append(str(root_dir / "apps" / "api"))

import uuid
import json
from PIL import Image, ImageDraw
import fitz  # PyMuPDF
from dotenv import load_dotenv

from app.models.database import Question, Syllabus, QuestionImage, Questions, QuestionImages  # type: ignore
from pipelines.ingestion_pipeline import QuestionExtractor  # type: ignore
from pipelines.vectorizer.embedder import DataEmbedder  # type: ignore
import pipelines.vectorizer.embedder  # type: ignore
import pipelines.ingestion_pipeline  # type: ignore
from app.schemas.question import QuestionCreate  # type: ignore

# 1. Image Generation Helper
def generate_test_images():
    """Generates two test images: a mock river map and a chemical structure."""
    os.makedirs(os.path.join("data", "test"), exist_ok=True)
    map_path = os.path.join("data", "test", "river_map.png")
    chem_path = os.path.join("data", "test", "methane_structure.png")

    # A. River Map Image
    img_map = Image.new("RGB", (400, 300), color=(220, 240, 220))
    draw_map = ImageDraw.Draw(img_map)
    # Draw wavy river
    draw_map.line([(50, 150), (150, 180), (250, 120), (350, 200)], fill=(0, 100, 255), width=6)
    draw_map.ellipse([(240, 110), (260, 130)], fill=(255, 0, 0))  # Marker point
    draw_map.text((10, 10), "Indian River System Map", fill=(0, 0, 0))
    draw_map.text((270, 115), "River A", fill=(255, 0, 0))
    img_map.save(map_path)

    # B. Methane Chemistry Structure Image
    img_chem = Image.new("RGB", (400, 300), color=(245, 245, 245))
    draw_chem = ImageDraw.Draw(img_chem)
    # Draw bonds (lines)
    draw_chem.line([(200, 150), (200, 70)], fill=(50, 50, 50), width=4)
    draw_chem.line([(200, 150), (200, 230)], fill=(50, 50, 50), width=4)
    draw_chem.line([(200, 150), (120, 150)], fill=(50, 50, 50), width=4)
    draw_chem.line([(200, 150), (280, 150)], fill=(50, 50, 50), width=4)
    # Draw central Carbon (C)
    draw_chem.ellipse([(180, 130), (220, 170)], fill=(255, 255, 255), outline=(50, 50, 50), width=2)
    draw_chem.text((195, 142), "C", fill=(0, 0, 0))
    # Draw Hydrogens (H)
    draw_chem.text((195, 50), "H", fill=(0, 0, 0))
    draw_chem.text((195, 240), "H", fill=(0, 0, 0))
    draw_chem.text((100, 142), "H", fill=(0, 0, 0))
    draw_chem.text((290, 142), "H", fill=(0, 0, 0))
    img_chem.save(chem_path)

    return map_path, chem_path

# 2. PDF Generation Helper
def create_test_pdf(pdf_path, map_img, chem_img):
    """Creates a 2-page test PDF with the two questions and images."""
    print("Generating simulated PDF...")
    doc = fitz.open()

    # Page 1: Indian River Map Question (Geography)
    page1 = doc.new_page(width=595, height=842)
    page1.insert_text((50, 50), "OFFICERS ARENA INGESTION PIPELINE TEST PAPER - GEOGRAPHY", fontsize=14, color=(0, 0, 0))
    page1.insert_text((50, 100), "Question 1: Study the map below and answer the following question.", fontsize=11)
    # Insert River Map image
    rect_map = fitz.Rect(50, 120, 450, 420)
    page1.insert_image(rect_map, filename=map_img)
    page1.insert_text((50, 455), "Which of the following major rivers of India is labeled as 'River A'?", fontsize=11)
    page1.insert_text((50, 475), "Options:", fontsize=11)
    page1.insert_text((55, 495), "A) Yamuna\nB) Ganges\nC) Godavari\nD) Narmada", fontsize=11)

    # Page 2: Organic Chemistry Question (Science)
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text((50, 50), "OFFICERS ARENA INGESTION PIPELINE TEST PAPER - SCIENCE", fontsize=14, color=(0, 0, 0))
    page2.insert_text((50, 100), "Question 2: Organic Chemistry Structure Analysis.", fontsize=11)
    # Insert Chemistry image
    rect_chem = fitz.Rect(50, 120, 450, 420)
    page2.insert_image(rect_chem, filename=chem_img)
    page2.insert_text((50, 455), "Methane (CH4) is the simplest hydrocarbon. Consider the following statements regarding Methane:", fontsize=11)
    page2.insert_text((50, 475), "1. The carbon atom undergoes sp3 hybridisation.", fontsize=11)
    page2.insert_text((50, 495), "2. The shape of the molecule is tetrahedral.", fontsize=11)
    page2.insert_text((50, 520), "Which of the statements given above is/are correct?", fontsize=11)
    page2.insert_text((50, 540), "Options:", fontsize=11)
    page2.insert_text((55, 560), "A) 1 only\nB) 2 only\nC) Both 1 and 2\nD) Neither 1 nor 2", fontsize=11)

    doc.save(pdf_path)
    doc.close()
    print(f"Simulated PDF saved to: {pdf_path}")

# 3. OpenAI Mock Client Definition for self-contained execution
class MockChatCompletions:
    def create(self, *args, **kwargs):
        messages = kwargs.get("messages", [])
        
        # Check if this is a syllabus classification call
        is_syllabus_call = False
        for msg in messages:
            if msg.get("role") == "system" and "syllabus classifier" in msg.get("content", "").lower():
                is_syllabus_call = True
                
        if is_syllabus_call:
            # Determine topic
            user_msg = messages[1]["content"] if len(messages) > 1 else ""
            question_part = user_msg.split("Subtopics List:")[0].lower()
            if "map" in question_part or "river" in question_part:
                content_desc = "Mapping of Indian Rivers and Lakes"
            else:
                content_desc = "Carbon and its Compounds (Hydrocarbons, Functional Groups)"
        else:
            # Detect if it's asking for river map description or chemistry structure description
            is_chem = False
            if messages:
                content = messages[0]["content"]
                if isinstance(content, list):
                    for part in content:
                        if part.get("type") == "text" and "chemical" in part.get("text", "").lower():
                            is_chem = True

            if is_chem:
                content_desc = "A molecular structure diagram representing Methane ($CH_4$), with a central Carbon (C) atom bonded to four surrounding Hydrogen (H) atoms, demonstrating a tetrahedral geometry and $sp^3$ hybridisation."
            else:
                content_desc = "A map representing the drainage basin of the Ganges river, with location A marking the Yamuna river confluence at Prayagraj."

        return type('obj', (object,), {
            'choices': [
                type('choice', (object,), {
                    'message': type('msg', (object,), {
                        'content': content_desc
                    })
                })
            ]
        })

    def parse(self, *args, **kwargs):
        from app.schemas.question import ExtractedQuestionsResponse, QuestionIngestSchema  # type: ignore
        
        # Locate image references dynamically
        raw_text = kwargs.get("messages", [{}])[1].get("content", "")
        # Find UUIDs in the text like [IMAGE_REF:uuid]
        import re
        uuids = re.findall(r"\[IMAGE_REF:([a-f0-9\-]+)\]", raw_text)
        
        uuid_map = uuids[0] if len(uuids) > 0 else "placeholder-map-uuid"
        uuid_chem = uuids[1] if len(uuids) > 1 else "placeholder-chem-uuid"

        q1 = QuestionIngestSchema(
            text=f"Study the map below and answer the following question.\n[IMAGE_REF:{uuid_map}]\nWhich of the following major rivers of India is labeled as 'River A'?",
            options={"A": "Yamuna", "B": "Ganges", "C": "Godavari", "D": "Narmada"},
            correct_answer="A",
            explanation="River A corresponds to the Yamuna, which merges with the Ganges at Prayagraj.",
            year=2026,
            difficulty="Medium",
            cognitive_level="Understanding",
            exam_type="UPSC",
            image_refs=[uuid_map]
        )
        
        q2 = QuestionIngestSchema(
            text=f"Organic Chemistry Structure Analysis.\n[IMAGE_REF:{uuid_chem}]\nMethane ($CH_4$) is the simplest hydrocarbon. Consider the following statements regarding Methane:\n1. The carbon atom undergoes $sp^3$ hybridisation.\n2. The shape of the molecule is tetrahedral.\nWhich of the statements given above is/are correct?",
            options={"A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2"},
            correct_answer="C",
            explanation="Methane ($CH_4$) has a tetrahedral shape with bond angles of $109.5^\\circ$. The central carbon is $sp^3$ hybridised.",
            year=2026,
            difficulty="Easy",
            cognitive_level="Remembering",
            exam_type="UPSC",
            image_refs=[uuid_chem]
        )

        return type('obj', (object,), {
            'choices': [
                type('choice', (object,), {
                    'message': type('msg', (object,), {
                        'parsed': ExtractedQuestionsResponse(questions=[q1, q2]),
                        'content': '{"questions": [{"text": "mock_question_1"}, {"text": "mock_question_2"}]}'
                    })
                })
            ]
        })

class MockOpenAIClient:
    def __init__(self, api_key=None):
        self.chat = type('chat', (object,), {
            'completions': MockChatCompletions()
        })
        self.beta = type('beta', (object,), {
            'chat': type('chat', (object,), {
                'completions': MockChatCompletions()
            })
        })
        self.embeddings = type('embeddings', (object,), {
            'create': lambda *args, **kwargs: type('obj', (object,), {
                'data': [type('data_item', (object,), {'embedding': [0.01] * 1536})]
            })
        })

# 4. Main Test Execution
def main():
    load_dotenv()
    
    # Setup test file directories
    pdf_path = os.path.join("data", "test", "test_paper.pdf")
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)

    # A. Generate mock river map and chemistry images
    map_img, chem_img = generate_test_images()

    # B. Generate the PDF
    create_test_pdf(pdf_path, map_img, chem_img)

    # C. Database Connection setup
    # If DATABASE_URL is not set, default to a local SQLite file for testing
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in environment. Falling back to local SQLite test database.")
        db_url = "sqlite:///data/test_officers_arena.db"
        
    print(f"Connecting to database: {db_url}")

    # D. Retrieve or mock OpenAI API Key
    api_key = os.getenv("OPENAI_API_KEY")
    use_mock_openai = False
    if not api_key or api_key == "your_api_key_here":
        print("OPENAI_API_KEY is not set or placeholder. Running in Mock OpenAI mode.")
        api_key = "mock-key"
        use_mock_openai = True
        # Override embedding function to return a dummy vector
        pipelines.vectorizer.embedder.get_embedding = lambda text, key: [0.01] * 1536
        pipelines.ingestion_pipeline.get_embedding = lambda text, key: [0.01] * 1536

    # E. Initialize Pipeline Extractor
    extractor = QuestionExtractor(
        db_url=db_url,
        openai_api_key=api_key,
        syllabus_path=os.path.join("data", "syllabus", "upsc_cds_hierarchy.json"),
        image_output_dir=os.path.join("data", "processed", "images")
    )

    if use_mock_openai:
        # Swap standard OpenAI client for Mock Client
        extractor.client = MockOpenAIClient()

    # F. Run Table Migrations (create tables)
    from sqlmodel import SQLModel
    print("Initializing Database tables (Syllabus, Questions, QuestionImages)...")
    SQLModel.metadata.create_all(extractor.engine)

    # G. Run Ingestion Pipeline
    print("\n--- STARTING INGESTION PIPELINE RUN ---")
    upserted_ids = extractor.process_pdf(pdf_path, exam_type="UPSC", year=2026)
    print("--- INGESTION PIPELINE RUN FINISHED ---\n")

    # H. Print DB Confirmation and Results
    print(f"Ingested {len(upserted_ids)} questions successfully.")
    
    from sqlmodel import Session, select
    with Session(extractor.engine) as session:
        # Retrieve all ingested questions
        questions = session.exec(select(Questions)).all()
        print("\n--- DATABASE VERIFICATION ---")
        for q in questions:
            print(f"\n[Question ID]: {q.id}")
            print(f"[Exam Type]: {q.exam_type} | [Year]: {q.year}")
            print(f"[Text]:\n{q.text}")
            print(f"[Options]: {json.dumps(q.options)}")
            print(f"[Correct Answer]: {q.correct_answer}")
            print(f"[Explanation]: {q.explanation}")
            print(f"[Mapped Subtopic ID]: {q.subtopic_id}")
            if q.subtopic:
                print(f"[Mapped Subtopic Name]: {q.subtopic.name} (Level: {q.subtopic.level})")
            print(f"[Is Verified]: {q.is_verified}")
            print(f"[Language Type]: {q.language_type}")
            print(f"[Raw LLM Response]: {q.raw_llm_response}")
            
            # Print associated images
            images = session.exec(select(QuestionImages).where(QuestionImages.question_id == q.id)).all()
            for img in images:
                print(f"  -> [Image ID]: {img.id}")
                print(f"      [File Path]: {img.file_path}")
                print(f"      [Description]: {img.description}")
            
            # Print embedding vector length
            if q.embedding:
                print(f"[Embedding Dimensions]: {len(q.embedding)}")

    # Clean up test files
    if os.path.exists(map_img):
        os.remove(map_img)
    if os.path.exists(chem_img):
        os.remove(chem_img)
    if os.path.exists(pdf_path):
        os.remove(pdf_path)

if __name__ == "__main__":
    main()
