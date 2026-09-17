from typing import List, Optional, Dict, Any
import re

class ErrorAnalyzer:
    @staticmethod
    def diagnose_misconception_tag(
        question_text: str,
        user_opt_text: str,
        correct_opt_text: str,
        exam_type: str
    ) -> Dict[str, str]:
        """
        Deep Option Tracing: Diagnoses specific cognitive misconception based on
        question content and the selected distractor's linguistic/factual footprint.
        """
        q_lower = question_text.lower()
        opt_lower = user_opt_text.lower()
        
        # 1. Extreme Qualifier Trap (Only, Always, All, Drastically)
        if any(w in opt_lower for w in ["only", "all", "never", "drastically", "completely", "solely"]):
            return {
                "tag": "EXTREME_QUALIFIER_TRAP",
                "category": "Linguistic & Scope Trap",
                "gap": "Elimination trap: Fell for an absolute qualifier ('Only'/'All'/'Never') which UPSC often uses as distractor bait.",
                "rec": "In UPSC civil services, absolute statements are statistically disfavored unless explicitly mandated by the Constitution."
            }
            
        # 2. Constitutional Article / Statutory Confusion
        if any(k in q_lower for k in ["article", "constitution", "governor", "president", "parliament", "amendment"]):
            return {
                "tag": "CONSTITUTIONAL_ARTICLE_CONFUSION",
                "category": "Statutory & Article Boundary",
                "gap": "Conceptual boundary error: Confused procedural mandates with discretionary constitutional powers.",
                "rec": "Review M. Laxmikanth Chapter on Emergency Provisions & Constitutional Discretionary Powers."
            }
            
        # 3. Chronological & Freedom Struggle Sequence Inversion
        if any(k in q_lower for k in ["freedom", "movement", "mission", "viceroy", "act of", "congress", "league"]):
            return {
                "tag": "CHRONOLOGY_INVERSION",
                "category": "Historical Timeline Trap",
                "gap": "Chronology slip: Inverted the timeline or confused sequential proposals of the national movement.",
                "rec": "Review Spectrum Modern History Chapter on Freedom Struggle milestones and sequential round table conferences."
            }
            
        # 4. Defense Command & Joint Operational Misattribution (CDS)
        if any(k in q_lower for k in ["cds", "defence", "corps", "command", "naval", "air force", "missile", "treaty"]):
            return {
                "tag": "DEFENSE_COMMAND_MISATTRIBUTION",
                "category": "Operational Doctrine Trap",
                "gap": "Organizational doctrine confusion: Misattributed operational command vs. administrative advisory authority.",
                "rec": "Review Indian Military Doctrine: CDS acts as Principal Military Adviser, while operational command remains with Service Chiefs."
            }
            
        # 5. Mathematical / Formula Divergence
        if any(k in q_lower for k in ["triangle", "radius", "algebra", "speed", "work", "trigonometry", "ratio", "inradius"]):
            return {
                "tag": "FORMULA_SIGN_OR_THEOREM_MISUSE",
                "category": "Theorem & Formula Setup",
                "gap": "Theorem application fault: Misapplied perimeter vs. inradius / hypotenuse formula formulation.",
                "rec": "Review RS Aggarwal Quantitative Aptitude: Re-derive fundamental right-triangle inradius formulas: r = (a + b - c) / 2."
            }
            
        # Default Fallback
        return {
            "tag": "CONCEPTUAL_DISTRACTOR_SELECTION",
            "category": "Conceptual Distractor",
            "gap": "Subtle distractor trap: Selected a plausible but factually ungrounded distractor.",
            "rec": "Ground reasoning strictly in canonical textbook sources before validating elimination."
        }

    @staticmethod
    def analyze_statement_error(
        user_bitmask: List[bool],
        correct_bitmask: List[bool]
    ) -> Dict[str, Any]:
        """
        Compares statement bitmasks for UPSC questions to pinpoint
        which specific statement index caused the incorrect selection.
        """
        gap_stmt_idx = -1
        # Find first index where user selection diverges from correct key
        for idx in range(min(len(user_bitmask), len(correct_bitmask))):
            if user_bitmask[idx] != correct_bitmask[idx]:
                gap_stmt_idx = idx + 1
                break
                
        if gap_stmt_idx != -1:
            # Check if user falsely believed statement was TRUE or FALSE
            falsely_true = user_bitmask[gap_stmt_idx - 1]
            status = "True" if falsely_true else "False"
            identified_gap = f"Statement Discrepancy: Falsely assumed Statement {gap_stmt_idx} was {status}."
            recommendation = f"Re-read Statement {gap_stmt_idx} carefully for subtle exception clauses and qualifying words."
            tag = f"STATEMENT_{gap_stmt_idx}_MISCLASSIFICATION"
        else:
            identified_gap = "Elimination Failure: Unable to isolate the final pair of distractor statements."
            recommendation = "Use pairwise statement elimination to remove options containing known false statements."
            tag = "PAIRWISE_ELIMINATION_FAILURE"
            
        return {
            "misconception_tag": tag,
            "error_category": "Statement Verification",
            "identified_gap": identified_gap,
            "recommendation": recommendation
        }

    @staticmethod
    def analyze_numerical_error(
        user_ans: float,
        correct_ans: float,
        distractors: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes numerical errors in CDS math questions.
        """
        diff = abs(user_ans - correct_ans)
            
        if diff < 1.0:
            error_category = "Calculation Slip"
            identified_gap = "Minor Arithmetic Slip: Final arithmetic step deviated slightly."
            recommendation = "Formula setup was sound. Redo arithmetic steps to ensure precision."
            tag = "ARITHMETIC_PRECISION_SLIP"
        else:
            # Check if user answer matches any of the known distractor values
            is_formula_misuse = False
            if distractors:
                for dist in distractors:
                    if abs(user_ans - dist) < 1e-4:
                        is_formula_misuse = True
                        break
            
            if is_formula_misuse:
                error_category = "Formula Misapplication"
                identified_gap = "Formula Trap: Selected answer matches a classic distractor formula."
                recommendation = "Double check sign conventions and geometric theorem hypotheses."
                tag = "KNOWN_DISTRACTOR_FORMULA_TRAP"
            else:
                error_category = "Conceptual Divergence"
                identified_gap = "Problem Setup Gap: Major numerical divergence indicating wrong theorem."
                recommendation = "Review theorem foundations before embarking on calculations."
                tag = "PROBLEM_SETUP_DIVERGENCE"

        return {
            "misconception_tag": tag,
            "error_category": error_category,
            "identified_gap": identified_gap,
            "recommendation": recommendation
        }

    @classmethod
    def classify_error(
        cls,
        question_text: str,
        options: Dict[str, Any],
        user_selected: str,
        correct_answer: str,
        exam_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Option Tracing (OT) Classifier executing multi-tier cognitive diagnosis.
        """
        meta = metadata or {}
        user_opt_text = str(options.get(user_selected, ""))
        correct_opt_text = str(options.get(correct_answer, ""))
        
        # 1. Statement Bitmask Check
        user_bitmask = meta.get("user_answer_bitmask")
        correct_bitmask = meta.get("correct_metadata_bitmask")
        if user_bitmask is not None and correct_bitmask is not None:
            return cls.analyze_statement_error(user_bitmask, correct_bitmask)
            
        # 2. Numerical Value Check
        user_val = meta.get("user_answer_value")
        correct_val = meta.get("correct_answer_value")
        if user_val is not None and correct_val is not None:
            distractors = meta.get("distractor_values")
            return cls.analyze_numerical_error(float(user_val), float(correct_val), distractors)

        # 3. Statement regex extraction
        user_nums = [int(s) for s in re.findall(r'\b[1-3]\b', user_opt_text)]
        correct_nums = [int(s) for s in re.findall(r'\b[1-3]\b', correct_opt_text)]
        
        if user_nums or correct_nums:
            user_bit = [i in user_nums for i in range(1, 4)]
            correct_bit = [i in correct_nums for i in range(1, 4)]
            return cls.analyze_statement_error(user_bit, correct_bit)
            
        # 4. Rich Option Tracing Misconception Diagnosis
        misconception = cls.diagnose_misconception_tag(
            question_text=question_text,
            user_opt_text=user_opt_text,
            correct_opt_text=correct_opt_text,
            exam_type=exam_type
        )
        
        return {
            "misconception_tag": misconception["tag"],
            "error_category": misconception["category"],
            "identified_gap": misconception["gap"],
            "recommendation": misconception["rec"]
        }
