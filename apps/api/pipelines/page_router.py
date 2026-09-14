import re
import fitz  # PyMuPDF
from typing import Dict, Any, List, Optional, Tuple
from pipelines.document_representation import PageIR, BlockIR, LineIR, BoundingBox

class PageAnalysisResult:
    def __init__(
        self,
        page_number: int,
        page_type: str,
        has_native_text: bool,
        text_quality: float,
        image_quality: float,
        rotation: int,
        needs_ocr: bool,
        blocks: Optional[List[BlockIR]] = None,
        raw_text: str = ""
    ):
        self.page_number = page_number
        self.page_type = page_type
        self.has_native_text = has_native_text
        self.text_quality = text_quality
        self.image_quality = image_quality
        self.rotation = rotation
        self.needs_ocr = needs_ocr
        self.blocks = blocks or []
        self.raw_text = raw_text

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "page_type": self.page_type,
            "has_native_text": self.has_native_text,
            "text_quality": round(self.text_quality, 2),
            "image_quality": round(self.image_quality, 2),
            "rotation": self.rotation,
            "needs_ocr": self.needs_ocr
        }


class PageRouter:
    """
    Analyzes PDF pages individually to route them intelligently:
    - High-quality digital text -> Native PyMuPDF block extraction (bypasses OCR for speed)
    - Scanned / image / low-quality text -> Adaptive preprocessing + Local OCR
    """

    MIN_CHARS_FOR_DIGITAL = 80
    MIN_PRINTABLE_RATIO = 0.70

    Q_ANCHOR_REGEX = re.compile(r"(?:\b\d{1,3}\s*[\.\)]|\bQ(?:uestion)?\s*[\.\:]?\s*\d{1,3}\b)", re.IGNORECASE)
    OPT_ANCHOR_REGEX = re.compile(r"(\([a-dA-D]\)|\[[a-dA-D]\]|\b[a-dA-D]\s*[\.\)])")

    @classmethod
    def analyze_page(cls, page: fitz.Page, page_number: int) -> PageAnalysisResult:
        """
        Analyzes a single PyMuPDF page object and returns detailed PageAnalysisResult.
        """
        page_rect = page.rect
        width = page_rect.width
        height = page_rect.height
        rotation = page.rotation

        # Extract text blocks with PyMuPDF
        raw_text_blocks = page.get_text("blocks")
        full_text = ""
        blocks_ir: List[BlockIR] = []
        total_chars = 0
        total_printable = 0

        for b_idx, b in enumerate(raw_text_blocks):
            if len(b) < 5:
                continue
            x0, y0, x1, y1, text = b[:5]
            clean_t = text.strip()
            if not clean_t:
                continue

            full_text += clean_t + "\n"
            char_count = len(clean_t)
            total_chars += char_count

            printable_count = sum(1 for c in clean_t if c.isalnum() or c.isspace() or c in ".,()-+$=/\\%:;\"'[]{}<>_")
            total_printable += printable_count

            midpoint = width / 2.0
            col_idx = 0 if x1 <= midpoint + 25 else (1 if x0 >= midpoint - 25 else 0)

            blocks_ir.append(
                BlockIR(
                    id=f"p{page_number}_b{b_idx}",
                    type="text",
                    text=clean_t,
                    raw_text=text,
                    bbox=BoundingBox(x0=x0, y0=y0, x1=x1, y1=y1, page_num=page_number),
                    confidence=1.0,
                    reading_order=b_idx,
                    column_idx=col_idx
                )
            )

        printable_ratio = (total_printable / max(1, total_chars)) if total_chars > 0 else 0.0

        # Assess question structure matches
        q_matches = len(cls.Q_ANCHOR_REGEX.findall(full_text))
        opt_matches = len(cls.OPT_ANCHOR_REGEX.findall(full_text))

        # Check for raster images on page
        images = page.get_images()
        has_images = len(images) > 0

        # Calculate text quality score (0.0 to 1.0)
        length_score = min(1.0, total_chars / 400.0)
        structure_score = min(1.0, (q_matches + opt_matches) / 4.0)
        text_quality = (length_score * 0.4) + (printable_ratio * 0.3) + (structure_score * 0.3)

        # Determine Page Type and OCR routing decision
        has_native = (total_chars >= 25) and (printable_ratio >= cls.MIN_PRINTABLE_RATIO)

        if has_native:
            page_type = "DIGITAL_HIGH_QUALITY" if not has_images else "MIXED"
            needs_ocr = False
        else:
            page_type = "SCANNED_IMAGE"
            needs_ocr = True


        return PageAnalysisResult(
            page_number=page_number,
            page_type=page_type,
            has_native_text=has_native,
            text_quality=text_quality,
            image_quality=0.9 if has_images else 1.0,
            rotation=rotation,
            needs_ocr=needs_ocr,
            blocks=blocks_ir if not needs_ocr else [],
            raw_text=full_text
        )

    @classmethod
    def create_page_ir(cls, page: fitz.Page, page_number: int) -> PageIR:
        """Helper to create PageIR directly from a PDF page."""
        analysis = cls.analyze_page(page, page_number)
        return PageIR(
            page_number=page_number,
            width=page.rect.width,
            height=page.rect.height,
            page_type=analysis.page_type,
            has_native_text=analysis.has_native_text,
            text_quality=analysis.text_quality,
            image_quality=analysis.image_quality,
            rotation=analysis.rotation,
            needs_ocr=analysis.needs_ocr,
            blocks=analysis.blocks,
            raw_ocr_text=analysis.raw_text if not analysis.needs_ocr else None,
            ocr_provider="pymupdf_native" if not analysis.needs_ocr else None
        )
