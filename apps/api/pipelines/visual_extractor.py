import os
import re
try:
    import pymupdf as fitz
except ImportError:
    import fitz
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from pipelines.schemas.manifest import BoundingBox, FigureManifest, QuestionManifest

class VisualExtractor:
    """
    Precision figure region detector, figure-to-question associator, and high-res PDF crop generator.
    Implements mandatory Full-Page Screenshot Rejection.
    """

    VISUAL_TRIGGERS = [
        r"\bfigure\b", r"\bfigures\b", r"\bdiagram\b", r"\bdiagrams\b", r"\bmap\b", r"\bmaps\b", r"\bgraph\b", r"\bgraphs\b", r"\bchart\b", r"\bcharts\b", r"\bcircuit\b",
        r"shown in the", r"given below", r"following triangle", r"following circle",
        r"shaded region", r"tree diagram", r"chemical structure", r"exhibit"
    ]

    @classmethod
    def contains_visual_reference(cls, text: str) -> bool:
        """Determines if question text explicitly references a visual figure or diagram."""
        if not text:
            return False
        
        # Exclude general geometry property questions asking about shapes (e.g., "Which one of the following figures...")
        if re.search(r"which (?:one )?of the (?:following )?figures", text, re.IGNORECASE):
            return False
        if re.search(r"line[s]? of symmetry", text, re.IGNORECASE):
            return False

        # Exclude pure text tables like List-I / List-II matching unless explicit figure term present
        if "list-i" in text.lower() and "list-ii" in text.lower() and not re.search(r"map|figure|diagram|shown|triangle|circle", text, re.IGNORECASE):
            return False
        pattern = "|".join(cls.VISUAL_TRIGGERS)
        return bool(re.search(pattern, text, re.IGNORECASE))

    @classmethod
    def find_figure_bounding_box(
        cls,
        page: fitz.Page,
        q_num: int,
        q_text: str,
        column: str = "single"
    ) -> Optional[BoundingBox]:
        """
        Locates the exact bounding box of the visual figure for a question on a PDF page.
        Uses visual drawings/vector objects + raster image XREFs + spatial text proximity.
        """
        page_rect = page.rect
        page_width = page_rect.width
        page_height = page_rect.height
        midpoint = page_width / 2.0
        
        # 1. Search for embedded raster images or vector graphics drawings
        drawings = page.get_drawings()
        raster_images = page.get_images(full=True)
        
        # Find text blocks for this specific question number to get spatial anchor
        text_page = page.get_text("blocks")
        found_anchor_y0: Optional[float] = None
        found_anchor_y1: Optional[float] = None
        
        for b in text_page:
            if len(b) >= 5:
                t_str = str(b[4]).strip()
                if re.search(rf"(?:^|\n|\s){q_num}\.[\s\n]", t_str) or re.search(rf"Q\.?\s*{q_num}\b", t_str):
                    found_anchor_y0 = float(b[1])
                    found_anchor_y1 = float(b[3])
                    break

        if found_anchor_y0 is None or found_anchor_y1 is None:
            # Estimate vertical slot anchor on page (e.g., 4 questions per page slot)
            slot_idx = (q_num - 1) % 4
            slot_h = (page_height - 120.0) / 4.0
            anchor_y0 = 60.0 + slot_idx * slot_h
            anchor_y1 = anchor_y0 + (slot_h * 0.35)
        else:
            anchor_y0 = found_anchor_y0
            anchor_y1 = found_anchor_y1

        # Define vertical search window around question anchor
        search_min_y = max(0.0, anchor_y0 - 10.0)
        search_max_y = min(page_height, anchor_y1 + 160.0)

        
        # Determine horizontal column boundary
        if column == "left":
            x_min, x_max = 0, midpoint + 15
        elif column == "right":
            x_min, x_max = midpoint - 15, page_width
        else:
            x_min, x_max = 0, page_width

        fig_x0, fig_y0, fig_x1, fig_y1 = page_width, page_height, 0, 0
        found_elements = False

        # Check drawings (vector diagrams/curves/lines common in math/geometry questions)
        for d in drawings:
            r = d.get("rect")
            if r:
                # Filter out full page borders or thin column divider lines
                if r.width > 0.85 * page_width or r.height > 0.85 * page_height:
                    continue
                if r.width < 10 or r.height < 10:
                    continue
                
                # Check spatial overlap with search window
                if search_min_y <= r.y0 <= search_max_y and x_min <= r.x0 <= x_max:
                    fig_x0 = min(fig_x0, r.x0)
                    fig_y0 = min(fig_y0, r.y0)
                    fig_x1 = max(fig_x1, r.x1)
                    fig_y1 = max(fig_y1, r.y1)
                    found_elements = True

        # Check raster images
        for img in raster_images:
            xref = img[0]
            try:
                rects = page.get_image_rects(xref)
                for r in rects:
                    if r.width > 0.70 * page_width or r.height > 0.70 * page_height:
                        continue
                    if r.width < 10 or r.height < 10:
                        continue
                    if search_min_y <= r.y0 <= search_max_y and x_min <= r.x0 <= x_max:
                        fig_x0 = min(fig_x0, r.x0)
                        fig_y0 = min(fig_y0, r.y0)
                        fig_x1 = max(fig_x1, r.x1)
                        fig_y1 = max(fig_y1, r.y1)
                        found_elements = True
            except Exception:
                pass

        # For scanned PDFs where PyMuPDF drawings/xrefs are empty, use OpenCV layout analysis
        if not found_elements:
            try:
                import cv2
                import numpy as np

                pix = page.get_pixmap(dpi=150)
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
                if pix.n == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                h_img, w_img = gray.shape
                scale_y = h_img / page_height
                scale_x = w_img / page_width

                _, thresh = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                cv_boxes = []
                for c in contours:
                    x, y, bw, bh = cv2.boundingRect(c)
                    if bw > 0.80 * w_img or bh > 0.80 * h_img:
                        continue
                    if bw < 45 or bh < 45:
                        continue
                    
                    roi = thresh[y:y+bh, x:x+bw]
                    edges = cv2.Canny(roi, 50, 150)
                    edge_density = np.sum(edges > 0) / (bw * bh)
                    
                    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=20, minLineLength=15, maxLineGap=5)
                    non_ortho_lines = 0
                    if lines is not None:
                        for l in lines.reshape(-1, 4):
                            x1, y1, x2, y2 = int(l[0]), int(l[1]), int(l[2]), int(l[3])
                            angle = abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
                            if 10 < angle < 80 or 100 < angle < 170:
                                non_ortho_lines += 1
                    
                    circles = cv2.HoughCircles(gray[y:y+bh, x:x+bw], cv2.HOUGH_GRADIENT, 1, 20, param1=50, param2=30, minRadius=10, maxRadius=150)
                    has_circles = circles is not None
                    
                    # Require genuine diagram elements (diagonal lines/geometry or circles)
                    # Exclude pure text blocks which have only orthogonal text lines
                    if non_ortho_lines >= 2 or has_circles:
                        pt_x0 = max(0, (x / scale_x) - 10)
                        pt_y0 = max(0, (y / scale_y) - 10)
                        pt_x1 = min(page_width, ((x + bw) / scale_x) + 10)
                        pt_y1 = min(page_height, ((y + bh) / scale_y) + 10)
                        
                        # Check vertical overlap with search window
                        if search_min_y <= pt_y0 <= search_max_y or search_min_y <= pt_y1 <= search_max_y or (pt_y0 <= search_min_y and pt_y1 >= search_max_y):
                            cv_boxes.append((pt_x0, pt_y0, pt_x1, pt_y1))

                if cv_boxes:
                    # Pick box closest to question anchor
                    cv_boxes.sort(key=lambda b: abs(b[1] - anchor_y0))
                    fig_x0, fig_y0, fig_x1, fig_y1 = cv_boxes[0]
                    found_elements = True
            except Exception as e:
                pass

        if not found_elements:
            return None



        # For English left-column diagrams, expand left boundary to x0 = 12.0pt to preserve far-left vertex labels (e.g. vertex A)
        # And trim bottom boundary to fig_y1 - 12.0pt to strip bottom Hindi caption line ("... चित्र में")
        if fig_x0 < midpoint:
            final_x0 = max(12.0, fig_x0 - 55.0)
            final_x1 = min(midpoint - 10.0, fig_x1 + 25.0)
        else:
            final_x0 = max(midpoint + 10.0, fig_x0 - 25.0)
            final_x1 = min(page_width - 12.0, fig_x1 + 25.0)

        final_y0 = max(0.0, fig_y0 - 5.0)
        # Clip bottom edge precisely to strip Hindi text line below diagram baseline
        final_y1 = max(final_y0 + 50.0, fig_y1 - 12.0)

        p_num_int = int(page.number) if page.number is not None else 0
        bbox = BoundingBox(
            x0=final_x0,
            y0=final_y0,
            x1=final_x1,
            y1=final_y1,
            page_num=p_num_int + 1
        )
        return bbox


    @classmethod
    def validate_crop_quality(cls, page: fitz.Page, bbox: BoundingBox) -> Tuple[bool, str]:
        """
        FULL-PAGE SCREENSHOT REJECTION SAFEGUARD.
        Rejects crops that equal full pages, contain multiple unrelated questions, or capture Hindi blocks.
        """
        page_area = page.rect.width * page.rect.height
        crop_area = bbox.area()
        
        # Rule 1: Crop area cannot exceed 60% of total page area
        if (crop_area / page_area) > 0.60:
            return False, f"REJECTED: Crop area ({crop_area:.0f}) exceeds 60% of page area ({page_area:.0f}). Full page screenshots are forbidden."

        # Rule 2: Crop area cannot be tiny (< 400 sq points)
        if crop_area < 400:
            return False, f"REJECTED: Crop area ({crop_area:.0f}) is too small."

        # Rule 3: Check crop text content for multiple question numbers
        crop_rect = fitz.Rect(bbox.x0, bbox.y0, bbox.x1, bbox.y1)
        crop_text = str(page.get_text("text", clip=crop_rect))
        q_numbers_in_crop = re.findall(r"(?:^|\n|\s)(\d{1,3})\.[\s\n]", crop_text)
        
        if len(set(q_numbers_in_crop)) > 1:
            return False, f"REJECTED: Crop contains multiple distinct question numbers: {set(q_numbers_in_crop)}"

        # Rule 4: Check if crop is predominantly Hindi text
        crop_text_clean = crop_text.strip()
        hindi_chars = len(re.findall(r"[\u0900-\u097F]", crop_text))
        if len(crop_text_clean) > 0 and (hindi_chars / float(len(crop_text_clean))) > 0.4:
            return False, "REJECTED: Crop contains predominant Hindi translation text instead of English visual exhibit."

        return True, "OK"

    @classmethod
    def crop_and_save_figure(
        cls,
        doc: fitz.Document,
        bbox: BoundingBox,
        output_dir: str,
        filename_prefix: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Renders high-resolution (200 DPI) PDF crop and saves PNG file.
        Returns (crop_file_path, quality_status).
        """
        page = doc[bbox.page_num]
        
        # Run Full-Page Rejection Quality Check
        is_valid, msg = cls.validate_crop_quality(page, bbox)
        if not is_valid:
            print(f" [Visual Quality Gate] {msg}")
            return None, msg

        os.makedirs(output_dir, exist_ok=True)
        crop_filename = f"{filename_prefix}_{bbox.page_num+1}_{int(bbox.x0)}_{int(bbox.y0)}.png"
        crop_path = os.path.join(output_dir, crop_filename)

        # High resolution render (200 DPI -> zoom = 200/72 = ~2.77)
        zoom = 200 / 72.0
        mat = fitz.Matrix(zoom, zoom)
        crop_rect = fitz.Rect(bbox.x0, bbox.y0, bbox.x1, bbox.y1)
        
        pix = page.get_pixmap(matrix=mat, clip=crop_rect)
        pix.save(crop_path)

        return crop_path, "OK"
