from typing import List, Optional, Dict, Any

class ErrorAnalyzer:
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
            identified_gap = f"Student falsely assumed Statement {gap_stmt_idx} was {status}."
            recommendation = f"Carefully re-read Statement {gap_stmt_idx} to check for exception clauses."
        else:
            identified_gap = "Elimination Failure: Unable to distinguish between the final distractor choices."
            recommendation = "Eliminate choices containing statements you know are incorrect."
            
        return {
            "error_category": "Conceptual",
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
            error_category = "Calculation"
            identified_gap = "Calculation Error: Minor arithmetic deviation detected."
            recommendation = "Your formula setup was correct. Redo your final calculation steps."
        else:
            # Check if user answer matches any of the known distractor values
            is_formula_misuse = False
            if distractors:
                for dist in distractors:
                    if abs(user_ans - dist) < 1e-4:
                        is_formula_misuse = True
                        break
            
            if is_formula_misuse:
                error_category = "Formula"
                identified_gap = "Formula Misuse: Selected answer matches a known common formula mistake."
                recommendation = "You likely applied the wrong theorem or formula. Double-check your starting assumptions."
            else:
                error_category = "Conceptual"
                identified_gap = "Conceptual Gap: Major numerical divergence indicating wrong problem setup."
                recommendation = "Review the underlying concepts before attempting calculations."

        return {
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
        Wrapper to classify errors using bitmask statement checks or numerical comparison.
        """
        meta = metadata or {}
        
        # 1. Statement Check
        user_bitmask = meta.get("user_answer_bitmask")
        correct_bitmask = meta.get("correct_metadata_bitmask")
        if user_bitmask is not None and correct_bitmask is not None:
            return cls.analyze_statement_error(user_bitmask, correct_bitmask)
            
        # 2. Numerical Check
        user_val = meta.get("user_answer_value")
        correct_val = meta.get("correct_answer_value")
        if user_val is not None and correct_val is not None:
            distractors = meta.get("distractor_values")
            return cls.analyze_numerical_error(float(user_val), float(correct_val), distractors)

        # Fallback to text heuristics
        import re
        user_opt_text = str(options.get(user_selected, ""))
        correct_opt_text = str(options.get(correct_answer, ""))
        
        # Simple extraction for statement logic
        user_nums = [int(s) for s in re.findall(r'\b[1-3]\b', user_opt_text)]
        correct_nums = [int(s) for s in re.findall(r'\b[1-3]\b', correct_opt_text)]
        
        if user_nums or correct_nums:
            user_bit = [i in user_nums for i in range(1, 4)]
            correct_bit = [i in correct_nums for i in range(1, 4)]
            return cls.analyze_statement_error(user_bit, correct_bit)
            
        # Fallback default conceptual error
        return {
            "error_category": "Conceptual",
            "identified_gap": "Conceptual Error: Falsely selected a conceptual distractor.",
            "recommendation": "Review the basic definitions and scope of authority of the respective institutions."
        }
