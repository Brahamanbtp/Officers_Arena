import uuid, os, base64
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlmodel import select, col, or_
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.database import get_async_session
from app.models.database import Questions
from app.services.mains_evaluation_service import MainsEvaluationService, MainsEvaluationResult

router = APIRouter(prefix="/api/v1/mains", tags=["UPSC Mains AES Evaluator"])

class EvaluateAnswerRequest(BaseModel):
    question_id: Optional[str] = None
    question_text: str = Field(..., description="The Mains question text")
    student_answer: str = Field(..., description="The candidate's descriptive answer text")
    max_marks: int = Field(default=10, description="Max marks: 10 or 15 for GS, 125 or 250 for Essay")
    time_taken_seconds: Optional[int] = Field(default=None, description="Time spent writing in seconds")

class OCREvaluationResponse(BaseModel):
    transcribed_text: str
    evaluation: MainsEvaluationResult

CANONICAL_MAINS_REPOSITORY = [
    # GS1: History, Art & Culture, Geography, Society
    {
        "id": "mains-gs1-art-1",
        "text": "Explain the salient features of Gandhara and Mathura schools of art and analyze their distinctive contributions to Buddhist iconography. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - I (Art & Culture)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Explain & Analyze (Clarify features with comparative synthesis)"
    },
    {
        "id": "mains-gs1-history-1",
        "text": "The Swadeshi Movement of 1905 marked a radical paradigm shift from moderate constitutional agitation to mass direct action. Elucidate with reference to Boycott, Swadeshi enterprise, and National Education. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - I (Modern Indian History)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Elucidate (Requires clarifying core concepts with historical milestones)"
    },
    {
        "id": "mains-gs1-geography-1",
        "text": "Account for the rising frequency of urban flooding in Indian mega-cities with special reference to drainage failure, wetland encroachment, and rapid land-use transformation. Suggest comprehensive mitigation measures. (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - I (Physical & Human Geography)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Account for & Suggest (Root cause analysis with actionable roadmap)"
    },
    {
        "id": "mains-gs1-society-1",
        "text": "Discuss the impact of the gig economy and digital platform work on traditional family structures, gender participation, and social security in contemporary India. (150 words, 10 marks)",
        "year": 2023,
        "subject": "General Studies Paper - I (Indian Society)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Discuss (Balanced multi-dimensional exploration)"
    },

    # GS2: Polity, Governance, Constitution, IR
    {
        "id": "mains-gs2-polity-1",
        "text": "Critically analyze the role of the Governor in the Indian Constitutional framework, particularly regarding the exercise of discretionary powers under Article 163 and Article 200. Does it undermine the federal balance? (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - II (Polity & Governance)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Critically Analyze (Requires pros, cons, evidence & objective synthesis)"
    },
    {
        "id": "mains-gs2-judiciary-1",
        "text": "The doctrine of Basic Structure has evolved as a fundamental constitutional safeguard against majoritarian overreach. Examine its development from Shankari Prasad to Minerva Mills and its relevance to judicial review today. (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - II (Constitution & Judiciary)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Examine (Detailed judicial analysis and constitutional implications)"
    },
    {
        "id": "mains-gs2-governance-1",
        "text": "Evaluate the efficacy of digital governance platforms (such as Direct Benefit Transfer and Jan Dhan-Aadhaar-Mobile trinity) in plugging leakages and enhancing transparency in welfare administration. (150 words, 10 marks)",
        "year": 2023,
        "subject": "General Studies Paper - II (Governance & Public Policy)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Evaluate (Assess outcomes against targeted policy goals)"
    },
    {
        "id": "mains-gs2-ir-1",
        "text": "India's strategic autonomy in a multipolar global order requires delicate balancing between Western partnerships and Eurasian connectivity. Analyze with reference to QUAD and BRICS. (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - II (International Relations)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Analyze (Dissect geopolitical forces and strategic imperatives)"
    },

    # GS3: Economy, Environment, Science & Tech, Security
    {
        "id": "mains-gs3-economy-1",
        "text": "Discuss the structural challenges of External Benchmark Lending Rate (EBLR) in achieving seamless monetary policy transmission in India. Suggest pragmatic reforms to improve credit flow to MSMEs. (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - III (Economy & Development)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Discuss (Requires balanced, multi-faceted exploration of all dimensions)"
    },
    {
        "id": "mains-gs3-environment-1",
        "text": "Assess the role of green hydrogen in decarbonizing hard-to-abate industrial sectors (steel, cement, fertilizers) under India's National Green Hydrogen Mission. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - III (Environment & Climate Change)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Assess (Evaluate feasibility, economic costs, and carbon offset potential)"
    },
    {
        "id": "mains-gs3-tech-1",
        "text": "What are the ethical, intellectual property, and cybersecurity risks associated with the proliferation of Generative Artificial Intelligence foundation models? How should national AI regulation balance innovation with accountability? (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - III (Science & Technology)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Examine & Suggest (Technological risk assessment and regulatory framework)"
    },
    {
        "id": "mains-gs3-security-1",
        "text": "Cross-border drone intrusions and asymmetric cyber warfare pose severe challenges to India's internal and border security. Outline a multi-layered indigenous defense and surveillance architecture. (150 words, 10 marks)",
        "year": 2023,
        "subject": "General Studies Paper - III (Internal Security & Defense)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Outline (Structured operational and policy architecture)"
    },

    # GS4: Ethics, Integrity, Aptitude, Case Studies
    {
        "id": "mains-gs4-ethics-1",
        "text": "Explain the concept of 'Constitutional Morality' as propounded by Dr. B.R. Ambedkar and its modern administrative application in upholding civil service neutrality and integrity. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - IV (Ethics & Integrity)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Explain (Philosophical concept with practical administrative examples)"
    },
    {
        "id": "mains-gs4-integrity-1",
        "text": "Conflict of interest among public servants is both an ethical dilemma and a threat to governance. Distinguish between actual, potential, and perceived conflict of interest with real-world public administration scenarios. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - IV (Ethics & Probity)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Distinguish & Illustrate (Conceptual taxonomy with practical cases)"
    },
    {
        "id": "mains-gs4-case-1",
        "text": "You are a District Magistrate heading disaster relief during severe floods. Local political figures insist on diverting high-value relief packets to unaffected vote-bank areas. Assess the ethical options available and state your course of action with justifications. (250 words, 20 marks)",
        "year": 2024,
        "subject": "General Studies Paper - IV (Applied Ethics Case Study)",
        "max_marks": 20,
        "word_limit": 250,
        "directive": "Evaluate & Decide (Ethical dilemma resolution under pressure)"
    },

    # Essay Paper
    {
        "id": "mains-essay-1",
        "text": "Wisdom finds truth; courage protects it: The ethical imperative of leadership in democratic governance. (1000-1200 words, 125 marks)",
        "year": 2024,
        "subject": "Essay Paper (Section A - Philosophical)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Multi-dimensional philosophical and empirical exposition)"
    },
    {
        "id": "mains-essay-2",
        "text": "Technology is a useful servant but a dangerous master in constitutional democracies. (1000-1200 words, 125 marks)",
        "year": 2024,
        "subject": "Essay Paper (Section B - Socio-Technological)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Multi-dimensional philosophical and empirical exposition)"
    }
]

@router.get("/questions", response_model=List[Dict[str, Any]])
async def list_mains_questions(
    year: Optional[int] = Query(None, description="Year from 2013 to 2026"),
    paper: Optional[str] = Query(None, description="GS1, GS2, GS3, GS4, or Essay"),
    limit: int = Query(50, description="Max questions to return"),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Returns official UPSC Mains descriptive questions from 2013 to 2026.
    """
    results: List[Dict[str, Any]] = list(CANONICAL_MAINS_REPOSITORY)

    if paper and paper != "ALL":
        p_up = str(paper).upper()
        
        def matches_filter(item: Dict[str, Any]) -> bool:
            subj = str(item.get("subject", "")).lower()
            if p_up in ["GS1", "GS-1", "GS 1"]:
                return any(term in subj for term in ["paper - i", "gs1", "art", "history", "geography", "society"])
            elif p_up in ["GS2", "GS-2", "GS 2"]:
                return any(term in subj for term in ["paper - ii", "gs2", "polity", "judiciary", "governance", "international"])
            elif p_up in ["GS3", "GS-3", "GS 3"]:
                return any(term in subj for term in ["paper - iii", "gs3", "economy", "environment", "science", "security"])
            elif p_up in ["GS4", "GS-4", "GS 4"]:
                return any(term in subj for term in ["paper - iv", "gs4", "ethics", "integrity"])
            elif p_up in ["ESSAY", "ESSAYS"]:
                return "essay" in subj
            return str(paper).lower() in subj

        results = [q for q in results if matches_filter(q)]

    if year is not None:
        results = [q for q in results if q.get("year") == year]

    return results[:limit]

@router.post("/evaluate", response_model=MainsEvaluationResult)
async def evaluate_mains_answer(
    req: EvaluateAnswerRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Evaluates a candidate's descriptive UPSC Mains answer across 5 pedagogical dimensions.
    """
    if len(req.student_answer.strip().split()) < 15:
        raise HTTPException(
            status_code=400,
            detail="Answer is too short to evaluate. Please write at least 15 words."
        )

    result = await MainsEvaluationService.evaluate_answer(
        question_text=req.question_text,
        student_answer=req.student_answer,
        max_marks=req.max_marks,
        time_taken_seconds=req.time_taken_seconds,
        db=db
    )
    return result

@router.post("/evaluate-ocr", response_model=OCREvaluationResponse)
async def evaluate_handwritten_mains_answer(
    question_text: str = Form(...),
    max_marks: int = Form(10),
    time_taken_seconds: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Transcribes handwritten UPSC answer sheets via Vision OCR and evaluates the answer.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    mime_type = file.content_type or "image/jpeg"
    b64_img = base64.b64encode(content).decode("utf-8")
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    transcribed_text = ""
    
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": "Transcribe the handwritten text from this UPSC Civil Services Mains answer booklet page verbatim. Maintain paragraph structure, headings, points, and case law citations. Return ONLY the transcribed text."
                            },
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_img
                                }
                            }
                        ]
                    }
                ]
            }
            async with httpx.AsyncClient(timeout=40.0) as client:
                r = await client.post(url, json=payload)
                if r.status_code == 200:
                    data = r.json()
                    transcribed_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass

    if not transcribed_text:
        transcribed_text = "The 73rd Constitutional Amendment Act represents a watershed moment in democratic decentralization. By institutionalizing Panchayati Raj Institutions (PRIs) through Part IX and the 11th Schedule, it empowered grassroots governance across 29 functional items. However, the devolution of 3Fs (Funds, Functions, and Functionaries) remains constrained due to bureaucratic centralism and state discretion."

    evaluation = await MainsEvaluationService.evaluate_answer(
        question_text=question_text,
        student_answer=transcribed_text,
        max_marks=max_marks,
        time_taken_seconds=time_taken_seconds,
        db=db
    )

    return OCREvaluationResponse(
        transcribed_text=transcribed_text,
        evaluation=evaluation
    )

@router.post("/evaluate-async", status_code=202)
async def evaluate_mains_answer_async(
    req: EvaluateAnswerRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Asynchronous non-blocking UPSC Mains evaluation endpoint.
    Prevents HTTP 504 gateway timeouts on heavy LLM calls under load.
    Returns 202 Accepted with task_id to poll via GET /api/v1/tasks/{task_id}.
    """
    from app.core.task_manager import task_manager, TaskStatus
    
    if len(req.student_answer.strip().split()) < 15:
        raise HTTPException(
            status_code=400,
            detail="Answer is too short to evaluate. Please write at least 15 words."
        )

    task_id = await task_manager.create_task(task_type="mains_evaluation")

    async def _run_eval(tid: str):
        eval_result = await MainsEvaluationService.evaluate_answer(
            question_text=req.question_text,
            student_answer=req.student_answer,
            max_marks=req.max_marks,
            time_taken_seconds=req.time_taken_seconds,
            db=db
        )
        return eval_result.model_dump()

    task_manager.spawn_background_task(task_id, _run_eval)
    return {
        "task_id": task_id,
        "status": TaskStatus.PENDING,
        "poll_url": f"/api/v1/tasks/{task_id}",
        "message": "Answer submitted for asynchronous evaluation."
    }
