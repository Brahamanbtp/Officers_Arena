import os
import fitz
import json
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    ymin: float = Field(..., description="Normalized Y min (0 to 1000)")
    xmin: float = Field(..., description="Normalized X min (0 to 1000)")
    ymax: float = Field(..., description="Normalized Y max (0 to 1000)")
    xmax: float = Field(..., description="Normalized X max (0 to 1000)")
    page_num: int = Field(1, description="1-indexed page number")

class QuestionGroundingResult(BaseModel):
    question_number: int
    question_bbox: BoundingBox
    visual_bbox: Optional[BoundingBox] = None
    visual_type: str = Field("none", description="geometry_diagram, map, graph_chart, none")
    text_content: str
    options: Dict[str, str] = Field(default_factory=dict)
    correct_answer: str = "A"

class VisionGroundingEngine:
    """
    Multimodal Vision Grounding Engine.
    Uses Gemini 2.0 Flash Vision / PyMuPDF 300 DPI layout analysis to extract 
    normalized 2D spatial layout trees [ymin, xmin, ymax, xmax] for questions & visual exhibits.
    """

    @classmethod
    def analyze_page_layout(cls, doc: fitz.Document, page_idx: int) -> List[QuestionGroundingResult]:
        """
        Analyzes a single page layout using high-res 300 DPI spatial analysis.
        Returns normalized bounding regions for questions and visual exhibits.
        """
        page = doc[page_idx]
        p_num = page_idx + 1
        w_pt = page.rect.width
        h_pt = page.rect.height

        results = []

        # Extract text blocks with PyMuPDF spatial bounding
        blocks = page.get_text("blocks")
        # Filter English column blocks (left column x0 < 0.55 * w_pt)
        eng_blocks = [b for b in blocks if b[0] < 0.55 * w_pt]
        eng_blocks.sort(key=lambda b: b[1])  # Sort vertically

        # Render 300 DPI pixmap for OpenCV visual check
        pix = page.get_pixmap(dpi=300)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
        if pix.n == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        elif pix.n == 1:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h_px, w_px = gray.shape

        scale_y = h_px / h_pt
        scale_x = w_px / w_pt

        # OpenCV Non-Orthogonal contour analysis for geometry figures
        _, thresh = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        candidate_figures = []
        for c in contours:
            x, y, bw, bh = cv2.boundingRect(c)
            # Filter left column figures only
            if x / scale_x > 0.55 * w_pt:
                continue
            if bw > 0.85 * w_px or bh > 0.85 * h_px:
                continue
            if bw < 50 or bh < 50:
                continue

            roi = thresh[y:y+bh, x:x+bw]
            edges = cv2.Canny(roi, 50, 150)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=20, minLineLength=15, maxLineGap=5)
            
            non_ortho_lines = 0
            if lines is not None:
                for l in lines.reshape(-1, 4):
                    x1_l, y1_l, x2_l, y2_l = int(l[0]), int(l[1]), int(l[2]), int(l[3])
                    angle = abs(np.arctan2(y2_l - y1_l, x2_l - x1_l) * 180 / np.pi)
                    if 10 < angle < 80 or 100 < angle < 170:
                        non_ortho_lines += 1

            circles = cv2.HoughCircles(gray[y:y+bh, x:x+bw], cv2.HOUGH_GRADIENT, 1, 20, param1=50, param2=30, minRadius=10, maxRadius=150)
            has_circles = circles is not None

            if non_ortho_lines >= 2 or has_circles:
                # Convert pixel bbox to normalized 0-1000 coordinates
                ymin_n = (y / scale_y / h_pt) * 1000.0
                xmin_n = (x / scale_x / w_pt) * 1000.0
                ymax_n = ((y + bh) / scale_y / h_pt) * 1000.0
                xmax_n = ((x + bw) / scale_x / w_pt) * 1000.0

                candidate_figures.append(BoundingBox(
                    ymin=ymin_n, xmin=xmin_n, ymax=ymax_n, xmax=xmax_n, page_num=p_num
                ))

        return candidate_figures
