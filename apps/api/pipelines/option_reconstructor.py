import re
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field
from pipelines.document_representation import BoundingBox
from pipelines.math_sanitizer import MathSanitizer

class ReconstructedOption(BaseModel):
    label: str  # "A", "B", "C", "D"
    text: str   # Clean sanitized content
    raw_text: str  # Original matched string
    content_type: str = "TEXT"  # "NUMERIC", "MATHEMATICAL", "STATEMENT", "TEXT", "MIXED"
    bbox: Optional[BoundingBox] = None
    confidence: float = 1.0
    source_page: int = 1


class OptionReconstructor:
    """
    Dedicated layout-aware Option Reconstruction Engine.
    Guarantees strict separation of option markers (e.g. (a), (b)) from option content.
    Handles single-line, multi-line, multi-column, numeric, math, and statement options.
    """

    # Matches standalone option markers at start of lines or within single-line clusters
    # Examples: (a), (A), [a], [A], a., A., 1), (1)
    OPT_TOKEN_SPLIT_REGEX = re.compile(
        r"(?:(?<=\s)|(?<=^))"
        r"(?:\((?P<p_label>[a-dA-D1-4])\)|\[(?P<b_label>[a-dA-D1-4])\]|(?P<d_label>[a-dA-D1-4])\s*[\.\:\)])\s*",
        re.MULTILINE
    )

    LABEL_NORM_MAP = {
        "a": "A", "b": "B", "c": "C", "d": "D",
        "A": "A", "B": "B", "C": "C", "D": "D",
        "1": "A", "2": "B", "3": "C", "4": "D"
    }

    @classmethod
    def classify_content_type(cls, text: str) -> str:
        """Determines the semantic content type of an option string."""
        if not text:
            return "UNKNOWN"
        t = text.strip()

        # Pure numeric / numeric with units (e.g. "25", "25 km/h", "50%", "3.14")
        if re.match(r"^[\+\-]?\d+(?:\.\d+)?(?:\s*(?:km/h|km/hr|m|cm|mm|kg|g|sec|seconds|hours|%|°|years?))?$", t, re.IGNORECASE):
            return "NUMERIC"

        # Mathematical expression
        if any(k in t for k in ["\\frac", "\\sqrt", "^", "_", "\\pm", "\\theta", "\\pi", "\\Delta", "\\angle", "\\sin", "\\cos", "\\tan", "="]):
            return "MATHEMATICAL"

        # Statements (e.g. "1 only", "Both 1 and 2", "Neither 1 nor 2")
        if re.search(r"\b(?:only|both|neither|and|nor|statement|statements)\b", t, re.IGNORECASE):
            return "STATEMENT"

        if re.search(r"\d", t) and re.search(r"[a-zA-Z]", t):
            return "MIXED"

        return "TEXT"

    @classmethod
    def extract_inline_options(cls, text: str) -> Dict[str, str]:
        """
        Extracts options from text where multiple options may reside on the same line.
        e.g. "(a) 25   (b) 50   (c) 75   (d) 100"
        """
        matches = list(cls.OPT_TOKEN_SPLIT_REGEX.finditer(text))
        if not matches:
            return {}

        results: Dict[str, str] = {}
        for i, match in enumerate(matches):
            raw_lbl = match.group("p_label") or match.group("b_label") or match.group("d_label")
            norm_lbl = cls.LABEL_NORM_MAP.get(raw_lbl, raw_lbl.upper())

            start_idx = match.end()
            end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            content = text[start_idx:end_idx].strip()

            # Clean trailing punctuation / noise
            content = re.sub(r"[\s\n\r]+", " ", content).strip()

            # CRITICAL SAFEGUARD: Do not allow content to be just the label itself
            if content.lower() == raw_lbl.lower():
                continue

            results[norm_lbl] = content

        return results

    @classmethod
    def reconstruct_options(
        cls,
        candidate_lines: List[str],
        page_num: int = 1,
        source_bboxes: Optional[List[BoundingBox]] = None
    ) -> Tuple[Dict[str, str], List[ReconstructedOption], float]:
        """
        Reconstructs options A, B, C, D from candidate text lines.
        Returns:
            (options_dict, reconstructed_list, confidence_score)
        """
        combined_text = "\n".join(candidate_lines)

        # First attempt: check for inline option tokens
        inline_extracted = cls.extract_inline_options(combined_text)

        # Line-by-line state machine parser for multiline options
        options_map: Dict[str, str] = {}
        active_label: Optional[str] = None
        active_lines: List[str] = []

        lines = [ln.strip() for ln in combined_text.splitlines() if ln.strip()]

        for line in lines:
            # Check if line starts with an option token
            match = cls.OPT_TOKEN_SPLIT_REGEX.match(line)
            if match:
                # If we had an active option, finalize it
                if active_label and active_lines:
                    options_map[active_label] = " ".join(active_lines).strip()
                    active_lines = []

                raw_lbl = match.group("p_label") or match.group("b_label") or match.group("d_label")
                norm_lbl = cls.LABEL_NORM_MAP.get(raw_lbl, raw_lbl.upper())
                active_label = norm_lbl

                # Check if this line also contains multiple options
                sub_opts = cls.extract_inline_options(line)
                if len(sub_opts) > 1:
                    for k, v in sub_opts.items():
                        options_map[k] = v
                    active_label = None
                    active_lines = []
                    continue

                content_rest = line[match.end():].strip()
                if content_rest:
                    active_lines.append(content_rest)
            elif active_label:
                # Continuation line for the active multiline option
                active_lines.append(line)

        # Finalize last option
        if active_label and active_lines:
            options_map[active_label] = " ".join(active_lines).strip()

        # Merge with inline extracted if any option was missed
        for k, v in inline_extracted.items():
            if k not in options_map or len(options_map[k]) < len(v):
                options_map[k] = v

        # Build clean ReconstructedOption models and sanitize math
        reconstructed: List[ReconstructedOption] = []
        final_dict: Dict[str, str] = {}
        scores: List[float] = []

        for expected_lbl in ["A", "B", "C", "D"]:
            raw_val = options_map.get(expected_lbl, "").strip()
            
            # Remove any accidentally included label from the value
            # e.g. "a) 25" -> "25"
            cleaned_val = re.sub(r"^\s*[\(\[]?[a-dA-D1-4][\)\]\.\:]\s*", "", raw_val).strip()

            # Sanitize KaTeX math
            sanitized_val = MathSanitizer.sanitize_single_val(cleaned_val) if cleaned_val else ""

            # Classify content type
            c_type = cls.classify_content_type(sanitized_val)

            # Strict correctness check: option content must not equal option label or placeholder
            is_valid_val = bool(sanitized_val) and sanitized_val.upper() != expected_lbl and not sanitized_val.startswith(f"Option {expected_lbl}")
            conf = 1.0 if is_valid_val else (0.4 if sanitized_val else 0.0)
            scores.append(conf)

            if is_valid_val:
                final_dict[expected_lbl] = sanitized_val
            elif sanitized_val:
                final_dict[expected_lbl] = sanitized_val  # Keep best effort
            else:
                final_dict[expected_lbl] = ""

            reconstructed.append(
                ReconstructedOption(
                    label=expected_lbl,
                    text=final_dict[expected_lbl],
                    raw_text=raw_val,
                    content_type=c_type,
                    confidence=conf,
                    source_page=page_num
                )
            )

        overall_conf = sum(scores) / 4.0 if scores else 0.0
        return final_dict, reconstructed, overall_conf
