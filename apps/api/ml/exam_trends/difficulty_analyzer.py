import re
import numpy as np
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("ml.exam_trends.difficulty")

class DifficultyEstimator:
    """
    DifficultyEstimator analyzes the linguistic complexity of question stems 
    and the semantic overlap/similarity of distractor options (Trap Density).
    """

    @staticmethod
    def count_syllables(word: str) -> int:
        """
        Estimates the number of syllables in a word using basic linguistic rules.
        """
        word = word.lower()
        if len(word) <= 3:
            return 1
        # Basic heuristic syllable counting
        count = len(re.findall(r'[aeiouy]+', word))
        if word.endswith('e'):
            count -= 1
        if count <= 0:
            count = 1
        return count

    @classmethod
    def calculate_flesch_kincaid_grade(cls, text: str) -> float:
        """
        Calculates the Flesch-Kincaid Grade Level:
        Grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
        """
        # Split text into sentences using simple punctuation checks
        sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
        words = [w for w in re.split(r'\s+', text) if w.strip()]
        
        num_sentences = max(1, len(sentences))
        num_words = max(1, len(words))
        
        total_syllables = sum(cls.count_syllables(w) for w in words)
        
        grade = 0.39 * (num_words / num_sentences) + 11.8 * (total_syllables / num_words) - 15.59
        return round(max(1.0, min(20.0, grade)), 2)

    @staticmethod
    def calculate_distractor_similarity(
        correct_vector: np.ndarray,
        distractor_vectors: List[np.ndarray]
    ) -> float:
        """
        Measures the average cosine similarity between correct answer and distractors.
        Higher values represent a higher 'Trap Density' (harder to distinguish).
        """
        if not distractor_vectors:
            return 0.0
            
        norm_correct = np.linalg.norm(correct_vector)
        if norm_correct == 0.0:
            return 0.0
            
        similarities = []
        for dist_v in distractor_vectors:
            norm_dist = np.linalg.norm(dist_v)
            if norm_dist > 0.0:
                sim = np.dot(correct_vector, dist_v) / (norm_correct * norm_dist)
                similarities.append(float(sim))
                
        return round(float(np.mean(similarities)), 4) if similarities else 0.0

    @classmethod
    def calculate_difficulty_gradient(
        cls,
        yearly_questions: Dict[int, List[Dict[str, Any]]],
        correct_vectors_by_year: Dict[int, List[np.ndarray]],
        distractor_vectors_by_year: Dict[int, List[List[np.ndarray]]]
    ) -> List[Dict[str, Any]]:
        """
        Computes the Difficulty Gradient (2009-2026) for a subject.
        Calculates linguistic grade level and trap density trends.
        """
        gradient_timeline = []
        sorted_years = sorted(yearly_questions.keys())
        
        for yr in sorted_years:
            questions = yearly_questions[yr]
            if not questions:
                continue
                
            # 1. Average Flesch-Kincaid Grade Level of question stems
            grades = [cls.calculate_flesch_kincaid_grade(q.get("text", "")) for q in questions]
            avg_grade = np.mean(grades) if grades else 5.0
            
            # 2. Average Trap Density (Distractor Similarity)
            corr_vs = correct_vectors_by_year.get(yr, [])
            dist_vs_list = distractor_vectors_by_year.get(yr, [])
            
            trap_densities = []
            for c_v, d_vs in zip(corr_vs, dist_vs_list):
                if c_v is not None and d_vs:
                    trap_densities.append(cls.calculate_distractor_similarity(c_v, d_vs))
            
            avg_trap_density = np.mean(trap_densities) if trap_densities else 0.3
            
            # Composite complexity score = (Grade_Level/20) * 0.5 + Trap_Density * 0.5
            composite_complexity = (avg_grade / 20.0) * 0.5 + avg_trap_density * 0.5
            
            gradient_timeline.append({
                "year": yr,
                "linguistic_complexity_grade": round(float(avg_grade), 2),
                "trap_density": round(float(avg_trap_density), 4),
                "composite_complexity": round(float(composite_complexity), 4)
            })
            
        return gradient_timeline
