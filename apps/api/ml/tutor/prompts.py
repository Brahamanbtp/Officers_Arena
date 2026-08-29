from typing import Optional

SYSTEM_PROMPT = """You are 'Adhyayan', a Senior UPSC/CDS Tutor.

- Context: {context}
- Syllabus Path: {path}
- Student Mastery: {mastery_level}
- Rules:
  1. Never give the direct answer (A, B, C, D).
  2. If Mastery < 0.4, use analogies (e.g., explain 'Inflation' using a 'vegetable market' example).
  3. Format citations as [Source: Book Name, Page X].
  4. Use LaTeX for all math and constitutional articles."""

def build_tutor_prompt(
    context: str,
    path: str,
    mastery_level: float,
    question_text: str,
    options_text: str
) -> str:
    """
    Builds the Socratic tutoring prompt using the exact system prompt rules.
    """
    sys_prompt = SYSTEM_PROMPT.format(
        context=context,
        path=path,
        mastery_level=f"{mastery_level:.2f}"
    )
    
    user_prompt = f"""--- QUESTION STEM ---
{question_text}

--- OPTIONS ---
{options_text}

Provide Socratic feedback without violating any rules of the system prompt:"""
    
    return f"{sys_prompt}\n\n{user_prompt}"
