import re
try:
    import pymupdf as fitz
except ImportError:
    import fitz
from typing import Dict, Any, Tuple

class PDFInspectorResult:
    def __init__(self, has_usable_text: bool, text_by_page: Dict[int, str], metrics: Dict[str, Any]):
        self.has_usable_text = has_usable_text
        self.text_by_page = text_by_page
        self.metrics = metrics

class PDFInspector:
    """
    Inspects PDF pages using PyMuPDF to detect whether the PDF contains 
    high-quality digital text layers (avoiding unnecessary OCR).
    """

    MIN_CHARS_PER_PAGE = 150
    MIN_PRINTABLE_RATIO = 0.75
    MIN_QUESTION_MATCHES = 2

    @classmethod
    def inspect_pdf(cls, pdf_path: str) -> PDFInspectorResult:
        doc = fitz.open(pdf_path)
        text_by_page = {}
        total_chars = 0
        total_printable = 0
        question_matches = 0
        option_matches = 0
        usable_pages = 0

        question_regex = re.compile(r"(\b\d{1,3}\s*[\.\)]|\bQ(?:uestion)?\s*\d{1,3}\b)", re.IGNORECASE)
        option_regex = re.compile(r"(\([a-d]\)|[a-d]\s*[\.\)]|\b[A-D]\s*[\.\)])", re.IGNORECASE)

        for page_num in range(1, len(doc) + 1):
            page = doc[page_num - 1]
            raw_text: str = str(page.get_text("text") or "")
            text_by_page[page_num] = raw_text

            char_len = len(raw_text.strip())
            total_chars += char_len

            if char_len >= cls.MIN_CHARS_PER_PAGE:
                usable_pages += 1

            printable_count = sum(1 for c in raw_text if c.isalnum() or c.isspace() or c in ".,()-+$=/\\")
            total_printable += printable_count

            if question_regex.search(raw_text):
                question_matches += 1
            if option_regex.search(raw_text):
                option_matches += 1

        doc.close()

        total_pages = len(text_by_page)
        avg_chars = total_chars / max(1, total_pages)
        printable_ratio = total_printable / max(1, total_chars)

        # Decision rule for usable digital text
        has_usable_text = (
            usable_pages >= (total_pages * 0.6) and
            avg_chars >= cls.MIN_CHARS_PER_PAGE and
            printable_ratio >= cls.MIN_PRINTABLE_RATIO and
            (question_matches >= cls.MIN_QUESTION_MATCHES or option_matches >= cls.MIN_QUESTION_MATCHES)
        )

        metrics = {
            "total_pages": total_pages,
            "usable_pages": usable_pages,
            "avg_chars_per_page": avg_chars,
            "printable_ratio": printable_ratio,
            "question_matches": question_matches,
            "option_matches": option_matches
        }

        return PDFInspectorResult(has_usable_text, text_by_page, metrics)
