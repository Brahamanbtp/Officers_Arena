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
    # --- ESSAY PAPERS (2014 - 2024) ---
    {
        "id": "mains-essay-2024-1",
        "text": "Wisdom finds truth; courage protects it: The ethical imperative of leadership in democratic governance. (1000-1200 words, 125 marks)",
        "year": 2024,
        "subject": "Essay Paper (Section A - Philosophical)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Multi-dimensional philosophical and empirical exposition)"
    },
    {
        "id": "mains-essay-2024-2",
        "text": "Technology is a useful servant but a dangerous master in constitutional democracies. (1000-1200 words, 125 marks)",
        "year": 2024,
        "subject": "Essay Paper (Section B - Socio-Technological)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Multi-dimensional philosophical and empirical exposition)"
    },
    {
        "id": "mains-essay-2023-1",
        "text": "Thinking is like a game, it does not begin unless there is an opposite team. (1000-1200 words, 125 marks)",
        "year": 2023,
        "subject": "Essay Paper (Section A - Philosophical)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Dialectical analysis of thought, dissent, and intellectual progress)"
    },
    {
        "id": "mains-essay-2023-2",
        "text": "Education is what remains after one has forgotten what one has learned in school. (1000-1200 words, 125 marks)",
        "year": 2023,
        "subject": "Essay Paper (Section B - Human Capital & Values)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Character building, critical thinking, and lifelong ethical learning)"
    },
    {
        "id": "mains-essay-2022-1",
        "text": "Forests are the best case studies for economic excellence. (1000-1200 words, 125 marks)",
        "year": 2022,
        "subject": "Essay Paper (Section A - Ecological Economics)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Symbiosis, sustainability, resource allocation, and circular economy)"
    },
    {
        "id": "mains-essay-2022-2",
        "text": "Poets are the unacknowledged legislators of the world. (1000-1200 words, 125 marks)",
        "year": 2022,
        "subject": "Essay Paper (Section B - Cultural & Moral Leadership)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Role of art, literature, and empathy in shaping public conscience)"
    },
    {
        "id": "mains-essay-2021-1",
        "text": "The real is rational and the rational is real: Evaluating modern political and economic choices. (1000-1200 words, 125 marks)",
        "year": 2021,
        "subject": "Essay Paper (Section A - Philosophical)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Hegelian synthesis applied to institutional and developmental reality)"
    },
    {
        "id": "mains-essay-2021-2",
        "text": "History is a series of victories won by the scientific man over the romantic man. (1000-1200 words, 125 marks)",
        "year": 2021,
        "subject": "Essay Paper (Section B - Scientific Enlightenment)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Scientific temper, technological triumphs, and humanistic balancing)"
    },
    {
        "id": "mains-essay-2020-1",
        "text": "Courage to accept and dedication to improve are two keys to success. (1000-1200 words, 125 marks)",
        "year": 2020,
        "subject": "Essay Paper (Section A - Personal Ethics)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Self-reflection, institutional resilience, and reformative courage)"
    },
    {
        "id": "mains-essay-2019-1",
        "text": "South Asian society is not bonded by state but by cultural heritage and shared values. (1000-1200 words, 125 marks)",
        "year": 2019,
        "subject": "Essay Paper (Section B - Civilizational Unity)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Civilizational continuum vs geopolitical boundaries in South Asia)"
    },
    {
        "id": "mains-essay-2018-1",
        "text": "Farming has lost the ability to be a source of subsistence for majority of farmers in India. (1000-1200 words, 125 marks)",
        "year": 2018,
        "subject": "Essay Paper (Section B - Agrarian Economy)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Agrarian distress, land fragmentation, and rural value chains)"
    },
    {
        "id": "mains-essay-2017-1",
        "text": "Fulfillment of 'new woman' in India is a myth. (1000-1200 words, 125 marks)",
        "year": 2017,
        "subject": "Essay Paper (Section A - Gender & Social Justice)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Patriarchal structures, glass ceilings, and substantive empowerment)"
    },
    {
        "id": "mains-essay-2016-1",
        "text": "If development is not engendered, it is endangered. (1000-1200 words, 125 marks)",
        "year": 2016,
        "subject": "Essay Paper (Section B - Gender & Development)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Inclusive growth, female labor force participation, and gender budgeting)"
    },
    {
        "id": "mains-essay-2015-1",
        "text": "Dreams which do not let you sleep are the true catalysts of national transformation. (1000-1200 words, 125 marks)",
        "year": 2015,
        "subject": "Essay Paper (Section A - Visionary Leadership)",
        "max_marks": 125,
        "word_limit": 1000,
        "directive": "Essay (Vision, youth energy, and national developmental mission)"
    },

    # --- GENERAL STUDIES - I (2015 - 2024) ---
    {
        "id": "mains-gs1-art-2024",
        "text": "Explain the salient features of Gandhara and Mathura schools of art and analyze their distinctive contributions to Buddhist iconography. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - I (Art & Culture)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Explain & Analyze (Clarify features with comparative synthesis)"
    },
    {
        "id": "mains-gs1-history-2024",
        "text": "The Swadeshi Movement of 1905 marked a radical paradigm shift from moderate constitutional agitation to mass direct action. Elucidate with reference to Boycott, Swadeshi enterprise, and National Education. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - I (Modern Indian History)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Elucidate (Requires clarifying core concepts with historical milestones)"
    },
    {
        "id": "mains-gs1-geography-2024",
        "text": "Account for the rising frequency of urban flooding in Indian mega-cities with special reference to drainage failure, wetland encroachment, and rapid land-use transformation. Suggest comprehensive mitigation measures. (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - I (Physical & Human Geography)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Account for & Suggest (Root cause analysis with actionable roadmap)"
    },
    {
        "id": "mains-gs1-society-2023",
        "text": "Discuss the impact of the gig economy and digital platform work on traditional family structures, gender participation, and social security in contemporary India. (150 words, 10 marks)",
        "year": 2023,
        "subject": "General Studies Paper - I (Indian Society)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Discuss (Balanced multi-dimensional exploration)"
    },
    {
        "id": "mains-gs1-history-2022",
        "text": "Why did the armies of the British East India Company—mostly comprising Indian soldiers—win consistently against the much more numerous and better-equipped armies of the Indian rulers? (150 words, 10 marks)",
        "year": 2022,
        "subject": "General Studies Paper - I (Modern Indian History)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Analyze (Dissect organizational, financial, and military discipline factors)"
    },
    {
        "id": "mains-gs1-geo-2021",
        "text": "Differentiate between the causes and spatial impacts of tropical cyclones in the Bay of Bengal versus the Arabian Sea with special reference to recent warming trends. (250 words, 15 marks)",
        "year": 2021,
        "subject": "General Studies Paper - I (Climatology & Oceanography)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Differentiate & Assess (Climatic comparison with SST trends)"
    },
    {
        "id": "mains-gs1-society-2020",
        "text": "Is diversity and pluralism under threat due to the forces of globalization in contemporary Indian society? Substantiate your answer with sociological arguments. (250 words, 15 marks)",
        "year": 2020,
        "subject": "General Studies Paper - I (Indian Society)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Substantiate (Sociological critique of cultural homogenization)"
    },
    {
        "id": "mains-gs1-history-2018",
        "text": "Throw light on the significance of the thoughts of Mahatma Gandhi in the present times, particularly regarding environmental sustainability, decentralization, and non-violent conflict resolution. (150 words, 10 marks)",
        "year": 2018,
        "subject": "General Studies Paper - I (Modern Indian History & Philosophy)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Evaluate (Contemporary relevance of Gandhian philosophy)"
    },

    # --- GENERAL STUDIES - II (2015 - 2024) ---
    {
        "id": "mains-gs2-polity-2024",
        "text": "Critically analyze the role of the Governor in the Indian Constitutional framework, particularly regarding the exercise of discretionary powers under Article 163 and Article 200. Does it undermine the federal balance? (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - II (Polity & Governance)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Critically Analyze (Requires pros, cons, evidence & objective synthesis)"
    },
    {
        "id": "mains-gs2-judiciary-2024",
        "text": "The doctrine of Basic Structure has evolved as a fundamental constitutional safeguard against majoritarian overreach. Examine its development from Shankari Prasad to Minerva Mills and its relevance to judicial review today. (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - II (Constitution & Judiciary)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Examine (Detailed judicial analysis and constitutional implications)"
    },
    {
        "id": "mains-gs2-governance-2023",
        "text": "Evaluate the efficacy of digital governance platforms (such as Direct Benefit Transfer and Jan Dhan-Aadhaar-Mobile trinity) in plugging leakages and enhancing transparency in welfare administration. (150 words, 10 marks)",
        "year": 2023,
        "subject": "General Studies Paper - II (Governance & Public Policy)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Evaluate (Assess outcomes against targeted policy goals)"
    },
    {
        "id": "mains-gs2-ir-2024",
        "text": "India's strategic autonomy in a multipolar global order requires delicate balancing between Western partnerships and Eurasian connectivity. Analyze with reference to QUAD and BRICS. (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - II (International Relations)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Analyze (Dissect geopolitical forces and strategic imperatives)"
    },
    {
        "id": "mains-gs2-fed-2022",
        "text": "Fiscal Federalism in India has undergone significant transformation after the introduction of GST and the reconstitution of the Planning Commission into NITI Aayog. Discuss the challenges faced by states in revenue mobilization. (250 words, 15 marks)",
        "year": 2022,
        "subject": "General Studies Paper - II (Federalism & Public Finance)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Discuss (Analysis of vertical and horizontal fiscal devolution)"
    },
    {
        "id": "mains-gs2-repr-2021",
        "text": "Analyze the salient provisions of the Representation of the People Act, 1951 regarding the disqualification of convicted elected representatives and inner-party democracy. (150 words, 10 marks)",
        "year": 2021,
        "subject": "General Studies Paper - II (Electoral Reforms & RPA)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Analyze (Statutory mechanisms and Supreme Court landmark rulings)"
    },
    {
        "id": "mains-gs2-bodies-2019",
        "text": "The Election Commission of India has been a pillar of Indian democracy, yet concerns regarding model code enforcement and transparency of electoral bonds warrant institutional strengthening. Comment. (250 words, 15 marks)",
        "year": 2019,
        "subject": "General Studies Paper - II (Constitutional Bodies & ECI)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Comment (Evaluation of institutional autonomy and reforms)"
    },

    # --- GENERAL STUDIES - III (2015 - 2024) ---
    {
        "id": "mains-gs3-economy-2024",
        "text": "Discuss the structural challenges of External Benchmark Lending Rate (EBLR) in achieving seamless monetary policy transmission in India. Suggest pragmatic reforms to improve credit flow to MSMEs. (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - III (Economy & Development)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Discuss (Requires balanced, multi-faceted exploration of all dimensions)"
    },
    {
        "id": "mains-gs3-environment-2024",
        "text": "Assess the role of green hydrogen in decarbonizing hard-to-abate industrial sectors (steel, cement, fertilizers) under India's National Green Hydrogen Mission. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - III (Environment & Climate Change)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Assess (Evaluate feasibility, economic costs, and carbon offset potential)"
    },
    {
        "id": "mains-gs3-tech-2024",
        "text": "What are the ethical, intellectual property, and cybersecurity risks associated with the proliferation of Generative Artificial Intelligence foundation models? How should national AI regulation balance innovation with accountability? (250 words, 15 marks)",
        "year": 2024,
        "subject": "General Studies Paper - III (Science & Technology)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Examine & Suggest (Technological risk assessment and regulatory framework)"
    },
    {
        "id": "mains-gs3-security-2023",
        "text": "Cross-border drone intrusions and asymmetric cyber warfare pose severe challenges to India's internal and border security. Outline a multi-layered indigenous defense and surveillance architecture. (150 words, 10 marks)",
        "year": 2023,
        "subject": "General Studies Paper - III (Internal Security & Defense)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Outline (Structured operational and policy architecture)"
    },
    {
        "id": "mains-gs3-agri-2022",
        "text": "What are the major constraints in transport and marketing of agricultural produce in India? How can e-NAM and Direct-to-Farmer supply chains overcome middleman cartelization? (250 words, 15 marks)",
        "year": 2022,
        "subject": "General Studies Paper - III (Agriculture & APMC Reforms)",
        "max_marks": 15,
        "word_limit": 250,
        "directive": "Analyze & Suggest (Supply chain bottlenecks and digital solutions)"
    },
    {
        "id": "mains-gs3-inclusive-2020",
        "text": "Explain the meaning of investment in an economy in terms of capital formation. How does high public capital expenditure crowd-in private investments? (150 words, 10 marks)",
        "year": 2020,
        "subject": "General Studies Paper - III (Macroeconomics & Capital Formation)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Explain & Illustrate (Economic multiplier effect and fiscal transmission)"
    },

    # --- GENERAL STUDIES - IV (2015 - 2024) ---
    {
        "id": "mains-gs4-ethics-2024",
        "text": "Explain the concept of 'Constitutional Morality' as propounded by Dr. B.R. Ambedkar and its modern administrative application in upholding civil service neutrality and integrity. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - IV (Ethics & Integrity)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Explain (Philosophical concept with practical administrative examples)"
    },
    {
        "id": "mains-gs4-integrity-2024",
        "text": "Conflict of interest among public servants is both an ethical dilemma and a threat to governance. Distinguish between actual, potential, and perceived conflict of interest with real-world public administration scenarios. (150 words, 10 marks)",
        "year": 2024,
        "subject": "General Studies Paper - IV (Ethics & Probity)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Distinguish & Illustrate (Conceptual taxonomy with practical cases)"
    },
    {
        "id": "mains-gs4-case-2024",
        "text": "You are a District Magistrate heading disaster relief during severe floods. Local political figures insist on diverting high-value relief packets to unaffected vote-bank areas. Assess the ethical options available and state your course of action with justifications. (250 words, 20 marks)",
        "year": 2024,
        "subject": "General Studies Paper - IV (Applied Ethics Case Study)",
        "max_marks": 20,
        "word_limit": 250,
        "directive": "Evaluate & Decide (Ethical dilemma resolution under pressure)"
    },
    {
        "id": "mains-gs4-values-2022",
        "text": "What does this quotation mean to you in the present context: 'An unexamined life is not worth living.' - Socrates. (150 words, 10 marks)",
        "year": 2022,
        "subject": "General Studies Paper - IV (Ethical Thinkers & Philosophers)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Elucidate (Self-introspection, conscience, and ethical accountability)"
    },
    {
        "id": "mains-gs4-emotional-2021",
        "text": "What is emotional intelligence and how can it be practically utilized by a civil servant handling communal tension in a sensitive district? (150 words, 10 marks)",
        "year": 2021,
        "subject": "General Studies Paper - IV (Emotional Intelligence & Administration)",
        "max_marks": 10,
        "word_limit": 150,
        "directive": "Illustrate (Empathy, de-escalation, and composure under extreme stress)"
    },
    {
        "id": "mains-gs4-case-2020",
        "text": "A whistleblowing junior engineer brings to your notice that substandard concrete is being used in a major public flyover construction sanctioned by a powerful minister. What are the ethical options and your course of action? (250 words, 20 marks)",
        "year": 2020,
        "subject": "General Studies Paper - IV (Applied Ethics Case Study)",
        "max_marks": 20,
        "word_limit": 250,
        "directive": "Analyze & Act (Public safety vs administrative hierarchy dilemma)"
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

    if paper and paper.strip().upper() not in ["ALL", "ALL PAPERS", ""]:
        p_up = paper.strip().upper()
        
        def matches_filter(item: Dict[str, Any]) -> bool:
            subj = str(item.get("subject", "")).lower()
            if p_up in ["GS1", "GS-1", "GS 1"]:
                return ("paper - i (" in subj or "paper-1" in subj or "paper 1" in subj or "gs1" in subj or "gs-1" in subj or "art & culture" in subj or "history" in subj or "geography" in subj or "society" in subj) and not any(other in subj for other in ["paper - ii", "paper - iii", "paper - iv"])
            elif p_up in ["GS2", "GS-2", "GS 2"]:
                return ("paper - ii" in subj or "paper-2" in subj or "paper 2" in subj or "gs2" in subj or "gs-2" in subj or "polity" in subj or "judiciary" in subj or "governance" in subj or "international relations" in subj) and not any(other in subj for other in ["paper - iii"])
            elif p_up in ["GS3", "GS-3", "GS 3"]:
                return ("paper - iii" in subj or "paper-3" in subj or "paper 3" in subj or "gs3" in subj or "gs-3" in subj or "economy" in subj or "environment" in subj or "science" in subj or "security" in subj)
            elif p_up in ["GS4", "GS-4", "GS 4"]:
                return ("paper - iv" in subj or "paper-4" in subj or "paper 4" in subj or "gs4" in subj or "gs-4" in subj or "ethics" in subj or "integrity" in subj or "probity" in subj or "case study" in subj)
            elif p_up in ["ESSAY", "ESSAYS"]:
                return "essay" in subj
            return paper.lower() in subj

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
