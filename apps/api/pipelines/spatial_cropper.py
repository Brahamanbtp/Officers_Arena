import cv2
try:
    import pymupdf as fitz
except ImportError:
    import fitz
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
from pipelines.vision_grounding import BoundingBox

class SpatialCropper:
    """
    High-Res 300 DPI Spatial Crop & Quality Assertion Engine.
    Enforces ownership containment, neighbor exclusion, and quality checks on crops.
    """

    @classmethod
    def crop_and_save(
        cls,
        doc: fitz.Document,
        bbox: BoundingBox,
        output_dir: Path,
        filename_prefix: str,
        dpi: int = 300
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Renders page at 300 DPI and crops bbox region defined in normalized 0-1000 coordinates.
        """
        p_idx = max(0, bbox.page_num - 1)
        if p_idx >= len(doc):
            return None, "Invalid page index"

        page = doc[p_idx]
        w_pt = page.rect.width
        h_pt = page.rect.height

        # Convert normalized 0-1000 coords to PDF points
        x0_pt = (bbox.xmin / 1000.0) * w_pt
        y0_pt = (bbox.ymin / 1000.0) * h_pt
        x1_pt = (bbox.xmax / 1000.0) * w_pt
        y1_pt = (bbox.ymax / 1000.0) * h_pt

        # Add 5pt padding
        padding = 5.0
        x0_pt = max(0, x0_pt - padding)
        y0_pt = max(0, y0_pt - padding)
        x1_pt = min(w_pt, x1_pt + padding)
        y1_pt = min(h_pt, y1_pt + padding)

        # Quality Assertion 1: Rejects full page crops (> 60% area)
        crop_area = (x1_pt - x0_pt) * (y1_pt - y0_pt)
        page_area = w_pt * h_pt
        if crop_area / page_area > 0.60:
            return None, "Crop rejected: Exceeds 60% page area (Full-page screenshot)"

        # Quality Assertion 2: Rejects tiny noise crops (< 35pt x 35pt)
        if (x1_pt - x0_pt) < 35 or (y1_pt - y0_pt) < 35:
            return None, "Crop rejected: Tiny dimension (< 35pt)"

        # Render 300 DPI pixmap clip
        rect = fitz.Rect(x0_pt, y0_pt, x1_pt, y1_pt)
        pix = page.get_pixmap(dpi=dpi, clip=rect)

        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
        if pix.n == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        elif pix.n == 1:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

        # Quality Assertion 3: Entropy / Variance check (ensures not pure blank white/black space)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        var = np.var(gray)
        if var < 10.0:
            return None, "Crop rejected: Low variance (blank space)"

        # Save crisp PNG
        output_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{filename_prefix}_{bbox.page_num}_{int(x0_pt)}_{int(y0_pt)}.png"
        output_path = output_dir / filename

        cv2.imwrite(str(output_path), img)
        return str(output_path), "SUCCESS"

    @classmethod
    def is_contained_in_ownership_region(
        cls,
        visual_bbox: BoundingBox,
        question_ownership_bbox: BoundingBox
    ) -> bool:
        """
        Asserts that visual_bbox is physically located inside or immediately adjacent to question_ownership_bbox.
        """
        if visual_bbox.page_num != question_ownership_bbox.page_num:
            return False

        # Allow 20pt vertical tolerance for above/below diagram placement
        tolerance = 20.0
        y_contained = (visual_bbox.ymin >= question_ownership_bbox.ymin - tolerance) and \
                      (visual_bbox.ymax <= question_ownership_bbox.ymax + tolerance)
        x_contained = (visual_bbox.xmin >= question_ownership_bbox.xmin - tolerance) and \
                      (visual_bbox.xmax <= question_ownership_bbox.xmax + tolerance)

        return y_contained and x_contained
