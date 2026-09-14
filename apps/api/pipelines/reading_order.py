import re
from typing import List, Dict, Any, Tuple
from pipelines.document_representation import BlockIR, PageIR, BoundingBox

class ReadingOrderEngine:
    """
    Layout & Geometry Analysis Engine:
    - Identifies & filters headers and footers/page numbers
    - Detects multi-column vs single-column page layouts
    - Sorts blocks in topological reading order: Left Column (top->bottom) -> Right Column (top->bottom)
    """

    HEADER_MARGIN_RATIO = 0.06  # Top 6%
    FOOTER_MARGIN_RATIO = 0.06  # Bottom 6%

    HEADER_FOOTER_PATTERNS = [
        re.compile(r"^\s*page\s+\d+\s*(?:of\s+\d+)?\s*$", re.IGNORECASE),
        re.compile(r"^\s*[-—–]\s*\d+\s*[-—–]\s*$", re.IGNORECASE),
        re.compile(r"^\s*\d{1,3}\s*$", re.IGNORECASE),
        re.compile(r"^\s*cds\s+exam\b", re.IGNORECASE),
        re.compile(r"^\s*upsc\b", re.IGNORECASE),
        re.compile(r"^\s*do not open this test booklet\b", re.IGNORECASE),
        re.compile(r"^\s*test booklet series\b", re.IGNORECASE),
        re.compile(r"^\s*combined defence services\b", re.IGNORECASE),
        re.compile(r"^\s*general knowledge\s*[-—–]\s*paper\b", re.IGNORECASE),
        re.compile(r"^\s*elementary mathematics\s*[-—–]\s*paper\b", re.IGNORECASE),
        re.compile(r"^\s*english\s*[-—–]\s*paper\b", re.IGNORECASE)
    ]

    @classmethod
    def is_header_or_footer(cls, block: BlockIR, page_height: float) -> bool:
        """Determines if a block is in header/footer margin or matches header/footer text patterns."""
        if not block.bbox:
            return False

        y0 = block.bbox.y0
        y1 = block.bbox.y1
        text = block.text.strip()

        # Check margin bounds
        in_header_margin = y1 <= (page_height * cls.HEADER_MARGIN_RATIO)
        in_footer_margin = y0 >= (page_height * (1.0 - cls.FOOTER_MARGIN_RATIO))

        if in_header_margin or in_footer_margin:
            # If text matches common header/footer pattern or is very short (like a page number)
            for pat in cls.HEADER_FOOTER_PATTERNS:
                if pat.search(text):
                    return True
            if len(text) < 30 and (in_header_margin or in_footer_margin):
                return True

        return False

    @classmethod
    def detect_column_layout(cls, blocks: List[BlockIR], page_width: float) -> int:
        """Detects if page is 1-column (returns 1) or 2-column (returns 2)."""
        if not blocks or len(blocks) < 4:
            return 1

        midpoint = page_width / 2.0
        left_count = 0
        right_count = 0

        for b in blocks:
            if not b.bbox:
                continue
            if b.bbox.x1 <= midpoint + 25:
                left_count += 1
            elif b.bbox.x0 >= midpoint - 25:
                right_count += 1

        # If both left and right have significant content (> 20% of blocks each), it's 2-column
        total = len(blocks)
        if (left_count / total > 0.20) and (right_count / total > 0.20):
            return 2
        return 1

    @classmethod
    def sort_and_classify_page_blocks(cls, page: PageIR) -> List[BlockIR]:
        """
        Filters out noise/headers/footers and assigns correct reading order across columns.
        """
        page_width = page.width
        page_height = page.height
        midpoint = page_width / 2.0

        filtered_blocks: List[BlockIR] = []

        for b in page.blocks:
            if cls.is_header_or_footer(b, page_height):
                b.type = "header" if (b.bbox and b.bbox.y0 < page_height / 2) else "footer"
                continue

            # Assign column index
            if b.bbox:
                if b.bbox.x1 <= midpoint + 25:
                    b.column_idx = 0
                elif b.bbox.x0 >= midpoint - 25:
                    b.column_idx = 1
                else:
                    b.column_idx = 0  # Spanning midpoint
            filtered_blocks.append(b)

        # Topological Sort: Column 0 (top to bottom) -> Column 1 (top to bottom)
        filtered_blocks.sort(
            key=lambda blk: (
                blk.column_idx,
                round(blk.bbox.y0, 1) if blk.bbox else 0.0,
                round(blk.bbox.x0, 1) if blk.bbox else 0.0
            )
        )

        for order_idx, blk in enumerate(filtered_blocks):
            blk.reading_order = order_idx

        page.columns = cls.detect_column_layout(filtered_blocks, page_width)
        return filtered_blocks
