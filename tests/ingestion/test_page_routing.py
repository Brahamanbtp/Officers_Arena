import fitz
from pipelines.page_router import PageRouter

def test_digital_page_avoids_unnecessary_ocr():
    doc = fitz.open()
    page = doc.new_page()
    sample_text = (
        "1. Under Article 77 of the Constitution of India, consider the following statements:\n"
        "1. All executive actions of the Government of India are taken in the name of the President.\n"
        "2. The President specifies rules for authenticating orders.\n\n"
        "Which of the statements given above is/are correct?\n"
        "(a) 1 only\n"
        "(b) 2 only\n"
        "(c) Both 1 and 2\n"
        "(d) Neither 1 nor 2\n"
    )
    page.insert_text((50, 50), sample_text)

    analysis = PageRouter.analyze_page(page, page_number=1)
    doc.close()

    assert analysis.has_native_text is True
    assert analysis.needs_ocr is False
    assert analysis.page_type == "DIGITAL_HIGH_QUALITY"
    assert analysis.text_quality >= 0.70
    assert len(analysis.blocks) > 0
