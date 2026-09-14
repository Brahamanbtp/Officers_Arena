import fitz  # PyMuPDF
from typing import Optional, Dict, Any, Tuple
from pipelines.document_representation import BoundingBox
from pipelines.image_preprocessor import ImagePreprocessor
from pipelines.ocr_providers import LocalOCRChain
from pipelines.option_reconstructor import OptionReconstructor
from pipelines.cloud_providers import GeminiCloudProvider

class RecoveryEngine:
    """
    Targeted Bounding-Box Recovery Engine.
    Only recovers specific degraded question or option regions without reprocessing the whole page.
    """

    @classmethod
    def recover_question_region(
        cls,
        doc: fitz.Document,
        page_num: int,
        bbox: Optional[BoundingBox] = None,
        use_cloud: bool = True
    ) -> Tuple[Optional[str], Dict[str, str], float]:
        """
        Performs high-resolution re-rendering and targeted OCR / Vision recovery on a specific region.
        Returns:
            (recovered_text, recovered_options, recovery_confidence)
        """
        try:
            page_idx = max(0, min(len(doc) - 1, page_num - 1))
            page = doc[page_idx]

            # If bbox is given, define clip rect; otherwise render whole page at high DPI
            clip_rect = None
            if bbox and bbox.width() > 10 and bbox.height() > 10:
                clip_rect = fitz.Rect(
                    max(0.0, bbox.x0 - 10.0),
                    max(0.0, bbox.y0 - 10.0),
                    min(page.rect.width, bbox.x1 + 10.0),
                    min(page.rect.height, bbox.y1 + 10.0)
                )

            # High-resolution render (200 DPI for precision)
            pix = page.get_pixmap(dpi=200, clip=clip_rect)
            img_bytes = pix.tobytes("jpeg", jpg_quality=95)

            # Step 1: Local high-precision OCR with enhanced contrast preprocessing
            enhanced_bytes = ImagePreprocessor.process_for_ocr(img_bytes, adaptive=False)
            ocr_chain = LocalOCRChain()
            ocr_res = ocr_chain.extract(enhanced_bytes, page_num=page_num)

            rec_options = {}
            if ocr_res.text:
                lines = [ln.strip() for ln in ocr_res.text.splitlines() if ln.strip()]
                opts_dict, _, opt_conf = OptionReconstructor.reconstruct_options(lines, page_num=page_num)
                if all(opts_dict.get(k) for k in ["A", "B", "C", "D"]) and opt_conf > 0.8:
                    return ocr_res.text, opts_dict, opt_conf

            # Step 2: Selective Gemini Vision recovery only if local recovery was insufficient
            if use_cloud:
                prompt = (
                    "Extract the question text and options A, B, C, D from this exam snippet.\n"
                    "Format strictly as:\n"
                    "QUESTION: <text>\n"
                    "(a) <option a>\n"
                    "(b) <option b>\n"
                    "(c) <option c>\n"
                    "(d) <option d>"
                )
                cloud_res = GeminiCloudProvider.process_image(img_bytes, prompt)
                if cloud_res:
                    cloud_text, _ = cloud_res
                    lines = [ln.strip() for ln in cloud_text.splitlines() if ln.strip()]
                    opts_dict, _, opt_conf = OptionReconstructor.reconstruct_options(lines, page_num=page_num)
                    return cloud_text, opts_dict, opt_conf

            return ocr_res.text, rec_options, 0.5
        except Exception:
            return None, {}, 0.0
