import os
import re
import hashlib
import fitz  # PyMuPDF
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
from datetime import datetime, timezone

from pipelines.schemas.manifest import PageAnalysis, PaperManifest

EXPECTED_QUESTION_COUNTS = {
    ("CDS", "Mathematics"): 100,
    ("CDS", "General Knowledge"): 120,
    ("CDS", "English"): 120,
    ("UPSC", "General Studies"): 100,
}

def compute_pdf_hash(pdf_path: str) -> str:
    """Computes SHA256 hash of PDF file."""
    hasher = hashlib.sha256()
    with open(pdf_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def parse_filename_metadata(pdf_path: str) -> Tuple[str, int, str, str]:
    """
    Extracts (exam_type, year, session, subject) from filename conventions:
    e.g. cds2009-1-maths.pdf -> ("CDS", 2009, "I", "Mathematics")
         CDS-I-26-ENGLISH.pdf -> ("CDS", 2026, "I", "English")
    """
    filename = Path(pdf_path).name.lower()
    
    exam_type = "CDS" if "cds" in filename else "UPSC"
    
    # Year extraction
    year_match = re.search(r"(?:20\d{2}|19\d{2})|\b(\d{2})\b", filename)
    year = 2026
    if year_match:
        val = year_match.group(0)
        if len(val) == 4:
            year = int(val)
        elif len(val) == 2 and val.isdigit():
            year = 2000 + int(val) if int(val) < 50 else 1900 + int(val)

    # Session extraction (1 vs 2 / I vs II)
    session = "I"
    if "-2-" in filename or "_2_" in filename or "session2" in filename or "cds-ii" in filename or "cds2" in filename:
        session = "II"
    elif "-1-" in filename or "_1_" in filename or "cds-i" in filename or "cds1" in filename:
        session = "I"
        
    # Subject extraction
    subject = "Mathematics"
    if "math" in filename:
        subject = "Mathematics"
    elif "gk" in filename or "general" in filename or "gs" in filename:
        subject = "General Knowledge"
    elif "eng" in filename:
        subject = "English"

    return exam_type, year, session, subject

def classify_page(page_num: int, total_pages: int, page_text: str) -> str:
    """Classifies a page type deterministically."""
    clean_text = page_text.lower()
    
    if page_num == 0 and ("do not open this test booklet" in clean_text or "time allowed" in clean_text or "serial no" in clean_text):
        return "cover_page"
    if "instructions" in clean_text and page_num < 2:
        return "instructions"
    if "rough work" in clean_text and len(clean_text) < 200:
        return "administrative"
    if "answer key" in clean_text or "cut-off" in clean_text:
        return "answer_key"
        
    # Check for question numbers on page
    q_matches = re.findall(r"(?:^|\n|\s)(\d{1,3})\.[\s\n]", page_text)
    if len(q_matches) >= 1:
        return "question_page"
        
    return "question_page" if page_num > 0 else "cover_page"

def detect_column_layout(page: fitz.Page) -> str:
    """Determines whether a page uses single-column or two-column layout."""
    blocks = page.get_text("blocks")
    page_width = page.rect.width
    midpoint = page_width / 2.0
    
    left_count = 0
    right_count = 0
    
    for b in blocks:
        # b = (x0, y0, x1, y1, text, block_no, block_type)
        if len(b) >= 4:
            x0, _, x1, _ = b[:4]
            # Ignore header/footer full width blocks
            if (x1 - x0) > 0.7 * page_width:
                continue
            if x1 < midpoint + 20:
                left_count += 1
            elif x0 > midpoint - 20:
                right_count += 1
                
    if left_count >= 2 and right_count >= 2:
        return "two_column"
    return "single_column"

def get_cache_dir(pdf_hash: str) -> Path:
    """Returns path to cache directory for a given PDF SHA256 hash."""
    base_dir = Path(__file__).resolve().parent.parent.parent / "data" / "processed" / "cache" / pdf_hash
    base_dir.mkdir(parents=True, exist_ok=True)
    (base_dir / "renders").mkdir(exist_ok=True)
    (base_dir / "ocr").mkdir(exist_ok=True)
    return base_dir

def render_page_to_cache(page: fitz.Page, pdf_hash: str, page_num: int, dpi: int = 200) -> str:
    """Renders PDF page to PNG cache file at specified DPI."""
    cache_dir = get_cache_dir(pdf_hash)
    out_path = cache_dir / "renders" / f"page_{page_num}_{dpi}dpi.png"
    if out_path.exists():
        return str(out_path)
    
    pix = page.get_pixmap(dpi=dpi)
    pix.save(str(out_path))
    return str(out_path)

def run_pdf_preflight(pdf_path: str) -> PaperManifest:
    """
    Executes deterministic PDF preflight inspection.
    Returns initialized PaperManifest with page layout analysis.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found at {pdf_path}")
        
    doc = fitz.open(pdf_path)
    pdf_hash = compute_pdf_hash(pdf_path)
    cache_dir = get_cache_dir(pdf_hash)
    
    exam_type, year, session, subject = parse_filename_metadata(pdf_path)
    expected_count = EXPECTED_QUESTION_COUNTS.get((exam_type, subject), 100)
    
    pages_analysis: List[PageAnalysis] = []
    total_detected_qs = set()
    
    for p_idx in range(len(doc)):
        page = doc[p_idx]
        p_text = page.get_text("text")
        
        # Cache render
        render_page_to_cache(page, pdf_hash, p_idx, dpi=200)
        
        p_type = classify_page(p_idx, len(doc), p_text)
        layout = detect_column_layout(page)
        is_bilingual = bool(re.search(r"[\u0900-\u097F]", p_text))
        
        # Detect question numbers on this page
        q_nums = [int(m) for m in re.findall(r"(?:^|\n|\s)(\d{1,3})\.[\s\n]", p_text) if 1 <= int(m) <= 150]
        total_detected_qs.update(q_nums)
        
        has_visuals = bool(len(page.get_images()) > 0 or re.search(r"figure|diagram|map|graph|triangle|circle|shaded", p_text, re.IGNORECASE))
        
        pages_analysis.append(PageAnalysis(
            page_num=p_idx,
            width=page.rect.width,
            height=page.rect.height,
            page_type=p_type,
            column_layout=layout,
            is_bilingual=is_bilingual,
            detected_question_numbers=q_nums,
            has_visuals=has_visuals
        ))
        
    doc.close()
    
    manifest = PaperManifest(
        source_pdf=Path(pdf_path).name,
        source_pdf_hash=pdf_hash,
        pipeline_version="2.0.0-question-centric",
        created_at=datetime.now(timezone.utc).isoformat(),
        exam_type=exam_type,
        year=year,
        session=session,
        subject=subject,
        total_pages=len(pages_analysis),
        expected_question_count=expected_count,
        detected_question_count=len(total_detected_qs),
        validated_question_count=0,
        pages=pages_analysis,
        questions=[],
        overall_status="PENDING"
    )
    
    return manifest

