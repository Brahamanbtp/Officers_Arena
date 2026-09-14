import re

class MathSanitizer:
    """
    Production Math & TeX Sanitizer.
    Converts raw TeX symbols and expressions extracted from PDFs into perfectly 
    formatted Markdown/KaTeX strings (using $ ... $ inline delimiters).
    """

    TEX_KEYWORDS = [
        "\\angle", "\\degree", "\\frac", "\\sqrt", "\\parallel", "\\theta", "\\pi",
        "\\cdot", "\\Delta", "\\circ", "\\triangle", "\\overline", "\\perp",
        "\\alpha", "\\beta", "\\gamma", "\\lambda", "\\mu", "\\sigma", "\\omega",
        "\\sin", "\\cos", "\\tan", "\\cot", "\\sec", "\\cosec", "\\log", "\\infty",
        "\\pm", "\\leq", "\\geq", "\\neq", "\\approx", "\\text"
    ]

    @classmethod
    def repair_formfeed_and_fractions(cls, s: str) -> str:
        if not s:
            return ""

        # 1. Repair control character and escape artifacts (MUST have backslash or control char)
        s = re.sub(r"(\\?[\x09\t]|\\+\s*)(?=ext\{|ext\b)", r"\\t", s)
        s = re.sub(r"(\\?[\x09\t]|\\+\s*)(?=heta\b)", r"\\t", s)
        s = re.sub(r"(\\?[\x09\t]|\\+\s*)(?=an\b)", r"\\t", s)
        s = re.sub(r"(\\?[\x09\t]|\\+\s*)(?=riangle\b)", r"\\t", s)
        s = re.sub(r"(\\?[\x09\t]|\\+\s*)(?=imes\b)", r"\\t", s)
        s = re.sub(r"(\\?[\x09\t]|\\+\s*)(?=au\b)", r"\\t", s)

        s = re.sub(r"\\+\s*ext\{", r"\\text{", s)
        s = re.sub(r"\\+\s*ext\b", r"\\text", s)
        s = re.sub(r"\\+\s*heta\b", r"\\theta", s)
        s = re.sub(r"\\+\s*an\b", r"\\tan", s)
        s = re.sub(r"\\+\s*riangle\b", r"\\triangle", s)
        s = re.sub(r"\\+\s*imes\b", r"\\times", s)
        s = re.sub(r"\\+\s*au\b", r"\\tau", s)

        # Carriage return (\x0d / \r) artifacts
        s = re.sub(r"\\+\s*ight\b", r"\\right", s)
        s = re.sub(r"\\+\s*ho\b", r"\\rho", s)

        # FormFeed (\x0c / \f) artifacts
        s = re.sub(r"\\+\s*rac(?=\{|\b)", r"\\frac", s)
        s = re.sub(r"\\f\\frac", r"\\frac", s)

        # Backspace (\x08 / \b) artifacts: \beta -> \x08eta
        s = re.sub(r"[\x08]eta\b", r"\\beta", s)
        s = re.sub(r"\\+\s*egin\b", r"\\begin", s)

        # Bell (\x07 / \a) artifacts
        s = re.sub(r"\\+\s*lpha\b", r"\\alpha", s)
        s = re.sub(r"\\+\s*ngle\b", r"\\angle", s)

        # Remove raw control bytes
        s = s.replace("\x09", " ").replace("\x0c", "").replace("\x0d", "").replace("\x08", "").replace("\x07", "")

        # 2. Repair mangled English words
        s = re.sub(r"\bW\s+or\s+d\b", "Word", s)
        s = re.sub(r"\bw\s+or\s+d\b", "word", s)
        s = re.sub(r"\bch\s+or\s+d\b", "chord", s)
        s = re.sub(r"\bf\s+or\s+m\b", "form", s)
        s = re.sub(r"\bst\s+or\s+m\b", "storm", s)
        s = re.sub(r"\bsnowst\s+or\s+m\b", "snowstorm", s)
        s = re.sub(r"\bthunderst\s+or\s+m\b", "thunderstorm", s)
        s = re.sub(r"\bm\s+or\s+e\b", "more", s)
        s = re.sub(r"\bbef\s+or\s+e\b", "before", s)
        s = re.sub(r"\bst\s+or\s+e\b", "store", s)
        s = re.sub(r"\bimpor\s*(\\?\s*\$\\?tance\$|\\?\s*tance)\b", "importance", s)
        s = re.sub(r"\bimpor\s*(\\?\s*\$\\?tant\$|\\?\s*tant)\b", "important", s)
        s = re.sub(r"\brec\s*(\\?\s*\$\\?tangular\$|\\?\s*tangular)\b", "rectangular", s)
        s = re.sub(r"\brec\s*(\\?\s*\$\\?tangle\$|\\?\s*tangle)\b", "rectangle", s)
        s = re.sub(r"\bdis\s*(\\?\s*\$\\?tances\$|\\?\s*tances)\b", "distances", s)
        s = re.sub(r"\bdis\s*(\\?\s*\$\\?tance\$|\\?\s*tance)\b", "distance", s)
        s = re.sub(r"\binter\s*(\\?\s*\$\\?section\$|\\?\s*section)\b", "intersection", s)
        s = re.sub(r"\binter\s*(\\?\s*\$\\?sects\$|\\?\s*sects)\b", "intersects", s)
        s = re.sub(r"\binter\s*(\\?\s*\$\\?sect\$|\\?\s*sect)\b", "intersect", s)
        s = re.sub(r"\bunders\s*(\\?\s*\$\\?tanding\$|\\?\s*tanding)\b", "understanding", s)
        s = re.sub(r"\bunders\s*(\\?\s*\$\\?tand\$|\\?\s*tand)\b", "understand", s)
        s = re.sub(r"\bu\s*(\\?\s*\$\\?sing\$|\\?\s*sing)\b", "using", s)
        s = re.sub(r"\btraver\s*(\\?\s*\$\\?sing\$|\\?\s*sing)\b", "traversing", s)
        s = re.sub(r"\$\s*\\text\{ends\}\s*\$", "extends", s)
        s = re.sub(r"\bextm\b", "m", s)
        s = re.sub(r"\bextcm\b", "cm", s)

        # 3. Repair unescaped frac/sqrt expressions (User Image 1 & 3 problems)
        s = re.sub(r"(?<!\\)\bfrac\s*1?\s*sqrt\s*(\d+)\s*([\+\-])\s*sqrt\s*(\d+)", r"\\frac{1}{\\sqrt{\1} \2 \\sqrt{\3}}", s)
        s = re.sub(r"(?<!\\)\bsqrt\s*(\d+)", r"\\sqrt{\1}", s)
        s = re.sub(r"(?<!\\)\bfrac\b", r"\\frac", s)

        # Fix \text units and spacing: e.g. 25\ text{ m} -> 25 \text{m}, 25\ ext{ m} -> 25 \text{m}
        s = re.sub(r"(\\text\{|\b)(\d+)\s*\\?\s*text\{\s*([a-zA-Z]+)\s*\}", r"\2 \\text{\3}", s)
        s = re.sub(r"(\d+)\s*\\?\s*ext\{\s*([a-zA-Z]+)\s*\}", r"\1 \\text{\2}", s)
        s = re.sub(r"\\?\s*text\{\s*m\s*\}", r"\\text{m}", s)
        s = re.sub(r"\\?\s*text\{\s*cm\s*\}", r"\\text{cm}", s)
        s = re.sub(r"\\?\s*text\{\s*km/hr\s*\}", r"\\text{km/hr}", s)
        s = re.sub(r"\\?\s*text\{\s*seconds\s*\}", r"\\text{seconds}", s)

        # Repair OCR mangled fractions: e.g. \frac2GD3 -> \frac{2 GD}{3}, \frac2AG3 -> \frac{2 AG}{3}
        s = re.sub(r"\\frac\s*(\d+)\s*([A-Za-z]+)\s*(\d+)", r"\\frac{\1 \2}{\3}", s)
        s = re.sub(r"\\frac\s*(\d+)\s*(\d+)", r"\\frac{\1}{\2}", s)

        # Fix OCR 'andy' / 'and' / 'or' concatenation
        s = re.sub(r"([a-zA-Z0-9\.]+)\s*and([a-zA-Z])\b", r"\1 and \2", s)
        s = re.sub(r"([a-zA-Z0-9\.]+)\s*or([a-zA-Z])\b", r"\1 or \2", s)

        # Degree & circ fixes: ^{circ} or ^circ -> ^{\circ}
        s = re.sub(r"\^\{?circ\}?", r"^{\\circ}", s)
        s = re.sub(r"(\d+)\s*\\?circ\b", r"\1^{\\circ}", s)

        # Fix coso / cos o -> \cos 0
        s = re.sub(r"\\?cos\s*o\b", r"\\cos 0", s, flags=re.IGNORECASE)

        # Trig function backslashes & spacing
        s = re.sub(r"([a-zA-Z0-9])\\?(sin|cos|tan|cot|sec|cosec|log)", r"\1 \\\2", s)
        s = re.sub(r"\\(sin|cos|tan|cot|sec|cosec|log)(\d+)", r"\\\1 \2", s)

        # Fix unprintable encoding errors like cm² or m²
        s = re.sub(r"(\d+)\s*cm\ufffd", r"\1 cm²", s)
        s = re.sub(r"(\d+)\s*m\ufffd", r"\1 m²", s)

        # Clean double backslashes
        s = re.sub(r"\\\s*\\", r"\\", s)
        s = re.sub(r"\\ext\b", r"\\text", s)
        s = re.sub(r"\\text\{\s*", r"\\text{", s)

        return s

    @classmethod
    def sanitize_single_val(cls, val: str) -> str:
        """Sanitizes a single option choice or math value, preserving clean TeX formatting."""
        if not val:
            return ""

        s = val.strip() if isinstance(val, str) else str(val).strip()
        s = cls.repair_formfeed_and_fractions(s)

        # If option is wrapped in dollars like "$x = 3.2 and y = 2.3$" or "$Talcher (Odisha)$", clean delimiters
        if s.startswith("$") and s.endswith("$") and s.count("$") == 2:
            inner = s[1:-1].strip()
            # If inner is plain text with no math operators/keywords, strip dollars
            if re.match(r"^[A-Za-z0-9\s\-\(\),]+$", inner) and not any(k in inner for k in cls.TEX_KEYWORDS):
                return inner
            # Split ' and ' or ' or ' inside dollars so text is outside math mode
            if " and " in inner:
                parts = inner.split(" and ")
                return " and ".join(f"${p.strip()}$" for p in parts if p.strip())
            elif " or " in inner:
                parts = inner.split(" or ")
                return " or ".join(f"${p.strip()}$" for p in parts if p.strip())

        # If string is wrapped in $ ... $ but has NO TeX symbols, strip $ wrapping
        if s.startswith("$") and s.endswith("$") and s.count("$") == 2:
            inner = s[1:-1].strip()
            if not any(ch in inner for ch in ["\\", "^", "_", "{", "}"]):
                return inner

        # If already has balanced $ delimiters, return normalized string
        if s.count("$") >= 2 and s.count("$") % 2 == 0:
            s = s.replace("\\\\", "\\")
            return s

        # Check if text contains genuine TeX keywords or math operators
        has_tex = any(k in s for k in cls.TEX_KEYWORDS) or bool(re.search(r"[\^_\=\+\/]", s))
        has_algebra = bool(re.search(r"\b[a-zA-Z]\b\s*[\+\-\*\/]\s*\b[a-zA-Z0-9]\b", s)) or bool(re.search(r"\([a-zA-Z0-9\s\+\-\*\/]+\)", s))

        if (has_tex or has_algebra) and not s.startswith("$"):
            s = f"${s}$"

        s = s.replace("\\\\", "\\")
        return s

    @classmethod
    def sanitize(cls, text: str) -> str:
        if not text:
            return ""

        text = cls.repair_formfeed_and_fractions(text)

        # Normalize escaped dollars
        text = text.replace("\\$", "$")

        # Fix OCR spacing errors
        text = re.sub(r"(\\angle|\\triangle|\\overline)([A-Z]{2,4})", r"\1 \2", text)
        text = re.sub(r"(\d+)\s*\^\s*\\circ", r"\1^{\\circ}", text)

        # Process text outside dollars to wrap loose TeX keywords safely
        parts = text.split("$")
        out_parts = []

        for idx, part in enumerate(parts):
            if idx % 2 == 1:
                # Inside $ ... $ - keep math intact, repair internal artifacts
                out_parts.append(cls.repair_formfeed_and_fractions(part))
            else:
                # Outside $ ... $ - repair artifacts and wrap explicit TeX formulas in dollars
                repaired_part = cls.repair_formfeed_and_fractions(part)

                # Wrap angle expressions: \angle BAX = 70^{\circ} -> $\angle BAX = 70^{\circ}$
                repaired_part = re.sub(
                    r"(\\angle\s+[A-Za-z0-9_]+(?:\s*=\s*[0-9]+(?:\^\{\\circ\}|\^\\circ)?)?)",
                    r"$\1$",
                    repaired_part
                )

                # Wrap fractions and formulas: \frac{x}{y} + \frac{1}{2} -> $\frac{x}{y} + \frac{1}{2}$
                repaired_part = re.sub(
                    r"(\\frac\{[^{}]+\}\{[^{}]+\}(?:\s*[\+\-\*\/]\s*\\frac\{[^{}]+\}\{[^{}]+\})*)",
                    r"$\1$",
                    repaired_part
                )

                # Wrap isolated degree expressions: 70^{\circ} -> $70^{\circ}$
                repaired_part = re.sub(
                    r"(?<!\$)(?<!\\angle\s)(\b\d+\^\{\\circ\})(?!\$)",
                    r"$\1$",
                    repaired_part
                )

                out_parts.append(repaired_part)

        res = "$".join(out_parts)
        # Clean double dollar wrappers and empty math blocks
        res = re.sub(r"\$\$\s*\$", "$$", res)
        res = re.sub(r"\$\s*\$\$", "$$", res)
        res = re.sub(r"\$\s*\$", " ", res)
        return res


    @classmethod
    def sanitize_options(cls, options: dict) -> dict:
        """Sanitizes all option choices (A, B, C, D) in a dictionary."""
        if not options or not isinstance(options, dict):
            return {}

        sanitized_opts = {}
        for opt_key, opt_val in options.items():
            sanitized_opts[opt_key] = cls.sanitize_single_val(opt_val)
        return sanitized_opts




