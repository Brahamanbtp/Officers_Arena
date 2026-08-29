import math
from typing import List, Dict, Any, Tuple

class StrategistEngine:
    @staticmethod
    def get_quadrant(priority: float, mastery: float) -> str:
        """
        Maps a subtopic to one of four strategy quadrants:
        Q1 (Critical Gaps): High Priority (>= 0.5) / Low Mastery (< 0.5)
        Q2 (Refinement): High Priority (>= 0.5) / High Mastery (>= 0.5)
        Q3 (Low ROI): Low Priority (< 0.5) / Low Mastery (< 0.5)
        Q4 (Over-studied): Low Priority (< 0.5) / High Mastery (>= 0.5)
        """
        if priority >= 0.5:
            return "Q1" if mastery < 0.5 else "Q2"
        else:
            return "Q3" if mastery < 0.5 else "Q4"

    @staticmethod
    def generate_explanation(topic_name: str, priority: float, mastery: float, drift: float) -> str:
        """
        Generates Explainable AI (XAI) natural language logic for why the topic is categorized.
        Uses poisson_rotation_factor, trend_analysis_score, and current_mastery_pct.
        """
        trend_analysis_score = priority
        current_mastery_pct = mastery * 100.0
        
        # Estimate Poisson rotation factor based on priority and drift
        # High priority + high drift implies frequent rotation
        poisson_rotation_factor = round(0.5 + (priority * 0.8) + (drift * 0.4), 2)
        
        if priority >= 0.5 and mastery < 0.5:
            return (
                f"Topic '{topic_name}' exhibits a high trend analysis score of {trend_analysis_score:.2f} "
                f"and a Poisson rotation factor of {poisson_rotation_factor:.2f}, indicating extreme relevance. "
                f"Your current mastery is low ({current_mastery_pct:.1f}%), creating a critical cognitive gap."
            )
        elif priority >= 0.5 and mastery >= 0.5:
            return (
                f"Topic '{topic_name}' remains highly relevant with a trend analysis score of {trend_analysis_score:.2f} "
                f"and a Poisson rotation factor of {poisson_rotation_factor:.2f}. "
                f"Your current mastery of {current_mastery_pct:.1f}% is solid; proceed with targeted refinement."
            )
        elif priority < 0.5 and mastery < 0.5:
            return (
                f"Topic '{topic_name}' has low exam priority (trend: {trend_analysis_score:.2f}, Poisson rotation: {poisson_rotation_factor:.2f}). "
                f"Since your current mastery is {current_mastery_pct:.1f}%, this represents a low ROI focus area."
            )
        else:
            return (
                f"Topic '{topic_name}' has low exam priority (trend: {trend_analysis_score:.2f}) "
                f"but you possess a high mastery of {current_mastery_pct:.1f}%. "
                f"Continuing to study this topic represents an over-studied state with diminishing returns."
            )

    @staticmethod
    def distribute_hours(available_hours: float, quadrants: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """
        Distributes hours:
        50% to Q1 (Critical Gaps)
        25% to Q2 (Refinement)
        25% to Mock Tests / Revision
        """
        q1_time = available_hours * 0.50
        q2_time = available_hours * 0.25
        revision_time = available_hours * 0.25

        schedule = []
        
        # Q1 Focus
        q1_items = quadrants.get("Q1", [])
        if q1_items and q1_time > 0:
            time_per_item = q1_time / len(q1_items[:3]) # Limit to top 3
            for item in q1_items[:3]:
                schedule.append({
                    "activity": f"Deep Focus: {item['topic_name']}",
                    "duration_hours": round(time_per_item, 2),
                    "description": "Target critical gaps, review definitions, and answer level-matched questions.",
                    "quadrant": "Q1"
                })
        elif q1_time > 0:
            # If Q1 is empty, reallocate to Q2
            q2_time += q1_time

        # Q2 Focus
        q2_items = quadrants.get("Q2", [])
        if q2_items and q2_time > 0:
            time_per_item = q2_time / len(q2_items[:2]) # Limit to top 2
            for item in q2_items[:2]:
                schedule.append({
                    "activity": f"Targeted Refinement: {item['topic_name']}",
                    "duration_hours": round(time_per_item, 2),
                    "description": "Refine complex sub-concepts, tackle hard distractors, and review nuances.",
                    "quadrant": "Q2"
                })
        elif q2_time > 0:
            revision_time += q2_time

        # Revision & Mock Focus
        if revision_time > 0:
            schedule.append({
                "activity": "Cognitive Mock Exam & Spaced Repetition",
                "duration_hours": round(revision_time, 2),
                "description": "Take an adaptive micro-mock test and clear the SRS due queue.",
                "quadrant": "Q3/Q4"
            })

        return schedule
