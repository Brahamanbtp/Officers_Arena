import os
import sys
import re
import json
import traceback
from datetime import datetime, timezone
from pathlib import Path
from tqdm import tqdm

# Ensure apps/api and scripts are in the search path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir / "apps" / "api"))
sys.path.append(str(root_dir / "scripts"))

from pipelines.ingestion_pipeline import QuestionExtractor

def parse_filename_metadata(file_path: Path):
    """
    Parses metadata from raw paper filenames.
    Pattern Examples: 
      CDS-I-26-ENGLISH.pdf -> exam_type="CDS", year=2026, subject="English"
      UPSC_CDS_2023_General_Ability.pdf -> exam_type="CDS", year=2023, subject="General Ability"
    """
    base_name = file_path.stem
    
    # 1. Extract year (4-digit like 2026 or 2-digit like -26-)
    year = None
    year_match_4 = re.search(r'\b(19\d\d|20\d\d)\b', base_name)
    if year_match_4:
        year = int(year_match_4.group(1))
    else:
        year_match_2 = re.search(r'[-_]([0-9]{2})[-_]', base_name)
        if year_match_2:
            yr_num = int(year_match_2.group(1))
            year = 2000 + yr_num if yr_num < 50 else 1900 + yr_num

    if not year:
        year = 2026 # Default fallback year
        
    # 2. Extract exam type
    exam_type = "CDS" if "CDS" in str(file_path).upper() else "UPSC"
            
    # 3. Extract subject
    base_upper = base_name.upper()
    if "ENGLISH" in base_upper:
        subject = "English"
    elif "MATH" in base_upper:
        subject = "Elementary Mathematics"
    elif "GK" in base_upper or "GENERAL" in base_upper:
        subject = "General Knowledge"
    else:
        subject = "General Studies"
        
    return exam_type, year, subject

def main():
    # Setup Directories
    raw_papers_dir = root_dir / "data" / "raw_papers"
    processed_dir = root_dir / "data" / "processed"
    logs_dir = root_dir / "logs"
    
    os.makedirs(str(processed_dir), exist_ok=True)
    os.makedirs(str(logs_dir), exist_ok=True)
    
    checkpoint_file = processed_dir / "ingestion_log.json"
    error_log_file = logs_dir / "ingestion_errors.log"
    
    # Load Ingestion Checkpoint
    checkpoint = {"files_processed": {}}
    if checkpoint_file.exists():
        try:
            with open(checkpoint_file, "r", encoding="utf-8") as f:
                checkpoint = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load checkpoint file, starting fresh. Error: {e}")
            
    # Database URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        db_url = "sqlite:///data/test_officers_arena.db"
        print(f"DATABASE_URL not set. Falling back to local SQLite: {db_url}")
        
    # OpenAI API Key
    openai_key = os.getenv("OPENAI_API_KEY")
    use_mock_openai = False
    if not openai_key or openai_key == "<your-openai-api-key>" or openai_key == "mock_key":
        print("OPENAI_API_KEY not set or placeholder. Running ingestion in Mock/Offline mode.")
        openai_key = "mock_key"
        use_mock_openai = True
        
        # Override embedding function for mock mode
        import pipelines.vectorizer.embedder
        import pipelines.ingestion_pipeline
        pipelines.vectorizer.embedder.get_embedding = lambda text, api_key="", model="text-embedding-3-small": [0.01] * 1536
        pipelines.ingestion_pipeline.get_embedding = lambda text, api_key="", model="text-embedding-3-small": [0.01] * 1536
        
    # Discover PDFs recursively
    pdf_files = list(raw_papers_dir.rglob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files discovered in {raw_papers_dir}")
        return
        
    print(f"Discovered {len(pdf_files)} PDF files to process.")
    
    # Filter files that are already successfully processed
    files_to_process = [
        f for f in pdf_files 
        if str(f.relative_to(root_dir)) not in checkpoint["files_processed"] 
        or checkpoint["files_processed"][str(f.relative_to(root_dir))].get("status") != "success"
    ]
    
    print(f"{len(files_to_process)} files need processing (excluding already processed files).")
    
    # Run through the files with progress tracking
    for pdf_path in tqdm(files_to_process, desc="Batch Ingesting Papers", unit="file"):
        relative_path_str = str(pdf_path.relative_to(root_dir))
        
        # Extract filename metadata
        exam_type, year, subject = parse_filename_metadata(pdf_path)
        
        print(f"\nProcessing File: {relative_path_str}")
        print(f"Metadata -> Exam: {exam_type} | Year: {year} | Subject: {subject}")
        
        # Initialize Extractor with metadata context overrides
        try:
            extractor = QuestionExtractor(
                db_url=db_url,
                openai_api_key=openai_key,
                exam_type=exam_type,
                year=year,
                subject=subject
            )
            
            if use_mock_openai:
                from test_ingestion import MockOpenAIClient
                extractor.client = MockOpenAIClient()
            
            # Execute Ingestion
            upserted_ids = extractor.process_pdf(str(pdf_path))
            
            # Update Checkpoint
            checkpoint["files_processed"][relative_path_str] = {
                "status": "success",
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "upserted_count": len(upserted_ids),
                "metadata": {
                    "exam_type": exam_type,
                    "year": year,
                    "subject": subject
                }
            }
            
            # Save Checkpoint
            with open(checkpoint_file, "w", encoding="utf-8") as f:
                json.dump(checkpoint, f, indent=2)
                
            print(f"Successfully processed {relative_path_str} (Ingested {len(upserted_ids)} questions).")
            
        except Exception as e:
            error_msg = f"[{datetime.now(timezone.utc).isoformat()}] ERROR processing {relative_path_str}: {str(e)}\n{traceback.format_exc()}\n"
            print(f"Error processing {relative_path_str}. Checked logs/ingestion_errors.log.")
            
            # Log error
            with open(error_log_file, "a", encoding="utf-8") as f_err:
                f_err.write(error_msg + "\n" + "="*80 + "\n")
                
            # Update Checkpoint with failure status
            checkpoint["files_processed"][relative_path_str] = {
                "status": "failed",
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }
            with open(checkpoint_file, "w", encoding="utf-8") as f:
                json.dump(checkpoint, f, indent=2)

if __name__ == "__main__":
    main()
