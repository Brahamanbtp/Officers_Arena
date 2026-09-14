import uuid
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x0: float = Field(..., description="Left coordinate in PDF points or normalized 0-1 scale")
    y0: float = Field(..., description="Top coordinate in PDF points or normalized 0-1 scale")
    x1: float = Field(..., description="Right coordinate in PDF points or normalized 0-1 scale")
    y1: float = Field(..., description="Bottom coordinate in PDF points or normalized 0-1 scale")
    page_num: int = Field(..., description="0-indexed PDF page number")

    def width(self) -> float:
        return max(0.0, self.x1 - self.x0)

    def height(self) -> float:
        return max(0.0, self.y1 - self.y0)

    def area(self) -> float:
        return self.width() * self.height()


class QuestionOwnershipRegion(BaseModel):
    page_num: int = Field(..., description="0-indexed PDF page number")
    column_index: int = Field(default=0, description="0 for left column, 1 for right column in 2-col layout")
    bbox: BoundingBox = Field(..., description="Total enclosing ownership bounding box")
    text_bbox: Optional[BoundingBox] = None
    visual_bbox: Optional[BoundingBox] = None
    options_bbox: Optional[BoundingBox] = None
    captions_bbox: Optional[BoundingBox] = None
    question_number: int = Field(..., description="Question number anchor")


class SpatialProvenance(BaseModel):
    source_pdf: str
    source_pdf_hash: str
    source_page: int
    question_number: int
    question_bbox: Optional[BoundingBox] = None
    visual_bbox: Optional[BoundingBox] = None
    relative_position: str = Field(default="inside_ownership_region")
    extracted_at: str = Field(default="")


class FigureManifest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for figure exhibit")
    bbox: BoundingBox
    visual_type: str = Field(
        default="diagram",
        description="Type: geometry, map, graph, chart, table, chemical_structure, circuit, diagram, illustration"
    )
    visual_role: str = Field(default="question_exhibit", description="question_exhibit, option_visual, table, decorative")
    language: str = Field(default="english", description="Primary language of text labels inside figure")
    crop_file_path: Optional[str] = Field(None, description="Local or relative path to cropped PNG image file")
    storage_url: Optional[str] = Field(None, description="Browser-accessible URL for frontend rendering")
    description: Optional[str] = Field(None, description="Semantic text description of visual content")
    confidence: float = Field(default=1.0, description="Figure association confidence score (0.0 - 1.0)")
    source_question_number: Optional[int] = None
    structural_assertions_passed: List[str] = Field(default_factory=list)
    is_rejected: bool = Field(default=False)
    rejection_reason: Optional[str] = None


class QuestionManifest(BaseModel):
    manifest_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_number: Optional[int] = Field(None, description="Extracted numerical question sequence number")
    source_pdf: str = Field(..., description="Basename of source PDF file")
    source_pdf_hash: str = Field(..., description="SHA256 hash of source PDF file")
    page_numbers: List[int] = Field(default_factory=list, description="0-indexed PDF pages containing this question")
    language: str = Field(default="english", description="Primary language of question text")
    
    # Text and options
    text: str = Field(..., description="Question text with KaTeX notation for math")
    options: Dict[str, str] = Field(default_factory=dict, description="Dictionary of options A, B, C, D")
    correct_answer: str = Field(default="A", description="Option key A, B, C, or D")
    explanation: Optional[str] = Field(None, description="Step-by-step solution text")
    
    # Metadata
    exam_type: str = Field(default="CDS")
    year: int
    session: Optional[str] = Field(None, description="I or II")
    subject: str = Field(default="Mathematics")
    cognitive_level: str = Field(default="Understanding")
    difficulty: str = Field(default="Medium")
    
    # Spatial Bounding Boxes & Figures
    ownership_region: Optional[QuestionOwnershipRegion] = None
    spatial_provenance: Optional[SpatialProvenance] = None
    question_bbox: Optional[BoundingBox] = None
    figures: List[FigureManifest] = Field(default_factory=list, description="Precision figure crops for this question")
    
    # Validation & Provenance
    confidence_scores: Dict[str, float] = Field(
        default_factory=lambda: {
            "text": 1.0,
            "number": 1.0,
            "language": 1.0,
            "figure": 1.0,
            "overall": 1.0
        }
    )
    structural_assertions_passed: List[str] = Field(default_factory=list)
    validation_status: str = Field(default="PENDING", description="PENDING, PASS, FAIL, REVIEW_REQUIRED")
    validation_issues: List[str] = Field(default_factory=list)


class PageAnalysis(BaseModel):
    page_num: int
    width: float
    height: float
    page_type: str = Field(
        default="question_page",
        description="cover_page, instructions, question_page, answer_key, administrative, unknown"
    )
    column_layout: str = Field(default="single_column", description="single_column, two_column, multi_column")
    is_bilingual: bool = Field(default=True, description="True if English and Hindi regions coexist")
    detected_question_numbers: List[int] = Field(default_factory=list)
    has_visuals: bool = Field(default=False)


class PaperManifest(BaseModel):
    paper_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_pdf: str
    source_pdf_hash: str
    pipeline_version: str = Field(default="2.0.0-question-centric")
    created_at: str
    
    exam_type: str
    year: int
    session: Optional[str]
    subject: str
    
    total_pages: int
    expected_question_count: int
    detected_question_count: int
    validated_question_count: int
    
    pages: List[PageAnalysis] = Field(default_factory=list)
    questions: List[QuestionManifest] = Field(default_factory=list)
    
    overall_status: str = Field(default="PENDING", description="PASS, FAIL, REVIEW_REQUIRED")
    reconciliation_summary: Dict[str, Any] = Field(default_factory=dict)

