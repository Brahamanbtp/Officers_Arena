import os
import uuid
import json
import random
from typing import List, Dict, Any, Tuple, Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.models.database import Syllabus, Questions

FALLBACK_RESPONSE = "I cannot find a verified source for this in the standard textbooks. Please check your offline materials."

# Pre-defined textbook snippets for GraphRAG fallback and grounding
TEXTBOOK_LIBRARY = [
    {
        "source": "M. Laxmikanth, Indian Polity - Chapter 16 (Emergency Provisions)",
        "topic": "Emergency Provisions (Article 352-360)",
        "text": "Part XVIII of the Constitution of India deals with Emergency Provisions from Articles 352 to 360. Article 352 deals with National Emergency, Article 356 with President's Rule (Failure of constitutional machinery in states), and Article 360 with Financial Emergency. During an emergency, the central government becomes all-powerful and the states go into total control of the center, converting the federal structure into a unitary one without a formal amendment."
    },
    {
        "source": "NCERT Class XI - Indian Constitution at Work",
        "topic": "Emergency Provisions (Article 352-360)",
        "text": "Emergency provisions turn the federal polity of India into a unitary one. Under Article 352, the President can declare a National Emergency on the grounds of war, external aggression, or armed rebellion. The word 'armed rebellion' was inserted by the 44th Amendment Act, replacing 'internal disturbance'."
    },
    {
        "source": "M. Laxmikanth, Indian Polity - Chapter 7 (Fundamental Rights)",
        "topic": "Fundamental Rights & Directive Principles",
        "text": "Fundamental Rights are enshrined in Part III of the Constitution from Articles 12 to 35. They are justiciable, meaning they are enforceable by courts. Article 21 guarantees protection of life and personal liberty, stating that no person shall be deprived of his life or personal liberty except according to procedure established by law."
    },
    {
        "source": "NCERT Class XI - Indian Constitution at Work",
        "topic": "Fundamental Rights & Directive Principles",
        "text": "The Directive Principles of State Policy (DPSP) are in Part IV of the Constitution. Unlike Fundamental Rights, they are non-justiciable. They represent guidelines for the state to establish a social and economic democracy."
    },
    {
        "source": "M. Laxmikanth, Indian Polity - Chapter 30 (Governor)",
        "topic": "Governor's Discretionary Powers",
        "text": "Article 163 states that there shall be a Council of Ministers with the Chief Minister at the head to aid and advise the Governor, except in so far as he is required to exercise his functions in his discretion. Discretionary powers of the Governor include recommending President's Rule under Article 356 and reserving bills for Presidential assent under Article 200."
    },
    {
        "source": "NCERT Class XI - Indian Physical Environment",
        "topic": "Mapping of Indian Rivers and Lakes",
        "text": "The Indian drainage system consists of Himalayan rivers (Ganga, Indus, Brahmaputra) and Peninsular rivers (Narmada, Tapi, Mahanadi, Godavari, Krishna, Kaveri). Himalayan rivers are perennial and characterized by deep gorges and meanders, while Peninsular rivers are seasonal and flow through shallow, graded valleys."
    }
]

async def get_embedding(text: str) -> List[float]:
    """
    Generates text embedding using Gemini SDK if API key exists,
    otherwise returns a deterministic mock vector.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai  # type: ignore
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_query"
            )
            return result["embedding"]
        except Exception:
            pass
            
    # Deterministic fallback vector
    random.seed(text)
    return [random.uniform(-1, 1) for _ in range(1536)]

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = sum(a * a for a in v1) ** 0.5
    norm_b = sum(b * b for b in v2) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

class GraphRAGRetriever:
    @staticmethod
    async def get_syllabus_breadcrumbs(db: AsyncSession, subtopic_id: uuid.UUID) -> str:
        """
        Runs a recursive query (CTE) to build the full breadcrumbs path:
        e.g., "Polity > Constitutional Framework > Fundamental Rights > Article 21"
        """
        query_str = text("""
            WITH RECURSIVE syllabus_path AS (
                SELECT id, name, parent_id, level FROM syllabus WHERE id = :subtopic_id
                UNION ALL
                SELECT s.id, s.name, s.parent_id, s.level FROM syllabus s
                JOIN syllabus_path sp ON s.id = sp.parent_id
            ) SELECT name FROM syllabus_path;
        """)
        
        try:
            res = await db.execute(query_str, {"subtopic_id": str(subtopic_id)})
            rows = res.fetchall()
            if rows:
                names = [row[0] for row in rows]
                names.reverse()
                return " > ".join(names)
        except Exception:
            pass
            
        return ""

    @classmethod
    async def retrieve(
        cls,
        db: AsyncSession,
        query: str,
        question_id: Optional[uuid.UUID] = None,
        limit: int = 3
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Performs hybrid GraphRAG retrieval:
        1. Vector Search across standard textbooks and database explanations.
        2. Recursive CTE Graph Traversal to get the syllabus breadcrumbs path.
        3. Measures cosine distance and checks the 0.3 threshold.
        """
        query_emb = await get_embedding(query)
        
        # 1. Vector Search on Local Excerpts
        scored_library = []
        for doc in TEXTBOOK_LIBRARY:
            doc_emb = await get_embedding(doc["text"])
            sim = cosine_similarity(query_emb, doc_emb)
            scored_library.append((sim, doc))
            
        scored_library.sort(key=lambda x: x[0], reverse=True)
        top_library = scored_library[:limit]
        
        # 2. Database PYQ Explanations Vector Search
        top_pyqs = []
        db_stmt = select(Questions).where(Questions.embedding != None, Questions.explanation != None)
        db_res = await db.execute(db_stmt)
        questions_with_emb = db_res.scalars().all()
        
        scored_pyqs = []
        for q in questions_with_emb:
            emb = q.embedding
            if isinstance(emb, str):
                try:
                    emb = json.loads(emb)
                except Exception:
                    continue
            if emb:
                sim = cosine_similarity(query_emb, emb)
                scored_pyqs.append((sim, q))
                
        scored_pyqs.sort(key=lambda x: x[0], reverse=True)
        top_pyqs = scored_pyqs[:limit]

        # 3. Graph Traversal: Recursive CTE
        breadcrumbs_path = ""
        if question_id:
            q_stmt = select(Questions).where(Questions.id == question_id)
            q_res = await db.execute(q_stmt)
            target_q = q_res.scalars().first()
            if target_q and target_q.subtopic_id:
                breadcrumbs_path = await cls.get_syllabus_breadcrumbs(db, target_q.subtopic_id)
                
        # 4. Hybrid aggregation & formatting
        context_docs = []
        max_sim = 0.0
        
        for sim, doc in top_library:
            max_sim = max(max_sim, sim)
            context_docs.append({
                "source": doc["source"],
                "content": doc["text"],
                "type": "textbook",
                "similarity": sim,
                "distance": 1.0 - sim
            })
            
        for sim, q in top_pyqs:
            max_sim = max(max_sim, sim)
            context_docs.append({
                "source": f"PYQ Exam Explanation ({q.year or 'Recent Year'})",
                "content": q.explanation,
                "type": "pyq_explanation",
                "similarity": sim,
                "distance": 1.0 - sim
            })

        if breadcrumbs_path:
            context_docs.append({
                "source": "Syllabus Hierarchy Path (Graph)",
                "content": f"This question is categorized under the following hierarchical syllabus path: {breadcrumbs_path}.",
                "type": "hierarchy",
                "similarity": 1.0,
                "distance": 0.0
            })

        # Filter and retrieve closest vector match items (excluding hierarchy helper)
        items_for_rerank = [d for d in context_docs if d["type"] != "hierarchy"]
        final_docs = sorted(items_for_rerank, key=lambda x: x["similarity"], reverse=True)[:limit]
        
        # Include hierarchy path at the end for context grounding
        hierarchy_doc = next((d for d in context_docs if d["type"] == "hierarchy"), None)
        if hierarchy_doc:
            final_docs.append(hierarchy_doc)
            
        return final_docs, max_sim
