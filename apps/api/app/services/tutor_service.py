import os
import json
import logging
from typing import Optional
import httpx
from dotenv import load_dotenv

load_dotenv("apps/api/.env")

logger = logging.getLogger("services.tutor")

class TutorService:
    @staticmethod
    def get_prompt_for_theta(question: str, correct: str, selected: str, theta: float) -> str:
        """
        Dynamically adapts prompt based on student theta level.
        """
        base_context = (
            f"Question: {question}\n"
            f"Correct Answer: {correct}\n"
            f"Student Selected: {selected}\n"
            f"Student Theta (Ability estimate): {theta:.2f}\n"
        )
        
        if theta < -1.0:
            # Beginner
            instruction = (
                "The student has a beginner ability level (theta < -1.0). "
                "Explain the correct answer like they are a beginner. Focus on defining terms, basic concepts, "
                "and why the correct answer is logically right in a simple and encouraging tone. Do not use overly advanced jargon. "
                "Never give the direct answer immediately. Guide the student to the logic first. "
                "If the question involves a Map (MapViewer), refer to specific coordinates or landmarks."
            )
        elif -1.0 <= theta <= 1.0:
            # Intermediate
            instruction = (
                "The student has an intermediate ability level (-1.0 <= theta <= 1.0). "
                "Explain the logical links between the concepts in the question. Show how one concept leads to another "
                "and why the selected answer was incorrect compared to the correct choice. "
                "Never give the direct answer immediately. Guide the student to the logic first. "
                "If the question involves a Map (MapViewer), refer to specific coordinates or landmarks."
            )
        else:
            # Advanced
            instruction = (
                "The student has a highly advanced ability level (theta > 1.0). "
                "Skip all basic explanations and definitions. Directly target the subtle nuances, edge cases, "
                "and explain precisely why the selected incorrect option is a common distractor/trap, "
                "and what advanced reasoning dictates the correct answer choice. "
                "Never give the direct answer immediately. Guide the student to the logic first. "
                "If the question involves a Map (MapViewer), refer to specific coordinates or landmarks."
            )
            
        return f"{base_context}\nInstruction: {instruction}\nExplanation:"

    @classmethod
    async def generate_explanation(
        cls,
        question_text: str,
        correct_answer: str,
        student_answer: str,
        theta: float
    ) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return cls._generate_fallback_explanation(question_text, correct_answer, student_answer, theta)
            
        try:
            prompt = cls.get_prompt_for_theta(question_text, correct_answer, student_answer, theta)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 800
                }
            }

            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()

            return cls._generate_fallback_explanation(question_text, correct_answer, student_answer, theta)
        except Exception as e:
            logger.warning("Gemini explanation call failed, using fallback: %s", e)
            return f"{cls._generate_fallback_explanation(question_text, correct_answer, student_answer, theta)}\n\n*(Note: AI tutor service is running in local heuristic mode)*"

    @staticmethod
    def _generate_fallback_explanation(question: str, correct: str, selected: str, theta: float) -> str:
        if theta < -1.0:
            return (
                f"### Beginner Explanation\n"
                f"The correct option is **{correct}**.\n\n"
                f"**Definitions & Concepts:**\n"
                f"- This question tests foundational terminology. Start by reviewing the core definitions in the stem.\n"
                f"- Ground each option against standard textbook principles before selecting."
            )
        elif -1.0 <= theta <= 1.0:
            return (
                f"### Intermediate Logical Breakdown\n"
                f"The correct option is **{correct}**, while you selected **{selected}**.\n\n"
                f"**Logical Connectivity:**\n"
                f"- Connecting terms: Notice how the primary concept directly implies the correct choice.\n"
                f"- Process of elimination: Option {selected} fails under scrutiny because it lacks statutory or empirical support."
            )
        else:
            return (
                f"### Advanced Nuance & Distractor Analysis\n"
                f"The correct option is **{correct}** (Selected: **{selected}**).\n\n"
                f"**Nuance & Trap Analysis:**\n"
                f"- Option {selected} is a subtle distractor designed to appeal to general intuition but failing on specific exceptions.\n"
                f"- Verify the exact constitutional provisions or landmark precedents that establish {correct}."
            )
