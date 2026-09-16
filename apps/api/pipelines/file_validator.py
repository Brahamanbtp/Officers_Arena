import os
import hashlib
try:
    import pymupdf as fitz
except ImportError:
    import fitz
from PIL import Image
from pathlib import Path
from typing import Dict, Any, Optional
from sqlmodel import Session, select
from app.models.database import IngestionJob

class FileValidationResult:
    def __init__(
        self,
        is_valid: bool,
        file_hash: str,
        page_count: int,
        file_size: int,
        mime_type: str,
        existing_job_id: Optional[str] = None,
        error: Optional[str] = None
    ):
        self.is_valid = is_valid
        self.file_hash = file_hash
        self.page_count = page_count
        self.file_size = file_size
        self.mime_type = mime_type
        self.existing_job_id = existing_job_id
        self.error = error


class FileValidator:
    """
    Validates uploaded exam document files for corruption, encryption, page limits, 
    and performs SHA-256 deduplication.
    """

    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB max size
    ALLOWED_EXTENSIONS = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }

    @classmethod
    def calculate_sha256(cls, file_path: str) -> str:
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                sha256.update(chunk)
        return sha256.hexdigest()

    @classmethod
    def validate_file(cls, file_path: str, engine=None) -> FileValidationResult:
        path = Path(file_path)
        if not path.exists():
            return FileValidationResult(False, "", 0, 0, "", error=f"File does not exist: {file_path}")

        file_size = path.stat().st_size
        if file_size == 0:
            return FileValidationResult(False, "", 0, 0, "", error="File is empty (0 bytes)")

        if file_size > cls.MAX_FILE_SIZE:
            return FileValidationResult(False, "", 0, file_size, "", error=f"File size ({file_size} bytes) exceeds max limit of 100MB")

        ext = path.suffix.lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            return FileValidationResult(False, "", 0, file_size, "", error=f"Unsupported file extension: '{ext}'. Allowed: {list(cls.ALLOWED_EXTENSIONS.keys())}")

        mime_type = cls.ALLOWED_EXTENSIONS[ext]

        # Calculate SHA-256 Hash
        file_hash = cls.calculate_sha256(file_path)

        # Check DB for duplicate SHA-256 hash
        if engine:
            try:
                with Session(engine) as s:
                    existing = s.exec(
                        select(IngestionJob).where(IngestionJob.file_hash == file_hash)
                    ).first()
                    if existing:
                        return FileValidationResult(
                            is_valid=True,
                            file_hash=file_hash,
                            page_count=existing.total_pages,
                            file_size=file_size,
                            mime_type=mime_type,
                            existing_job_id=str(existing.id)
                        )
            except Exception:
                pass  # Ignore DB lookup errors during isolated offline testing

        # Validate PDF Readability & Encryption
        page_count = 0
        if ext == ".pdf":
            try:
                doc = fitz.open(file_path)
                if doc.is_encrypted:
                    doc.close()
                    return FileValidationResult(False, file_hash, 0, file_size, mime_type, error="PDF is encrypted or password-protected")

                page_count = len(doc)
                if page_count == 0:
                    doc.close()
                    return FileValidationResult(False, file_hash, 0, file_size, mime_type, error="PDF contains 0 pages")

                # Test rendering first page to verify corruption
                page = doc[0]
                pix = page.get_pixmap(dpi=50)
                if not pix or pix.width == 0 or pix.height == 0:
                    doc.close()
                    return FileValidationResult(False, file_hash, page_count, file_size, mime_type, error="PDF page rendering failure (corrupted image streams)")

                doc.close()
            except Exception as e:
                return FileValidationResult(False, file_hash, 0, file_size, mime_type, error=f"Corrupted or invalid PDF file: {e}")
        else:
            try:
                with Image.open(file_path) as img:
                    img.verify()
                page_count = 1
            except Exception as e:
                return FileValidationResult(False, file_hash, 0, file_size, mime_type, error=f"Corrupted or invalid image file: {e}")

        return FileValidationResult(
            is_valid=True,
            file_hash=file_hash,
            page_count=page_count,
            file_size=file_size,
            mime_type=mime_type
        )
