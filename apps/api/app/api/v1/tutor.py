import os
import uuid
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.models.database import Syllabus, Questions
from app.models.student_stats import TopicMastery, TutorChatSession
from app.models.tutor_schemas import (
    SourceCitation, TutorResponse, ErrorAnalysis,
    ExplainRequest, AnalyzeErrorRequest, TutorChatRequest
)
from ml.tutor.rag_chain import GraphRAGRetriever, FALLBACK_RESPONSE
from ml.tutor.error_analyzer import ErrorAnalyzer
from ml.tutor.prompts import SYSTEM_PROMPT, build_tutor_prompt
from app.services.rag_service import RAGService

router = APIRouter()

def clean_latex_backslashes(text: str) -> str:
    """
    Ensures all LaTeX backslashes are escaped (e.g. \\frac{a}{b}) for react-katex.
    """
    import re
    # Match standard LaTeX commands like \sqrt, \frac, \theta, \pm, \alpha etc.
    pattern = r'\\(sqrt|frac|theta|pm|alpha|beta|gamma|delta|pi|sigma|infty|times|div|sum|int|c?dot|le|ge|ne|eq)'
    return re.sub(pattern, r'\\\\\1', text)

def sanitize_chat_message(message: str) -> str:
    """
    Sanitizes chat input to prevent Prompt Injection and XSS attacks.
    """
    import re
    # 1. XSS protection: strip HTML tag patterns
    clean = re.sub(r"<[^>]*>", "", message)
    clean = re.sub(r"javascript:", "", clean, flags=re.IGNORECASE)
    clean = re.sub(r"on\w+\s*=", "", clean, flags=re.IGNORECASE)

    # 2. Prompt injection heuristics: identify instruction-override commands
    injection_patterns = [
        r"ignore\s+(above|previous|prior|all)\s+(instructions|directives|prompts|rules)",
        r"system\s+(override|reset|restart)",
        r"you\s+must\s+now\s+act\s+as",
        r"bypass\s+safety\s+guardrails",
        r"forget\s+your\s+role",
        r"reveal\s+(your|the)\s+(system\s+prompt|instructions|directive)"
    ]
    for pattern in injection_patterns:
        if re.search(pattern, clean, re.IGNORECASE):
            return "[System Warning: Prompt Injection Attempt Neutralized] " + clean

    return clean.strip()



@router.post(
    "/api/v1/tutor/explain",
    response_model=TutorResponse,
    summary="Get Socratic pedagogical explanation",
    description="Retrieves textbook passages and uses a student digital twin mastery level to generate customized tutoring hints."
)
async def explain_question(
    request: ExplainRequest,
    db: AsyncSession = Depends(get_async_session)
):
    try:
        question_id = uuid.UUID(request.question_id)
        user_id = request.user_id
        
        # 1. Fetch Question
        q_stmt = select(Questions).where(Questions.id == question_id)
        q_res = await db.execute(q_stmt)
        question = q_res.scalars().first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")

        # 2. Fetch User Mastery for specific subtopic name
        subtopic_name = "Indian Polity"
        if question.subtopic_id:
            syl_stmt = select(Syllabus).where(Syllabus.id == question.subtopic_id)
            syl_res = await db.execute(syl_stmt)
            syl = syl_res.scalars().first()
            if syl:
                subtopic_name = syl.name

        # 3. RAGService fetches mastery score & prompt instructions
        stmt = select(TopicMastery).where(
            TopicMastery.user_id == user_id,
            TopicMastery.topic_name == subtopic_name
        )
        try:
            res = await db.execute(stmt)
            record = res.scalars().first()
            score = record.p_mastery if record else 0.15
        except Exception:
            score = 0.15

        # 4. Retrieve Context via GraphRAG and get syllabus graph path
        context_docs, confidence_score = await GraphRAGRetriever.retrieve(
            db, query=question.text, question_id=question_id, limit=3
        )

        # 5. Strict Guardrail Check: distance > 0.3 (similarity is < 70%)
        if confidence_score < 0.7:
            return TutorResponse(
                explanation=FALLBACK_RESPONSE,
                sources=[],
                confidence_score=confidence_score,
                suggested_next_steps=["Check your reference textbooks for this specific topic."]
            )

        # 6. Format prompt and call LLM
        context_text = "\n\n".join([f"[{d['source']}]: {d['content']}" for d in context_docs if d["type"] != "hierarchy"])
        hierarchy_path = next((d["content"] for d in context_docs if d["type"] == "hierarchy"), "")
        
        prompt = build_tutor_prompt(
            context=context_text,
            path=hierarchy_path,
            mastery_level=score,
            question_text=question.text,
            options_text=str(question.options)
        )

        explanation_text = ""
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                import google.generativeai as genai  # type: ignore
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=SYSTEM_PROMPT)
                response = await model.generate_content_async(prompt)
                explanation_text = response.text.strip()
            except Exception as e:
                explanation_text = f"Failed to call AI Tutor API: {str(e)}"
        
        if not explanation_text or "Failed to call AI Tutor API" in explanation_text:
            explanation_text = generate_local_socratic_explanation(question, context_docs, score)

        # Ensure LaTeX formulas are clean and properly escaped
        explanation_text = clean_latex_backslashes(explanation_text)

        # Map to Pydantic SourceCitation models
        citations = []
        for d in context_docs:
            if d["type"] != "hierarchy":
                citations.append(SourceCitation(
                    id=str(uuid.uuid4()),
                    source_book=d["source"],
                    page_number=100,  # default placeholder page
                    chapter_title="Core Reference",
                    text_chunk=d["content"]
                ))

        return TutorResponse(
            explanation=explanation_text,
            sources=citations,
            confidence_score=confidence_score,
            suggested_next_steps=["Attempt the question again with the new hints.", "Review the related syllabus hierarchy path."]
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tutoring explanation: {str(e)}")


@router.post(
    "/api/v1/tutor/analyze-error",
    response_model=ErrorAnalysis,
    summary="Pedagogical step-wise error analysis",
    description="Identifies statement-level issues, calculation faults, or conceptual traps from the user's selected choice."
)
async def analyze_error(
    request: AnalyzeErrorRequest,
    db: AsyncSession = Depends(get_async_session)
):
    try:
        question_id = uuid.UUID(request.question_id)
        user_answer = request.user_answer
        user_id = request.user_id
        
        # 1. Fetch Question
        q_stmt = select(Questions).where(Questions.id == question_id)
        q_res = await db.execute(q_stmt)
        question = q_res.scalars().first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")

        # Prepare metadata context for analysis (numerical or statement-based if available)
        meta = {}
        if question.exam_type == "CDS":
            import re
            user_opt_text = str(question.options.get(user_answer, ""))
            correct_opt_text = str(question.options.get(question.correct_answer, ""))
            user_nums = [float(x) for x in re.findall(r'[-+]?\d*\.\d+|\d+', user_opt_text)]
            correct_nums = [float(x) for x in re.findall(r'[-+]?\d*\.\d+|\d+', correct_opt_text)]
            if user_nums and correct_nums:
                meta["user_answer_value"] = user_nums[0]
                meta["correct_answer_value"] = correct_nums[0]
                meta["distractor_values"] = [user_nums[0]] if user_answer != question.correct_answer else []

        # 2. Run Classification
        diagnosis = ErrorAnalyzer.classify_error(
            question_text=question.text,
            options=question.options,
            user_selected=user_answer,
            correct_answer=question.correct_answer,
            exam_type=question.exam_type,
            metadata=meta
        )

        return ErrorAnalysis(
            error_category=diagnosis["error_category"],
            identified_gap=diagnosis["identified_gap"],
            recommendation=diagnosis["recommendation"]
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run error breakdown: {str(e)}")


@router.post(
    "/api/v1/tutor/chat",
    summary="Stateful Socratic tutoring chat",
    description="Engages in dialog supporting LaTeX equations and book citations, utilizing sliding window memory (k=5)."
)
async def tutor_chat(
    request: TutorChatRequest,
    db: AsyncSession = Depends(get_async_session)
):
    try:
        question_id = uuid.UUID(request.question_id)
        user_id = request.user_id
        message = sanitize_chat_message(request.message)
        
        # 1. Fetch Question
        q_stmt = select(Questions).where(Questions.id == question_id)
        q_res = await db.execute(q_stmt)
        question = q_res.scalars().first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")

        # 2. Fetch or create stateful session
        session_stmt = select(TutorChatSession).where(
            TutorChatSession.user_id == user_id,
            TutorChatSession.question_id == question_id
        )
        session_res = await db.execute(session_stmt)
        session = session_res.scalars().first()

        if not session:
            session = TutorChatSession(
                user_id=user_id,
                question_id=question_id,
                messages="[]"
            )
            db.add(session)
            await db.flush()

        messages_history = json.loads(session.messages)

        # 3. Retrieve Context based on user's query
        context_docs, confidence_score = await GraphRAGRetriever.retrieve(
            db, query=message, question_id=question_id, limit=3
        )
        context_text = "\n\n".join([f"[{d['source']}]: {d['content']}" for d in context_docs if d["type"] != "hierarchy"])

        # 4. Implement Sliding Memory Window (k=5 turns = 10 messages)
        history_window = messages_history[-10:] if len(messages_history) > 10 else messages_history
        history_context = ""
        for msg in history_window:
            history_context += f"{msg['role'].capitalize()}: {msg['content']}\n"

        # 5. Build full tutor query prompt
        tutor_prompt = f"""--- RETRIEVED CONTEXT ---
{context_text}

--- QUESTION STEM ---
{question.text}

--- CONVERSATION HISTORY (LAST 5 TURNS) ---
{history_context}

User's New Message: {message}
"""

        api_response = ""
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                import google.generativeai as genai  # type: ignore
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=SYSTEM_PROMPT)
                response = await model.generate_content_async(tutor_prompt)
                api_response = response.text.strip()
            except Exception as e:
                api_response = f"Failed to call chat engine: {str(e)}"
        
        # Fallback offline response
        if not api_response or "Failed to call chat engine" in api_response:
            source_names = ", ".join([d["source"] for d in context_docs if d["type"] != "hierarchy"])
            api_response = (
                f"That is an interesting question. Looking at standard textbook materials ({source_names}), we can infer that: \n"
                f"> \"{context_docs[0]['content'][:300] if context_docs else 'Please recheck standard definitions.'}...\" \n\n"
                f"How does this relate to what you asked? Let's connect these concepts back to the option choices."
            )

        api_response = clean_latex_backslashes(api_response)

        # Save turns back to database history
        messages_history.append({"role": "user", "content": message})
        messages_history.append({"role": "assistant", "content": api_response})
        
        session.messages = json.dumps(messages_history)
        session.last_updated = datetime.utcnow()
        db.add(session)
        await db.commit()

        # Stream generator for real-time typing effects
        async def response_streamer():
            # Stream in chunks of words / characters
            chunk_size = 5
            for i in range(0, len(api_response), chunk_size):
                yield api_response[i:i+chunk_size]
                await asyncio.sleep(0.01)

        return StreamingResponse(response_streamer(), media_type="text/plain")

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tutor chat failed: {str(e)}")


def generate_local_socratic_explanation(question: Questions, context_docs: List[Dict[str, Any]], mastery: float) -> str:
    """
    Fallback offline local Socratic explanation builder grounded in retrieved textbook sources.
    """
    source_names = ", ".join([d["source"] for d in context_docs if d["type"] != "hierarchy"])
    doc_content = context_docs[0]["content"] if context_docs else ""
    source_citation = f"[{context_docs[0]['source']}]" if context_docs else ""

    if mastery < 0.4:
        return (
            f"Let's break this down using a simple analogy. Think of it like a vegetable market where prices rise because of high demand.\n\n"
            f"Based on our textbooks ({source_names}), the key rule is: \n"
            f"> \"{doc_content[:200]}...\" {source_citation}\n\n"
            f"Look at the options in the question. Can you identify which one matches this core definition? "
            f"Think about the constitutional limits and try to eliminate choices that clearly violate them."
        )
    else:
        return (
            f"Let's analyze the deep constitutional nuances and exceptions in this question.\n\n"
            f"Under standard source materials ({source_names}), the specific framework is:\n"
            f"> \"{doc_content[:450]}...\" {source_citation}\n\n"
            f"Notice the exact statutory exceptions or criteria that differentiate these options. Which option represents the true exception?"
        )
