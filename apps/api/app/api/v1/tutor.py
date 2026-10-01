import os
import uuid
import json
import asyncio
from datetime import datetime, timezone
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
from ml.tutor.prompts import SYSTEM_PROMPT, SYSTEM_PROMPT_CHAT, build_tutor_prompt
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
                model = genai.GenerativeModel("gemini-3.5-flash-lite", system_instruction=SYSTEM_PROMPT)
                response = await model.generate_content_async(prompt, request_options={"timeout": 8.0})
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
            misconception_tag=diagnosis.get("misconception_tag"),
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
        user_id = request.user_id
        message = sanitize_chat_message(request.message)

        is_general_consultation = not request.question_id

        question_id = None
        question = None
        if request.question_id:
            try:
                question_id = uuid.UUID(request.question_id)
            except ValueError:
                pass

        if not question_id:
            # Fallback: get first question to satisfy non-null DB constraint
            q_stmt = select(Questions).limit(1)
            q_res = await db.execute(q_stmt)
            question = q_res.scalars().first()
            if question:
                question_id = question.id
            else:
                question_id = uuid.UUID("00000000-0000-0000-0000-000000000000")
        else:
            q_stmt = select(Questions).where(Questions.id == question_id)
            q_res = await db.execute(q_stmt)
            question = q_res.scalars().first()
            if not question:
                # If question_id does not exist in DB, fallback
                q_stmt_any = select(Questions).limit(1)
                q_res_any = await db.execute(q_stmt_any)
                question = q_res_any.scalars().first()
                if question:
                    question_id = question.id
                else:
                    question_id = uuid.UUID("00000000-0000-0000-0000-000000000000")

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
        # For general strategic consultation, we do NOT want context from a random question explanation!
        context_docs, confidence_score = await GraphRAGRetriever.retrieve(
            db, query=message, question_id=None if is_general_consultation else question_id, limit=3
        )
        context_text = "\n\n".join([f"[{d['source']}]: {d['content']}" for d in context_docs if d["type"] != "hierarchy"])

        # 4. Implement Sliding Memory Window (k=5 turns = 10 messages)
        history_window = messages_history[-10:] if len(messages_history) > 10 else messages_history
        history_context = ""
        for msg in history_window:
            history_context += f"{msg['role'].capitalize()}: {msg['content']}\n"

        # 5. Build full tutor query prompt
        question_stem = "General strategic study advice and preparation coaching. (No specific exam question)" if is_general_consultation else (question.text if question else "")
        tutor_prompt = f"""--- RETRIEVED CONTEXT ---
{context_text}

--- QUESTION STEM ---
{question_stem}

--- CONVERSATION HISTORY (LAST 5 TURNS) ---
{history_context}

User's New Message: {message}
"""

        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                import google.generativeai as genai  # type: ignore
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-3.5-flash-lite", system_instruction=SYSTEM_PROMPT_CHAT)
                
                # Asynchronously generate streaming content
                response_stream = await model.generate_content_async(tutor_prompt, stream=True, request_options={"timeout": 8.0})
                
                async def response_streamer():
                    full_text = ""
                    try:
                        async for chunk in response_stream:
                            if chunk.text:
                                text_chunk = clean_latex_backslashes(chunk.text)
                                full_text += text_chunk
                                yield text_chunk
                    except Exception as stream_err:
                        yield f"\n[Error during stream: {str(stream_err)}]"
                    
                    # Save turns back to database history using original db session
                    try:
                        messages_history.append({"role": "user", "content": message})
                        messages_history.append({"role": "assistant", "content": full_text})
                        session.messages = json.dumps(messages_history)
                        session.last_updated = datetime.now(timezone.utc).replace(tzinfo=None)
                        db.add(session)
                        await db.commit()
                    except Exception as db_err:
                        import traceback
                        traceback.print_exc()
                
                return StreamingResponse(response_streamer(), media_type="text/plain")
            except Exception as e:
                # If stream initiation fails, fall back to offline response
                import traceback
                traceback.print_exc()

        # Intelligent query-aware fallback response
        m_lower = message.lower().strip()
        is_gibberish = len(m_lower) < 3 or m_lower in ["jbd", "asdf", "xyz", "qwerty", "test", "abc"]

        if is_gibberish:
            api_response = (
                "I couldn't identify a specific UPSC or CDS syllabus concept in your query. "
                "Could you please clarify what you would like to master? "
                "For example, you can ask about:\n"
                "• **Polity**: 'Explain Governor discretionary powers under Art. 163 vs 356'\n"
                "• **History**: 'What is the chronology of 1930–1942 Round Table Conferences & Missions?'\n"
                "• **Economy**: 'How does RBI External Benchmark Lending Rate (EBLR) work?'\n"
                "• **Strategy**: 'How should I structure my 7-day tactical revision plan?'"
            )
        elif any(k in m_lower for k in ["governor", "163", "356", "president", "emergency", "bommai", "polity"]):
            api_response = (
                "**Constitutional Analysis (Indian Polity):**\n"
                "1. **Article 163**: The Governor is bound by Council of Ministers' aid and advice except where expressly required by the Constitution to exercise discretion.\n"
                "2. **Article 200**: For state bills, the Governor cannot withhold assent indefinitely or exercise pocket veto (recent SC rulings).\n"
                "3. **Article 356**: President's Rule requires approval of both Houses of Parliament within 2 months by a simple majority, subject to strict judicial review (*S.R. Bommai*).\n\n"
                "👉 *Recommended Action:* Complete the 5-question Polity Leak drill in the Arena to solidify this concept."
            )
        elif any(k in m_lower for k in ["round table", "cripps", "poona", "chronology", "history", "gandhi"]):
            api_response = (
                "**Chronological Synthesis (Modern History):**\n"
                "1. **Nov 1930 – Jan 1931**: First Round Table Conference (Boycotted by Congress).\n"
                "2. **March 1931**: Gandhi-Irwin Pact (Civil Disobedience suspended).\n"
                "3. **Sept – Dec 1931**: Second RTC (Gandhiji attended; deadlocked on separate electorates).\n"
                "4. **Sept 1932**: Poona Pact between Gandhiji and Dr. B.R. Ambedkar (Joint electorates with reserved seats).\n"
                "5. **March 1942**: Cripps Mission offering Dominion status after WWII (rejected by both Congress and Muslim League).\n\n"
                "👉 *Revision Tip:* Target Spectrum Modern History Chapters 21–24."
            )
        elif any(k in m_lower for k in ["repo", "eblr", "mclr", "monetary", "economy", "inflation"]):
            api_response = (
                "**Macroeconomics & Monetary Policy:**\n"
                "1. **MCLR Limitation**: Internal bank cost calculation resulted in sluggish transmission where deposit rates took months to reprice.\n"
                "2. **EBLR Mandate (Oct 2019)**: Pegs floating retail loans directly to the RBI Repo Rate or Treasury Bills.\n"
                "3. **Symmetric Pass-Through**: When RBI modifies the Repo Rate, lending rates adjust within 3 months automatically.\n\n"
                "👉 *Revision Tip:* Review Ramesh Singh Chapter 7 on Banking & Monetary Policy."
            )
        elif "cds" in m_lower or any(k in m_lower for k in ["defence", "defense", "military", "inradius", "army", "navy", "air force"]):
            api_response = (
                "**Cadet Strategic Guidance (CDS Track):**\n"
                "1. **Higher Defense Management**: Understand Integrated Theatre Commands and the dual role of the Chief of Defence Staff (Permanent Chairman COSC + Secretary DMA).\n"
                "2. **Elementary Mathematics**: Prioritize Geometry (Inradius $r = \\frac{a+b-c}{2}$), Speed-Time-Distance, and Trigonometry identities.\n"
                "3. **Time Allocation**: Spend 60% of daily time solving authentic PYQ drills under strict 120-minute OMR pacing."
            )
        elif is_general_consultation:
            api_response = (
                "**Cognitive Strategic Recommendation (UPSC CSE & CDS):**\n"
                "1. **Top Priority Leaks**: Address your highest error-rate subtopics first (shown on your Strategist Dashboard).\n"
                "2. **Active Retrieval**: Use 25-question adaptive CAT sessions rather than passive textbook re-reading.\n"
                "3. **Elimination Rigor**: In Prelims/CDS MCQs, flag extreme qualifiers ('only', 'drastically', 'solely') and verify statutory vs constitutional mandates."
            )
        else:
            source_names = ", ".join([d["source"] for d in context_docs if d["type"] != "hierarchy"])
            api_response = (
                f"Looking at verified canonical textbook materials ({source_names or 'Standard Subject Manuals'}), "
                f"let's analyze the core principles related to your query:\n\n"
                f"> \"{context_docs[0]['content'][:280] if context_docs else 'Review foundational definitions and syllabus connections.'}...\"\n\n"
                f"How does this relate to your target syllabus node? Feel free to ask for a deeper pedagogical breakdown or sample MCQ."
            )
        api_response = clean_latex_backslashes(api_response)

        async def fallback_streamer():
            yield api_response
            try:
                messages_history.append({"role": "user", "content": message})
                messages_history.append({"role": "assistant", "content": api_response})
                session.messages = json.dumps(messages_history)
                session.last_updated = datetime.now(timezone.utc).replace(tzinfo=None)
                db.add(session)
                await db.commit()
            except Exception as db_err:
                import traceback
                traceback.print_exc()

        return StreamingResponse(fallback_streamer(), media_type="text/plain")

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
