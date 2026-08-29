import uuid
import logging
import math
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_stats import StudentAttempt, StudentMastery, MetacognitiveStats
from app.models.database import Syllabus
from ml.knowledge_tracing.bkt_engine import BKTProcessor
from ml.retention.hlr_engine import HLREngine
from ml.metacognitive.calibration import MetacognitiveCalibration
from app.services.xai_service import XAIFeedbackService

logger = logging.getLogger("services.student")

class StudentService:
    # Cross-Subject / Subtopic dependencies definition
    # Maps Child subtopic name to Parent subtopic name dependency
    DEPENDENCY_MAP = {
        "Preamble": "Constitutional Framework",
        "Active Passive Voice": "Tenses"
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.bkt = BKTProcessor()
        self.hlr = HLREngine()
        self.calibration = MetacognitiveCalibration()

    async def submit_attempt(
        self,
        user_id: str,
        subtopic_id: uuid.UUID,
        exam_type: str,
        is_correct: bool,
        response_time: float,
        confidence_level: int,
        difficulty_level: int = 3,  # Default to Medium (3)
        use_confidence: bool = True,
        use_irt: bool = True
    ) -> Dict[str, Any]:
        """
        Saves student attempt, updates BKT (IRT/confidence-weighted)/HLR, and logs trace metrics.
        """
        now = datetime.utcnow()

        # 1. Fetch current StudentMastery
        mastery_stmt = select(StudentMastery).where(
            StudentMastery.user_id == user_id,
            StudentMastery.subtopic_id == subtopic_id,
            StudentMastery.exam_type == exam_type
        )
        mastery_result = await self.db.execute(mastery_stmt)
        mastery = mastery_result.scalars().first()

        # 2. Dependency Check & Initialization (If no record exists)
        if not mastery:
            # Check if there is dependency boost
            p_init_boost = 0.0
            
            # Fetch the syllabus subtopic details
            subtopic_stmt = select(Syllabus).where(Syllabus.id == subtopic_id)
            subtopic_res = await self.db.execute(subtopic_stmt)
            subtopic_node = subtopic_res.scalars().first()
            
            if subtopic_node:
                parent_name = self.DEPENDENCY_MAP.get(subtopic_node.name)
                if parent_name:
                    # Query parent subtopic mastery score for this user
                    parent_stmt = select(StudentMastery).join(
                        Syllabus, StudentMastery.subtopic_id == Syllabus.id
                    ).where(
                        StudentMastery.user_id == user_id,
                        Syllabus.name == parent_name,
                        StudentMastery.exam_type == exam_type
                    )
                    parent_res = await self.db.execute(parent_stmt)
                    parent_mastery = parent_res.scalars().first()
                    
                    if parent_mastery and parent_mastery.mastery_score > 0.70:
                        p_init_boost = 0.05
                        logger.info(f"Dependency Boost Applied (+0.05) to subtopic={subtopic_node.name} because parent={parent_name} has mastery={parent_mastery.mastery_score:.2f}")

            mastery = StudentMastery(
                user_id=user_id,
                subtopic_id=subtopic_id,
                exam_type=exam_type,
                mastery_score=self.bkt.p_init + p_init_boost,
                half_life=1.0,
                stability_factor=2.0,
                last_practiced=now,
                volatility=0.0,
                stability_index=1.0,
                is_fragile=False,
                needs_deep_review=False
            )
            self.db.add(mastery)
            logger.info(f"Initialized new StudentMastery with boost={p_init_boost:.2f} for user={user_id}, subtopic={subtopic_id}")

        # Compute interval
        delta_t_days = (now - mastery.last_practiced).total_seconds() / 86400.0

        # 3. Update BKT mastery score (using IRT and confidence weighting)
        old_mastery_score = mastery.mastery_score
        new_mastery_score, weight_factor, difficulty_scale = self.bkt.update_mastery(
            old_mastery_score,
            is_correct,
            confidence_level=confidence_level,
            difficulty_level=difficulty_level,
            use_confidence=use_confidence,
            use_irt=use_irt
        )
        
        # Volatility update: difference swing in mastery
        vol = abs(new_mastery_score - old_mastery_score)
        mastery.mastery_score = new_mastery_score
        mastery.volatility = 0.7 * mastery.volatility + 0.3 * vol  # EMA volatility (Fallback prior to background task execution)

        # 4. Update HLR memory decay stats
        old_half_life = mastery.half_life
        new_half_life, new_stability = self.hlr.update_half_life(
            old_half_life,
            mastery.stability_factor,
            is_correct
        )
        mastery.half_life = new_half_life
        mastery.stability_factor = new_stability
        mastery.last_practiced = now
        # stability_index = half_life * (1.0 - volatility)
        mastery.stability_index = new_half_life * (1.0 - mastery.volatility)

        # 5. Calibration & Metacognitive bias
        new_calibration_score = self.calibration.calculate_score(confidence_level, is_correct)
        
        # Save StudentAttempt (including evolved schema columns)
        attempt = StudentAttempt(
            user_id=user_id,
            subtopic_id=subtopic_id,
            exam_type=exam_type,
            is_correct=is_correct,
            response_time=response_time,
            confidence_level=confidence_level,
            timestamp=now,
            difficulty_weight=difficulty_scale,
            calibration_impact=new_calibration_score
        )
        self.db.add(attempt)

        # Update Metacognitive Stats
        attempts_stmt = select(StudentAttempt).where(
            StudentAttempt.user_id == user_id,
            StudentAttempt.exam_type == exam_type
        )
        attempts_result = await self.db.execute(attempts_stmt)
        all_attempts = attempts_result.scalars().all()
        
        total_attempts = len(all_attempts)
        if attempt not in all_attempts:
            total_attempts += 1
            all_scores = [self.calibration.calculate_score(a.confidence_level, a.is_correct) for a in all_attempts]
            all_scores.append(new_calibration_score)
        else:
            all_scores = [self.calibration.calculate_score(a.confidence_level, a.is_correct) for a in all_attempts]
            
        avg_calibration = sum(all_scores) / max(1, total_attempts)
        new_bias_type = self.calibration.get_bias_type(avg_calibration)

        stats_stmt = select(MetacognitiveStats).where(
            MetacognitiveStats.user_id == user_id,
            MetacognitiveStats.exam_type == exam_type
        )
        stats_result = await self.db.execute(stats_stmt)
        meta_stats = stats_result.scalars().first()

        if not meta_stats:
            meta_stats = MetacognitiveStats(
                user_id=user_id,
                exam_type=exam_type,
                average_calibration=avg_calibration,
                bias_type=new_bias_type
            )
            self.db.add(meta_stats)
        else:
            meta_stats.average_calibration = avg_calibration
            meta_stats.bias_type = new_bias_type

        # 6. Commit transaction
        await self.db.commit()
        await self.db.refresh(mastery)
        await self.db.refresh(meta_stats)

        # Generate Explainable Feedback (XAI)
        subtopic_name = "Subtopic"
        subtopic_stmt = select(Syllabus).where(Syllabus.id == subtopic_id)
        sub_res = await self.db.execute(subtopic_stmt)
        sub_node = sub_res.scalars().first()
        if sub_node:
            subtopic_name = sub_node.name
            
        feedback = XAIFeedbackService.generate_feedback(subtopic_name, mastery, meta_stats)

        return {
            "attempt_id": attempt.id,
            "mastery_score": mastery.mastery_score,
            "half_life_days": mastery.half_life,
            "calibration_score": new_calibration_score,
            "average_calibration": meta_stats.average_calibration,
            "bias_type": meta_stats.bias_type,
            "volatility": mastery.volatility,
            "stability_index": mastery.stability_index,
            "feedback": feedback
        }

    async def get_student_profile(self, user_id: str, exam_type: str) -> Dict[str, Any]:
        """
        Aggregates mastery scores by subject for the digital twin dashboard.
        """
        mastery_stmt = select(StudentMastery).where(
            StudentMastery.user_id == user_id,
            StudentMastery.exam_type == exam_type
        )
        mastery_result = await self.db.execute(mastery_stmt)
        masteries = mastery_result.scalars().all()

        if not masteries:
            return {
                "user_id": user_id,
                "exam_type": exam_type,
                "subject_mastery": {},
                "meta_calibration": {
                    "average_calibration": 0.0,
                    "bias_type": "Calibrated"
                }
            }

        # Fetch syllabus structure
        syllabus_stmt = select(Syllabus).where(Syllabus.exam_type == exam_type)
        syllabus_result = await self.db.execute(syllabus_stmt)
        syllabus_list = syllabus_result.scalars().all()
        syllabus_map = {s.id: s for s in syllabus_list}
        
        def get_subject_name(subtopic_id: uuid.UUID) -> str:
            subtopic = syllabus_map.get(subtopic_id)
            if not subtopic or subtopic.level != "Subtopic":
                return "General"
                
            topic = syllabus_map.get(subtopic.parent_id) if subtopic.parent_id else None
            if not topic or topic.level != "Topic":
                return "General"
                
            subject = syllabus_map.get(topic.parent_id) if topic.parent_id else None
            if not subject or subject.level != "Subject":
                return "General"
                
            return subject.name

        subject_scores: Dict[str, List[float]] = {}
        for m in masteries:
            subject_name = get_subject_name(m.subtopic_id)
            if subject_name not in subject_scores:
                subject_scores[subject_name] = []
            subject_scores[subject_name].append(m.mastery_score)

        subject_mastery = {
            subj: sum(scores) / len(scores)
            for subj, scores in subject_scores.items()
        }

        # Fetch metacognitive stats
        stats_stmt = select(MetacognitiveStats).where(
            MetacognitiveStats.user_id == user_id,
            MetacognitiveStats.exam_type == exam_type
        )
        stats_result = await self.db.execute(stats_stmt)
        meta_stats = stats_result.scalars().first()

        return {
            "user_id": user_id,
            "exam_type": exam_type,
            "subject_mastery": subject_mastery,
            "meta_calibration": {
                "average_calibration": meta_stats.average_calibration if meta_stats else 0.0,
                "bias_type": meta_stats.bias_type if meta_stats else "Calibrated"
            }
        }

    async def get_revision_list(self, user_id: str, exam_type: str) -> List[Dict[str, Any]]:
        """
        Query subtopic mastery where estimated recall probability < 0.5.
        Uses mathematical simplification: 2^(-delta_t / h) < 0.5  <=>  delta_t > h
        """
        now = datetime.utcnow()
        
        mastery_stmt = select(StudentMastery).where(
            StudentMastery.user_id == user_id,
            StudentMastery.exam_type == exam_type
        )
        mastery_result = await self.db.execute(mastery_stmt)
        masteries = mastery_result.scalars().all()

        revision_list = []
        for m in masteries:
            delta_t_days = (now - m.last_practiced).total_seconds() / 86400.0
            recall_prob = self.hlr.calculate_recall_probability(m.half_life, delta_t_days)
            
            if recall_prob < 0.5:
                revision_list.append({
                    "subtopic_id": m.subtopic_id,
                    "mastery_score": m.mastery_score,
                    "half_life_days": m.half_life,
                    "last_practiced": m.last_practiced.isoformat(),
                    "recall_probability": recall_prob
                })
                
        return revision_list

    async def get_mastery_galaxy(self, user_id: str, exam_type: str) -> Dict[str, Any]:
        """
        Returns spatial nodes and dependency edges for the 'Mastery Galaxy' visualization.
        """
        mastery_stmt = select(StudentMastery).where(
            StudentMastery.user_id == user_id,
            StudentMastery.exam_type == exam_type
        )
        mastery_result = await self.db.execute(mastery_stmt)
        masteries = mastery_result.scalars().all()
        mastery_map = {m.subtopic_id: m for m in masteries}

        syllabus_stmt = select(Syllabus).where(Syllabus.exam_type == exam_type)
        syllabus_result = await self.db.execute(syllabus_stmt)
        syllabus_list = syllabus_result.scalars().all()

        nodes = []
        edges = []
        
        subjects = [s for s in syllabus_list if s.level == "Subject"]
        now = datetime.utcnow()
        
        for idx, subj in enumerate(subjects):
            subj_angle = (2 * math.pi * idx) / max(1, len(subjects))
            subj_radius = 50.0
            
            topics = [t for t in syllabus_list if t.level == "Topic" and t.parent_id == subj.id]
            for t_idx, topic in enumerate(topics):
                topic_angle = subj_angle + (t_idx - len(topics)/2) * (math.pi / 6)
                topic_radius = 120.0
                
                subtopics = [st for st in syllabus_list if st.level == "Subtopic" and st.parent_id == topic.id]
                for st_idx, subtopic in enumerate(subtopics):
                    sub_angle = topic_angle + (st_idx - len(subtopics)/2) * (math.pi / 12)
                    sub_radius = 200.0
                    x = sub_radius * math.cos(sub_angle)
                    y = sub_radius * math.sin(sub_angle)
                    
                    mst = mastery_map.get(subtopic.id)
                    mastery_score = mst.mastery_score if mst else 0.15
                    half_life = mst.half_life if mst else 1.0
                    last_practiced = mst.last_practiced if mst else now
                    
                    delta_t = (now - last_practiced).total_seconds() / 86400.0
                    p_recall = self.hlr.calculate_recall_probability(half_life, delta_t)
                    
                    if p_recall >= 0.8:
                        color = "#4CAF50" # Green
                    elif p_recall >= 0.5:
                        color = "#FFC107" # Yellow
                    else:
                        color = "#F44336" # Red
                        
                    nodes.append({
                        "id": str(subtopic.id),
                        "name": subtopic.name,
                        "level": "Subtopic",
                        "parent_topic": topic.name,
                        "subject": subj.name,
                        "x": round(x, 2),
                        "y": round(y, 2),
                        "size": round(mastery_score * 30.0 + 5.0, 2),
                        "color": color,
                        "mastery": round(mastery_score, 4),
                        "retention": round(p_recall, 4)
                    })

        name_to_id = {s.name: s.id for s in syllabus_list}
        for child_name, parent_name in self.DEPENDENCY_MAP.items():
            child_id = name_to_id.get(child_name)
            parent_id = name_to_id.get(parent_name)
            if child_id and parent_id:
                edges.append({
                    "source": str(parent_id),
                    "target": str(child_id),
                    "type": "dependency"
                })

        return {
            "user_id": user_id,
            "exam_type": exam_type,
            "nodes": nodes,
            "edges": edges
        }

    async def get_fragile_alerts(self, user_id: str, exam_type: str) -> List[Dict[str, Any]]:
        """
        Retrieves a list of subtopics flagged with fragile learning patterns (is_fragile = True).
        """
        stmt = select(StudentMastery).where(
            StudentMastery.user_id == user_id,
            StudentMastery.exam_type == exam_type,
            StudentMastery.is_fragile == True
        )
        res = await self.db.execute(stmt)
        masteries = res.scalars().all()
        
        if not masteries:
            return []
            
        subtopic_ids = [m.subtopic_id for m in masteries]
        sub_stmt = select(Syllabus).where(Syllabus.id.in_(subtopic_ids))
        sub_res = await self.db.execute(sub_stmt)
        sub_map = {s.id: s.name for s in sub_res.scalars().all()}
        
        alerts = []
        for m in masteries:
            topic_name = sub_map.get(m.subtopic_id, "Subtopic")
            feedback_msg = f"You've shown mastery in {topic_name}, but your performance is inconsistent. We recommend a Deep Review to solidify your understanding."
            
            alerts.append({
                "subtopic_id": m.subtopic_id,
                "subtopic_name": topic_name,
                "mastery_score": m.mastery_score,
                "volatility": m.volatility,
                "stability_index": m.stability_index,
                "feedback": feedback_msg
            })
            
        return alerts
