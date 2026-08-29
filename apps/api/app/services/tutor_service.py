import os
import google.generativeai as genai
from typing import Optional

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
            # Fallback explanation if API key is not present
            return cls._generate_fallback_explanation(question_text, correct_answer, student_answer, theta)
            
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = cls.get_prompt_for_theta(question_text, correct_answer, student_answer, theta)
            
            # Since generating content can be blocking, we run it in an executor or call async if available.
            # google-generativeai supports async calls: generate_content_async
            response = await model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            # Fallback on API errors
            return f"{cls._generate_fallback_explanation(question_text, correct_answer, student_answer, theta)}\n\n*(Note: AI tutor service is currently running in local fallback mode: {str(e)})*"

    @staticmethod
    def _generate_fallback_explanation(question: str, correct: str, selected: str, theta: float) -> str:
        if theta < -1.0:
            return (
                f"### Beginner Explanation\n"
                f"The correct option is **{correct}**.\n\n"
                f"**Definitions & Concepts:**\n"
                f"- This question tests basic terms. Always start by verifying the definitions of key terms in the stem.\n"
                f"- Make sure to write down definitions for reference before analyzing choices."
            )
        elif -1.0 <= theta <= 1.0:
            return (
                f"### Intermediate Logical Breakdown\n"
                f"The correct option is **{correct}**, while you selected **{selected}**.\n\n"
                f"**Logical Connectivity:**\n"
                f"- Connecting terms: Notice how the core concept directly implies the correct choice.\n"
                f"- Process of elimination: Option {selected} fails under closer analysis because it lacks the necessary prerequisites."
            )
        else:
            return (
                f"### Advanced Nuance & Distractor Analysis\n"
                f"The correct option is **{correct}** (Selected: **{selected}**).\n\n"
                f"**Nuance & Trap Analysis:**\n"
                f"- The option {selected} functions as a classic cognitive distractor, appealing to general terms but failing on the specific legal/technical details.\n"
                f"- Note the precise statutory exceptions or edge cases that make {correct} the only valid option."
            )
