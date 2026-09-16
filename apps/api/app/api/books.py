import os
import uuid
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_session
from app.models.database import Book, BookPage

try:
    from pipelines.cloud_providers import GeminiCloudProvider, MistralCloudProvider
except ImportError:
    try:
        from apps.api.pipelines.cloud_providers import GeminiCloudProvider, MistralCloudProvider
    except ImportError:
        import sys
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
        from pipelines.cloud_providers import GeminiCloudProvider, MistralCloudProvider

router = APIRouter(prefix="/api/books", tags=["Books & Study Vault"])

class AskBookRequest(BaseModel):
    book_id: str
    current_page: int
    prompt: str
    action_type: Optional[str] = "custom"  # "explain", "mcq", "high_yield", "mains", "custom"

class AskBookResponse(BaseModel):
    book_title: str
    page_number: int
    chapter_title: Optional[str]
    answer: str
    grounding_excerpts: List[str]

@router.get("", response_model=List[dict])
async def list_books(
    exam_type: Optional[str] = None,
    category: Optional[str] = None,
    subject: Optional[str] = None,
    session: AsyncSession = Depends(get_session)
):
    query = select(Book)
    if exam_type and exam_type != "ALL":
        query = query.where(Book.exam_type == exam_type)
    if category and category != "ALL":
        query = query.where(Book.category == category)
    if subject:
        query = query.where(Book.subject == subject)
    
    result = await session.execute(query)
    books = result.scalars().all()
    
    return [
        {
            "id": str(b.id),
            "title": b.title,
            "author": b.author,
            "edition": b.edition,
            "subject": b.subject,
            "exam_type": b.exam_type,
            "category": b.category,
            "total_pages": b.total_pages,
            "file_name": b.file_name,
            "pdf_url": f"/api/books/{b.id}/pdf"
        }
        for b in books
    ]

from fastapi.responses import FileResponse, RedirectResponse

def resolve_pdf_path(stored_path: str, file_name: str) -> Optional[Path]:
    if stored_path and not stored_path.startswith("http"):
        p = Path(stored_path)
        if p.is_absolute() and p.exists():
            return p

    candidates = [
        Path.cwd(),
        Path.cwd().parent,
        Path.cwd().parent.parent,
        Path(__file__).resolve().parents[3],
        Path(__file__).resolve().parents[4]
    ]
    
    for base in candidates:
        if stored_path and not stored_path.startswith("http"):
            candidate_path = base / stored_path
            if candidate_path.exists():
                return candidate_path
        # Search by filename in data/raw_books
        raw_books_dir = base / "data" / "raw_books"
        if raw_books_dir.exists():
            found = list(raw_books_dir.glob(f"**/{file_name}"))
            if found:
                return found[0]

    return None

@router.get("/{book_id}/pdf")
async def get_book_pdf(book_id: str, session: AsyncSession = Depends(get_session)):
    try:
        b_uuid = uuid.UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Book ID")

    result = await session.execute(select(Book).where(Book.id == b_uuid))
    book = result.scalars().first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    pdf_path = resolve_pdf_path(book.file_path, book.file_name)
    if pdf_path and pdf_path.exists():
        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=book.file_name,
            headers={
                "Content-Disposition": f'inline; filename="{book.file_name}"',
                "Accept-Ranges": "bytes"
            }
        )
    
    # If not found on local disk, redirect to Supabase Storage CDN URL
    if book.file_path and book.file_path.startswith("http"):
        return RedirectResponse(url=book.file_path)

    raise HTTPException(status_code=404, detail="PDF file not available on local disk or cloud CDN")

@router.get("/{book_id}/pages/{page_num}")
async def get_book_page(book_id: str, page_num: int, session: AsyncSession = Depends(get_session)):
    try:
        b_uuid = uuid.UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Book ID")

    result = await session.execute(
        select(BookPage).where(BookPage.book_id == b_uuid, BookPage.page_number == page_num)
    )
    page = result.scalars().first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    return {
        "book_id": book_id,
        "page_number": page.page_number,
        "chapter_title": page.chapter_title,
        "extracted_text": page.extracted_text
    }

@router.post("/ask", response_model=AskBookResponse)
async def ask_ai_tutor_about_page(req: AskBookRequest, session: AsyncSession = Depends(get_session)):
    try:
        b_uuid = uuid.UUID(req.book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Book ID")

    # Fetch book and current page
    book_res = await session.execute(select(Book).where(Book.id == b_uuid))
    book = book_res.scalars().first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    page_res = await session.execute(
        select(BookPage).where(BookPage.book_id == b_uuid, BookPage.page_number == req.current_page)
    )
    page = page_res.scalars().first()
    page_text = page.extracted_text if page else "No specific text found on this page."
    chapter_title = page.chapter_title if page else "General"

    # Action prompts
    system_instruction = f"""
    You are the Officers Arena AI Senior Exam Mentor and Textbook Tutor.
    You are assisting a student reading the standard reference textbook:
    Book: "{book.title}" by {book.author or 'Standard Author'} (Subject: {book.subject}, Exam: {book.exam_type})
    Current Page: Page {req.current_page}
    Chapter: {chapter_title}

    ACTUAL PAGE CONTENT:
    \"\"\"{page_text}\"\"\"

    STUDENT QUERY / INSTRUCTION:
    \"{req.prompt}\"

    GUIDELINES:
    1. Ground your response strictly in the textbook context provided above.
    2. Format using structured Markdown with bold key points, bullet lists, and KaTeX for formulas if applicable.
    3. If asked for MCQs, generate authentic UPSC/CDS standard questions with 4 options (A, B, C, D) and detailed explanations directly based on this page.
    4. If asked to explain simply, break down complex constitutional/historical/scientific concepts with real-world Indian examples.
    5. Maintain an inspiring, rigorous, and exam-focused tone.
    """

    ai_reply = None
    # 1. Try Gemini
    gemini_res = GeminiCloudProvider.generate_text(system_instruction)
    if gemini_res:
        ai_reply = gemini_res

    # 2. Fallback to Mistral
    if not ai_reply:
        mistral_res = MistralCloudProvider.generate_text(system_instruction)
        if mistral_res:
            ai_reply = mistral_res

    # 3. Fallback heuristic
    if not ai_reply:
        ai_reply = f"**Key Takeaways from Page {req.current_page} ({chapter_title}):**\n\n" + \
                   "\n".join([f"• {line}" for line in page_text.splitlines() if line.strip()][:6])

    return AskBookResponse(
        book_title=book.title,
        page_number=req.current_page,
        chapter_title=chapter_title,
        answer=ai_reply,
        grounding_excerpts=[page_text[:300] + "..."] if len(page_text) > 300 else [page_text]
    )
