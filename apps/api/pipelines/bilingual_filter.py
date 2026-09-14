import re

class BilingualFilter:
    """
    Bilingual Script & Region Filter.
    Strips Devanagari (Hindi) script ranges (\u0900-\u097F) from extracted English questions
    and determines whether a PDF spatial region belongs to a Hindi column.
    """

    DEVANAGARI_REGEX = re.compile(r"[\u0900-\u097F]+")

    @classmethod
    def contains_hindi(cls, text: str) -> bool:
        if not text:
            return False
        return bool(cls.DEVANAGARI_REGEX.search(text))

    @classmethod
    def strip_hindi(cls, text: str) -> str:
        if not text:
            return ""

        # Split into lines and filter out lines dominated by Hindi script
        lines = text.split("\n")
        english_lines = []

        for line in lines:
            hindi_chars = len(cls.DEVANAGARI_REGEX.findall(line))
            # If line is mostly Hindi text, skip it
            if hindi_chars > 0 and (len(line.strip()) < 15 or hindi_chars / max(1, len(line.strip())) > 0.3):
                continue
            
            # Remove any stray Hindi characters within an English line
            cleaned = cls.DEVANAGARI_REGEX.sub("", line).strip()
            if cleaned:
                english_lines.append(cleaned)

        return "\n".join(english_lines)

    @classmethod
    def is_hindi_region(cls, page_rect_width: float, x0: float, x1: float, text_content: str) -> bool:
        """
        Determines if a bounding box region belongs to the Hindi section of a two-column PDF page.
        In UPSC/CDS papers, left column is typically English and right column is Hindi (or vice-versa).
        """
        if cls.contains_hindi(text_content):
            return True

        # In standard two-column UPSC papers (width ~ 595pt), x0 > 300pt is usually right column
        center_x = (x0 + x1) / 2.0
        if center_x > 0.55 * page_rect_width and cls.contains_hindi(text_content):
            return True

        return False
