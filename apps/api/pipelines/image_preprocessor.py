import io
from typing import Optional, Tuple
from PIL import Image

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None

class ImagePreprocessor:
    """
    Adaptive OpenCV Image Preprocessing for Scanned Exam Papers.
    Only applies transforms when required; preserves original image bytes.
    """

    @classmethod
    def estimate_skew_angle(cls, image_np: "np.ndarray") -> float:
        """Estimates skew angle in degrees using Hough transform / minAreaRect."""
        if cv2 is None or np is None:
            return 0.0

        try:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY) if len(image_np.shape) == 3 else image_np
            # Detect edges
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=100, maxLineGap=10)
            if lines is None:
                return 0.0

            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if x2 - x1 == 0:
                    continue
                angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                if abs(angle) < 45.0:  # Only consider slight skews
                    angles.append(angle)

            if not angles:
                return 0.0

            median_angle = float(np.median(angles))
            return median_angle if abs(median_angle) > 0.5 else 0.0
        except Exception:
            return 0.0

    @classmethod
    def deskew(cls, image_np: "np.ndarray", angle: float) -> "np.ndarray":
        """Rotates image to correct skew."""
        if cv2 is None or np is None or abs(angle) < 0.5:
            return image_np

        h, w = image_np.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image_np, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
        )
        return rotated

    @classmethod
    def enhance_contrast_and_binarize(cls, image_np: "np.ndarray") -> "np.ndarray":
        """Applies CLAHE contrast enhancement and Otsu binarization for degraded scans."""
        if cv2 is None or np is None:
            return image_np

        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY) if len(image_np.shape) == 3 else image_np

        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrast_enhanced = clahe.apply(gray)

        # Gentle Gaussian Blur before Otsu threshold
        blurred = cv2.GaussianBlur(contrast_enhanced, (3, 3), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        return thresh

    @classmethod
    def process_for_ocr(cls, img_bytes: bytes, adaptive: bool = True) -> bytes:
        """
        Adaptively preprocesses image bytes for OCR.
        If adaptive=True and image has acceptable contrast and no skew, returns original bytes.
        """
        if cv2 is None or np is None:
            return img_bytes

        try:
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return img_bytes

            # Check skew
            skew_angle = cls.estimate_skew_angle(img)
            needs_deskew = abs(skew_angle) > 0.75

            # Check brightness/contrast variance
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            std_dev = float(np.std(gray))
            needs_contrast = std_dev < 40.0  # Low contrast scan

            if not needs_deskew and not needs_contrast and adaptive:
                return img_bytes

            processed = img
            if needs_deskew:
                processed = cls.deskew(processed, skew_angle)

            if needs_contrast:
                processed = cls.enhance_contrast_and_binarize(processed)

            # Encode back to JPEG bytes
            success, encoded_img = cv2.imencode(".jpg", processed, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            if success:
                return encoded_img.tobytes()
            return img_bytes
        except Exception:
            return img_bytes

    @classmethod
    def crop_region(cls, img_bytes: bytes, bbox: Tuple[float, float, float, float], page_dim: Tuple[float, float]) -> bytes:
        """Crops a specific sub-region [x0, y0, x1, y1] from image bytes."""
        try:
            pil_img = Image.open(io.BytesIO(img_bytes))
            w_img, h_img = pil_img.size
            w_page, h_page = page_dim

            # Scale bbox from PDF points to pixel coords if needed
            scale_x = w_img / max(1.0, w_page)
            scale_y = h_img / max(1.0, h_page)

            x0 = max(0, int(bbox[0] * scale_x))
            y0 = max(0, int(bbox[1] * scale_y))
            x1 = min(w_img, int(bbox[2] * scale_x))
            y1 = min(h_img, int(bbox[3] * scale_y))

            if x1 <= x0 or y1 <= y0:
                return img_bytes

            cropped = pil_img.crop((x0, y0, x1, y1))
            buf = io.BytesIO()
            cropped.save(buf, format="JPEG", quality=95)
            return buf.getvalue()
        except Exception:
            return img_bytes
