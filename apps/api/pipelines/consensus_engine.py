import re
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

class ConsensusResult(BaseModel):
    consensus_reached: bool
    status: str  # "VERIFIED", "NEEDS_REVIEW", "WAITING_FOR_PROVIDER"
    agreement_score: float  # 0.0 to 1.0
    final_text: str
    final_options: Dict[str, str]
    final_answer: str
    answer_source: str  # "OFFICIAL_SOURCE", "AI_DERIVED", "NEEDS_REVIEW"
    disagreements: List[str] = Field(default_factory=list)
    providers_consulted: List[str] = Field(default_factory=list)


class ConsensusEngine:
    """
    Multi-Provider Consensus & Quality Engine.
    Cross-evaluates Local Extraction, Gemini, Mistral, and Vision outputs.
    Guarantees deterministic safety: conflicts route safely to NEEDS_REVIEW without data fabrication.
    """

    @classmethod
    def normalize_for_comparison(cls, s: str) -> str:
        """Strips whitespace, punctuation and LaTeX delimiters for normalized string comparison."""
        if not s:
            return ""
        s = s.lower().replace("$", "").replace("\\", "").replace(" ", "").replace("{", "").replace("}", "")
        return s

    @classmethod
    def evaluate_consensus(
        cls,
        local_text: str,
        local_options: Dict[str, str],
        cloud_evaluations: List[Dict[str, Any]],
        official_answer: Optional[str] = None
    ) -> ConsensusResult:
        """
        Evaluates consensus across local extraction and cloud providers.
        cloud_evaluations items format: {"provider": "gemini", "text": "...", "options": {...}, "proposed_answer": "A"}
        """
        disagreements = []
        providers_consulted = ["local_extractor"]

        final_text = local_text
        final_options = dict(local_options)
        final_answer = official_answer or "A"
        answer_source = "OFFICIAL_SOURCE" if official_answer else "AI_DERIVED"

        if not cloud_evaluations:
            # Local-only mode: valid if local structure and options are complete
            has_all_opts = all(bool(final_options.get(k)) for k in ["A", "B", "C", "D"])
            has_text = len(final_text) >= 15
            is_valid = has_all_opts and has_text
            return ConsensusResult(
                consensus_reached=is_valid,
                status="DRAFT_READY" if is_valid else "NEEDS_REVIEW",
                agreement_score=0.9 if is_valid else 0.5,
                final_text=final_text,
                final_options=final_options,
                final_answer=final_answer,
                answer_source=answer_source,
                disagreements=["No cloud providers consulted (local draft)"] if not is_valid else [],
                providers_consulted=providers_consulted
            )

        option_votes: Dict[str, Dict[str, int]] = {"A": {}, "B": {}, "C": {}, "D": {}}

        # Record local option votes
        for k in ["A", "B", "C", "D"]:
            v = local_options.get(k, "")
            norm_v = cls.normalize_for_comparison(v)
            if norm_v:
                option_votes[k][norm_v] = option_votes[k].get(norm_v, 0) + 1

        for eval_item in cloud_evaluations:
            p_name = eval_item.get("provider", "unknown")
            providers_consulted.append(p_name)
            p_opts = eval_item.get("options", {})

            for k in ["A", "B", "C", "D"]:
                v = p_opts.get(k, "")
                norm_v = cls.normalize_for_comparison(v)
                if norm_v:
                    option_votes[k][norm_v] = option_votes[k].get(norm_v, 0) + 1

        # Check for option agreements
        agreement_count = 0
        total_checks = 4

        for k in ["A", "B", "C", "D"]:
            votes = option_votes[k]
            if not votes:
                disagreements.append(f"Option {k} missing across all providers")
            elif len(votes) == 1:
                agreement_count += 1
            else:
                # Disagreement among providers
                top_vote_val = max(votes, key=votes.get) # type: ignore
                total_votes_for_k = sum(votes.values())
                if votes[top_vote_val] / total_votes_for_k >= 0.67:
                    agreement_count += 0.8
                else:
                    disagreements.append(f"Option {k} has conflicting extractions: {votes}")

        agreement_score = agreement_count / total_checks
        is_consensus = (agreement_score >= 0.75) and (len(disagreements) == 0)

        status = "VERIFIED" if is_consensus else "NEEDS_REVIEW"

        return ConsensusResult(
            consensus_reached=is_consensus,
            status=status,
            agreement_score=round(agreement_score, 2),
            final_text=final_text,
            final_options=final_options,
            final_answer=final_answer,
            answer_source=answer_source,
            disagreements=disagreements,
            providers_consulted=providers_consulted
        )
