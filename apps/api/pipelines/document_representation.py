import uuid
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x0: float = Field(..., description="Left coordinate in points or pixels")
    y0: float = Field(..., description="Top coordinate in points or pixels")
    x1: float = Field(..., description="Right coordinate in points or pixels")
    y1: float = Field(..., description="Bottom coordinate in points or pixels")
    page_num: int = Field(default=1, description="1-indexed page number")

    def width(self) -> float:
        return max(0.0, self.x1 - self.x0)

    def height(self) -> float:
        return max(0.0, self.y1 - self.y0)

    def area(self) -> float:
        return self.width() * self.height()

    def to_list(self) -> List[float]:
        return [round(self.x0, 2), round(self.y0, 2), round(self.x1, 2), round(self.y1, 2)]

    @classmethod
    def from_list(cls, coords: List[float], page_num: int = 1) -> "BoundingBox":
        if len(coords) == 4:
            return cls(x0=coords[0], y0=coords[1], x1=coords[2], y1=coords[3], page_num=page_num)
        return cls(x0=0, y0=0, x1=0, y1=0, page_num=page_num)


class LineIR(BaseModel):
    id: str = Field(default_factory=lambda: f"line_{uuid.uuid4().hex[:8]}")
    text: str
    bbox: Optional[BoundingBox] = None
    confidence: float = 1.0


class BlockIR(BaseModel):
    id: str = Field(default_factory=lambda: f"b_{uuid.uuid4().hex[:8]}")
    type: str = Field(
        default="text",
        description="text, question_anchor, question_body, option, header, footer, table, visual, formula, noise"
    )
    text: str
    raw_text: Optional[str] = None
    bbox: Optional[BoundingBox] = None
    confidence: float = 1.0
    reading_order: int = 0
    column_idx: int = 0  # 0 for single/left, 1 for right
    lines: List[LineIR] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PageIR(BaseModel):
    page_number: int  # 1-indexed
    width: float = 595.0
    height: float = 842.0
    page_type: str = Field(
        default="DIGITAL_HIGH_QUALITY",
        description="DIGITAL_HIGH_QUALITY, DIGITAL_LOW_QUALITY, SCANNED_IMAGE, MIXED"
    )
    has_native_text: bool = True
    text_quality: float = 1.0
    image_quality: float = 1.0
    rotation: int = 0
    needs_ocr: bool = False
    columns: int = 1
    blocks: List[BlockIR] = Field(default_factory=list)
    raw_ocr_text: Optional[str] = None
    ocr_provider: Optional[str] = None


class DocumentIR(BaseModel):
    document_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_hash: str = ""
    filename: str = ""
    total_pages: int = 0
    pages: List[PageIR] = Field(default_factory=list)
    pipeline_version: str = "2.0.0"
    ocr_version: str = "rapidocr-onnx/paddleocr"
    created_at: float = 0.0
