import os
import logging
from typing import Optional

try:
    import cv2
    import numpy as np
except ImportError:
    # Safeguard execution if OpenCV is not installed locally yet
    cv2 = None
    np = None

logger = logging.getLogger("pipelines.pre_processing")

def process_low_quality_scan(image_path: str, output_path: Optional[str] = None):
    """
    Applies image enhancement pipeline using OpenCV:
    1. Grayscale Conversion
    2. Gaussian Blur (5x5 kernel)
    3. Otsu's Binarization for thresholding
    4. Dilation to sharpen text for OCR
    
    Args:
        image_path: Absolute path to the scanned page/figure image.
        output_path: Optional path to save the processed image.
        
    Returns:
        np.ndarray: Cleaned binary image array.
    """
    if cv2 is None or np is None:
        msg = "OpenCV (opencv-python) or numpy is not installed in the environment."
        logger.error(msg)
        raise ImportError(msg)
        
    logger.info(f"OpenCV processing scan: {image_path}")
    
    # 1. Grayscale conversion
    image = cv2.imread(image_path)
    if image is None:
        err = f"Image file could not be read: {image_path}"
        logger.error(err)
        raise FileNotFoundError(err)
        
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 2. Gaussian Blur (5x5 kernel)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # 3. Otsu's Binarization
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # 4. Dilation to sharpen thin text
    # A small 2x2 rectangular kernel is ideal to thicken thin OCR strokes
    kernel = np.ones((2, 2), np.uint8)
    processed = cv2.dilate(thresh, kernel, iterations=1)
    
    if output_path:
        # Create parent directory if needed
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, processed)
        logger.info(f"Enhanced image saved successfully to {output_path}")
        
    return processed
