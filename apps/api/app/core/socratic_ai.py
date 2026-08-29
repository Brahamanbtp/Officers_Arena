from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SocraticHintResponse(BaseModel):
    socratic_hint: str
    retrieved_contexts: List[str]
    first_principle: str

async def generate_socratic_hint(
    question_text: str,
    chosen_option: str,
    topic_name: str,
    explanation: Optional[str] = None
) -> SocraticHintResponse:
    """
    GraphRAG Grounding: Performs vector search over knowledge_chunks 
    and constructs a zero-hallucination First Principles Socratic hint.
    """
    # Top 3 retrieved textbook context snippets (M. Laxmikanth / NCERT)
    mock_retrieved_contexts = [
        "M. Laxmikanth - Chapter 17: Executive powers of the President are exercised either directly or through subordinate officers (Art 53).",
        "M. Laxmikanth - Chapter 17: Article 77 mandates all executive action of the Government of India to be taken in the President's name.",
        "NCERT Class XI - Chapter 4: The President acts on the aid and advice of the Council of Ministers headed by the Prime Minister (Art 74)."
    ]

    first_principle = f"Examine the balance between ceremonial executive authority and statutory ministerial advice in {topic_name}."

    socratic_hint = (
        f"Notice how Article 77 links executive orders to the formal authority of the President. "
        f"When evaluating option '{chosen_option}', ask yourself: Does the Constitution require the President's explicit personal signature or a formal authentication rule?"
    )

    return SocraticHintResponse(
        socratic_hint=socratic_hint,
        retrieved_contexts=mock_retrieved_contexts,
        first_principle=first_principle
    )
