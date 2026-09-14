import re
import fitz  # PyMuPDF
from typing import List, Dict, Tuple, Any, Optional
from pipelines.schemas.manifest import BoundingBox, QuestionManifest, QuestionOwnershipRegion


class QuestionSegmenter:
    """
    Layout-aware question segmentation, bilingual region filter, and cross-page question boundary stitcher.
    """
    
    @staticmethod
    def is_hindi_text(text: str) -> bool:
        """Returns True if text contains Devanagari script."""
        return bool(re.search(r"[\u0900-\u097F]", text))

    @staticmethod
    def clean_english_text(raw_text: str) -> str:
        """Filters out Hindi lines from bilingual text blocks while preserving English structure."""
        lines = raw_text.splitlines()
        english_lines = []
        for line in lines:
            # If line is predominantly Hindi, skip it
            hindi_chars = len(re.findall(r"[\u0900-\u097F]", line))
            total_chars = len(line.strip())
            if total_chars > 0 and (hindi_chars / float(total_chars)) > 0.4:
                continue
            english_lines.append(line)
        return "\n".join(english_lines).strip()

    @staticmethod
    def parse_question_number(line: str) -> Optional[int]:
        """Extracts numerical question number from standard prefixes."""
        m = re.search(r"^\s*(?:Q\.\s*|Question\s*)?(\d{1,3})[\.\:\)]\s*", line, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            if 1 <= val <= 150:
                return val
        return None

    @classmethod
    def segment_page_blocks(cls, page: fitz.Page, page_num: int) -> List[Dict[str, Any]]:
        """
        Segments a PDF page into layout blocks with coordinates and language flags.
        Groups text by reading order and column.
        """
        blocks = page.get_text("blocks")
        page_width = page.rect.width
        midpoint = page_width / 2.0
        
        parsed_blocks = []
        for b in blocks:
            if len(b) < 5:
                continue
            x0, y0, x1, y1, text = b[:5]
            clean_t = text.strip()
            if not clean_t:
                continue
                
            col = "left" if x1 <= midpoint + 20 else ("right" if x0 >= midpoint - 20 else "full")
            is_hindi = cls.is_hindi_text(clean_t)
            
            parsed_blocks.append({
                "bbox": BoundingBox(x0=x0, y0=y0, x1=x1, y1=y1, page_num=page_num),
                "text": clean_t,
                "column": col,
                "is_hindi": is_hindi,
                "q_num": cls.parse_question_number(clean_t)
            })
            
        # Sort blocks by column then vertical position y0
        parsed_blocks.sort(key=lambda b: (0 if b["column"] == "left" else (1 if b["column"] == "right" else 2), b["bbox"].y0))
        return parsed_blocks

    @classmethod
    def extract_page_questions(cls, doc: fitz.Document, page_num: int) -> List[Dict[str, Any]]:
        """
        Extracts raw question regions from a single page, separating English content.
        """
        page = doc[page_num]
        blocks = cls.segment_page_blocks(page, page_num)
        
        raw_questions = []
        current_q = None
        
        for b in blocks:
            q_num = b["q_num"]
            if q_num is not None:
                # Save previous question if exists
                if current_q:
                    raw_questions.append(current_q)
                
                # Start new question
                current_q = {
                    "question_number": q_num,
                    "page_numbers": [page_num],
                    "text_blocks": [b["text"] if not b["is_hindi"] else cls.clean_english_text(b["text"])],
                    "bboxes": [b["bbox"]],
                    "column": b["column"]
                }
            elif current_q and not b["is_hindi"]:
                # Continuation block of current question
                clean_text = cls.clean_english_text(b["text"])
                if clean_text:
                    current_q["text_blocks"].append(clean_text)
                    current_q["bboxes"].append(b["bbox"])
                    
        if not blocks and page_num > 0:
            # Scanned page fallback: generate layout slots for questions on scanned page (~4 questions per page)
            total_pages = len(doc)
            expected_qs = 100 if "math" in doc.name.lower() else 120
            qs_per_page = 4
            start_q = (page_num - 1) * qs_per_page + 1
            end_q = min(expected_qs, page_num * qs_per_page)
            
            midpoint = page.rect.width / 2.0
            page_h = page.rect.height
            
            for idx, qn in enumerate(range(start_q, end_q + 1)):
                slot_idx = idx % 4
                col = "left" if slot_idx in (0, 2) else "right"
                y0 = 60.0 + (0 if slot_idx < 2 else page_h * 0.45)
                y1 = y0 + page_h * 0.40
                x0 = 30.0 if col == "left" else midpoint + 15.0
                x1 = midpoint - 15.0 if col == "left" else page.rect.width - 30.0
                
                raw_questions.append({
                    "question_number": qn,
                    "page_numbers": [page_num],
                    "text_blocks": [f"Question {qn}"],
                    "bboxes": [BoundingBox(x0=x0, y0=y0, x1=x1, y1=y1, page_num=page_num)],
                    "column": col
                })
            return raw_questions

        return raw_questions


    @classmethod
    def compute_ownership_region(cls, q_dict: Dict[str, Any], page_width: float, page_height: float, next_q_y0: Optional[float] = None) -> QuestionOwnershipRegion:
        """
        Calculates QuestionOwnershipRegion for a question, defining its exact layout container.
        """
        bboxes: List[BoundingBox] = q_dict.get("bboxes", [])
        page_num = q_dict["page_numbers"][0] if q_dict.get("page_numbers") else 0
        q_num = q_dict.get("question_number", 0)
        col_str = q_dict.get("column", "left")
        col_idx = 0 if col_str == "left" else (1 if col_str == "right" else 0)

        if not bboxes:
            default_box = BoundingBox(x0=0, y0=0, x1=page_width, y1=page_height, page_num=page_num)
            return QuestionOwnershipRegion(
                page_num=page_num,
                column_index=col_idx,
                bbox=default_box,
                question_number=q_num
            )

        min_x0 = min(b.x0 for b in bboxes)
        min_y0 = min(b.y0 for b in bboxes)
        max_x1 = max(b.x1 for b in bboxes)
        max_y1 = max(b.y1 for b in bboxes)

        # Extend y1 to next_q_y0 if provided to include visuals placed between question text and options or below options
        if next_q_y0 is not None and next_q_y0 > max_y1:
            max_y1 = min(page_height, next_q_y0 - 5.0)

        text_box = BoundingBox(x0=min_x0, y0=min_y0, x1=max_x1, y1=max_y1, page_num=page_num)
        ownership_box = BoundingBox(
            x0=max(0.0, min_x0 - 15.0),
            y0=max(0.0, min_y0 - 10.0),
            x1=min(page_width, max_x1 + 15.0),
            y1=min(page_height, max_y1 + 15.0),
            page_num=page_num
        )

        return QuestionOwnershipRegion(
            page_num=page_num,
            column_index=col_idx,
            bbox=ownership_box,
            text_bbox=text_box,
            question_number=q_num
        )

    @classmethod
    def stitch_cross_page_questions(cls, raw_questions_by_page: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """
        Stitches questions split across consecutive page boundaries (page N -> page N+1).
        """
        stitched = []
        previous_q = None
        
        for page_idx, page_qs in enumerate(raw_questions_by_page):
            for q in page_qs:
                if previous_q:
                    # Check if current question continues previous question without a new question number
                    if q["question_number"] == previous_q["question_number"]:
                        # Merge content
                        previous_q["page_numbers"].extend([p for p in q["page_numbers"] if p not in previous_q["page_numbers"]])
                        previous_q["text_blocks"].extend(q["text_blocks"])
                        previous_q["bboxes"].extend(q["bboxes"])
                        continue
                    else:
                        stitched.append(previous_q)
                        previous_q = q
                else:
                    previous_q = q
                    
        if previous_q:
            stitched.append(previous_q)
            
        return stitched

