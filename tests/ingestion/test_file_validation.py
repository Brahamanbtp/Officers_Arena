import tempfile
from pathlib import Path
from pipelines.file_validator import FileValidator

def test_valid_pdf_validation():
    import fitz
    temp_pdf_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            temp_pdf_path = f.name

        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "1. Which of the following is correct?\n(a) 25\n(b) 50\n(c) 75\n(d) 100")
        doc.save(temp_pdf_path)
        doc.close()

        res = FileValidator.validate_file(temp_pdf_path)
        assert res.is_valid is True
        assert res.page_count == 1
        assert res.mime_type == "application/pdf"
        assert len(res.file_hash) == 64
    finally:
        if temp_pdf_path:
            Path(temp_pdf_path).unlink(missing_ok=True)


def test_empty_file_rejection():
    temp_empty_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            temp_empty_path = f.name

        res = FileValidator.validate_file(temp_empty_path)
        assert res.is_valid is False
        assert "empty" in res.error.lower()
    finally:
        if temp_empty_path:
            Path(temp_empty_path).unlink(missing_ok=True)


def test_corrupted_pdf_rejection():
    temp_corrupt_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"NOT A REAL PDF FILE CONTENT AT ALL")
            temp_corrupt_path = f.name

        res = FileValidator.validate_file(temp_corrupt_path)
        assert res.is_valid is False
        assert "corrupted" in res.error.lower() or "invalid" in res.error.lower()
    finally:
        if temp_corrupt_path:
            Path(temp_corrupt_path).unlink(missing_ok=True)


def test_sha256_hash_consistency():
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"SAMPLE DATA FOR DETERMINISTIC HASH TEST")
            temp_path = f.name

        h1 = FileValidator.calculate_sha256(temp_path)
        h2 = FileValidator.calculate_sha256(temp_path)
        assert h1 == h2
        assert len(h1) == 64
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
