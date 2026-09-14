import time
import threading
from typing import List, Dict, Any, Optional, Tuple
from pipelines.document_representation import BlockIR, LineIR, BoundingBox
from pipelines.image_preprocessor import ImagePreprocessor

class OCRResult:
    def __init__(
        self,
        text: str,
        confidence: float,
        provider: str,
        processing_time: float,
        blocks: Optional[List[BlockIR]] = None,
        errors: Optional[List[str]] = None,
        raw_output: Optional[Any] = None
    ):
        self.text = text
        self.confidence = confidence
        self.provider = provider
        self.processing_time = processing_time
        self.blocks = blocks or []
        self.errors = errors or []
        self.raw_output = raw_output


class PersistentRapidOCR:
    """Singleton wrapper for RapidOCR ONNX model instance (sub-0.2s CPU/GPU)."""
    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                try:
                    from rapidocr_onnxruntime import RapidOCR
                    cls._instance = RapidOCR()
                except Exception:
                    cls._instance = None
            return cls._instance


class PersistentPaddleOCR:
    """Singleton wrapper for PaddleOCR model instance."""
    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                try:
                    import importlib
                    paddle_mod = importlib.import_module("paddleocr")
                    PaddleOCR = getattr(paddle_mod, "PaddleOCR")
                    cls._instance = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
                except Exception:
                    cls._instance = None
            return cls._instance


class RapidOCRProvider:
    """RapidOCR ONNX Local OCR Engine with geometry preservation."""
    def __init__(self):
        self.engine = PersistentRapidOCR.get_instance()

    def extract(self, img_bytes: bytes, page_num: int = 1, page_width: float = 595.0, page_height: float = 842.0) -> OCRResult:
        if not self.engine:
            self.engine = PersistentRapidOCR.get_instance()
        if not self.engine:
            return OCRResult("", 0.0, "rapidocr", 0.0, errors=["RapidOCR engine unavailable"])

        t0 = time.time()
        try:
            # Adaptively preprocess for OCR
            processed_bytes = ImagePreprocessor.process_for_ocr(img_bytes, adaptive=True)
            result, _ = self.engine(processed_bytes)
            dt = time.time() - t0

            if not result:
                return OCRResult("", 0.0, "rapidocr", dt, errors=["Empty OCR result"])

            lines_text = []
            scores = []
            blocks: List[BlockIR] = []

            for idx, item in enumerate(result):
                box, text, score = item[0], item[1].strip(), float(item[2])
                if not text:
                    continue

                lines_text.append(text)
                scores.append(score)

                # box format: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
                xs = [pt[0] for pt in box]
                ys = [pt[1] for pt in box]
                bx0, by0, bx1, by1 = min(xs), min(ys), max(xs), max(ys)

                midpoint = page_width / 2.0
                col_idx = 0 if bx1 <= midpoint + 25 else (1 if bx0 >= midpoint - 25 else 0)

                bbox_obj = BoundingBox(x0=bx0, y0=by0, x1=bx1, y1=by1, page_num=page_num)
                line_obj = LineIR(text=text, bbox=bbox_obj, confidence=score)

                block_obj = BlockIR(
                    id=f"p{page_num}_ocr_{idx}",
                    type="text",
                    text=text,
                    raw_text=text,
                    bbox=bbox_obj,
                    confidence=score,
                    reading_order=idx,
                    column_idx=col_idx,
                    lines=[line_obj]
                )
                blocks.append(block_obj)

            full_text = "\n".join(lines_text)
            avg_conf = sum(scores) / max(1, len(scores))
            return OCRResult(full_text, avg_conf, "rapidocr", dt, blocks=blocks, raw_output=result)
        except Exception as e:
            dt = time.time() - t0
            return OCRResult("", 0.0, "rapidocr", dt, errors=[str(e)])


class PaddleOCRProvider:
    """PaddleOCR 3.x Local OCR Engine with geometry preservation."""
    def __init__(self):
        self.engine = PersistentPaddleOCR.get_instance()

    def extract(self, img_bytes: bytes, page_num: int = 1, page_width: float = 595.0, page_height: float = 842.0) -> OCRResult:
        if not self.engine:
            self.engine = PersistentPaddleOCR.get_instance()
        if not self.engine:
            return OCRResult("", 0.0, "paddleocr", 0.0, errors=["PaddleOCR engine unavailable"])

        t0 = time.time()
        try:
            result = self.engine.ocr(img_bytes, cls=True)
            dt = time.time() - t0

            if not result or not result[0]:
                return OCRResult("", 0.0, "paddleocr", dt, errors=["Empty OCR result"])

            lines_text = []
            scores = []
            blocks: List[BlockIR] = []

            for idx, line in enumerate(result[0]):
                box = line[0]
                text = line[1][0].strip()
                score = float(line[1][1])
                if not text:
                    continue

                lines_text.append(text)
                scores.append(score)

                xs = [pt[0] for pt in box]
                ys = [pt[1] for pt in box]
                bx0, by0, bx1, by1 = min(xs), min(ys), max(xs), max(ys)

                midpoint = page_width / 2.0
                col_idx = 0 if bx1 <= midpoint + 25 else (1 if bx0 >= midpoint - 25 else 0)

                bbox_obj = BoundingBox(x0=bx0, y0=by0, x1=bx1, y1=by1, page_num=page_num)
                line_obj = LineIR(text=text, bbox=bbox_obj, confidence=score)

                block_obj = BlockIR(
                    id=f"p{page_num}_paddle_{idx}",
                    type="text",
                    text=text,
                    raw_text=text,
                    bbox=bbox_obj,
                    confidence=score,
                    reading_order=idx,
                    column_idx=col_idx,
                    lines=[line_obj]
                )
                blocks.append(block_obj)

            full_text = "\n".join(lines_text)
            avg_conf = sum(scores) / max(1, len(scores))
            return OCRResult(full_text, avg_conf, "paddleocr", dt, blocks=blocks, raw_output=result)
        except Exception as e:
            dt = time.time() - t0
            return OCRResult("", 0.0, "paddleocr", dt, errors=[str(e)])


class LocalOCRChain:
    """
    Orchestrates local offline OCR provider fallback chain with persistent workers:
    PaddleOCR -> RapidOCR -> Fallback
    """
    def __init__(self):
        self.rapid = RapidOCRProvider()
        self.paddle = PaddleOCRProvider()

    def extract(self, img_bytes: bytes, page_num: int = 1, page_width: float = 595.0, page_height: float = 842.0) -> OCRResult:
        # 1. Try PaddleOCR first if available
        if self.paddle.engine:
            res = self.paddle.extract(img_bytes, page_num, page_width, page_height)
            if res.text and len(res.text.strip()) > 30 and res.confidence > 0.4:
                return res

        # 2. Try RapidOCR (ONNX Runtime, ultra-fast sub-0.2s)
        res = self.rapid.extract(img_bytes, page_num, page_width, page_height)
        if res.text and len(res.text.strip()) > 20:
            return res

        return OCRResult("", 0.0, "local_chain_failed", 0.0, errors=["All local OCR engines failed or returned empty text"])
