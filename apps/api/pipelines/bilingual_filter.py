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

    OPTION_LINE_REGEX = re.compile(r"^\s*(?:\([a-dA-D1-4]\)|\[[a-dA-D1-4]\]|[a-dA-D1-4]\s*[\.\:\)])")

    @classmethod
    def strip_hindi(cls, text: str) -> str:
        if not text:
            return ""

        # Split into lines and filter out lines dominated by Hindi script
        lines = text.split("\n")
        english_lines = []

        for line in lines:
            stripped_line = line.strip()
            if not stripped_line:
                continue

            hindi_chars = len(cls.DEVANAGARI_REGEX.findall(line))
            
            # If line is an option or contains mathematical symbols, NEVER discard it completely
            is_option_or_math = bool(cls.OPTION_LINE_REGEX.match(stripped_line)) or any(c in stripped_line for c in ["=", "\\", "$", "^", "_", "+", "-", "(a)", "(b)", "(c)", "(d)"])
            
            if hindi_chars > 0 and not is_option_or_math:
                # If line is purely or overwhelmingly Hindi, skip it
                latin_chars = len(re.findall(r"[a-zA-Z]", stripped_line))
                if latin_chars == 0 or (hindi_chars / max(1, len(stripped_line)) > 0.5 and latin_chars < 5):
                    continue
            
            # Remove any stray Hindi characters within the line while preserving English/math
            cleaned = cls.DEVANAGARI_REGEX.sub("", line).strip()
            # Clean up residual artifacts
            cleaned = re.sub(r"[\s\t]+", " ", cleaned).strip()
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
