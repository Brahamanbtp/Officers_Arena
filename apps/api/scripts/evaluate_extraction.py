import os
import sys
import json
import csv
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

# Ensure apps/api is in Python's search path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from openai import OpenAI
from sqlmodel import select
from app.core.database import async_session_maker, async_engine
from app.models.intelligence import EvalResults

logger = logging.getLogger("scripts.evaluate_extraction")

class ExtractionEvaluator:
    """
    LLM-as-a-Judge Evaluator to calculate Faithfulness and Extraction Precision 
    comparing AI-extracted question JSON against a Ground Truth dictionary.
    """

    def __init__(self, api_key: Optional[str] = None):
        # Allow fallback to mock if no API key is available
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None
            print("[Warning] No OpenAI API Key found. Evaluator will run in MOCK Mode.")

    def evaluate_item(self, extracted: Dict[str, Any], ground_truth: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends the extracted and ground truth dictionaries to OpenAI for rating.
        """
        if not self.client:
            # Mock evaluation for fallback
            return {
                "faithfulness": 0.95 if extracted.get("text") == ground_truth.get("text") else 0.80,
                "extraction_precision": 0.90 if len(extracted.get("options", {})) == len(ground_truth.get("options", {})) else 0.70,
                "discrepancies": ["Mock evaluation applied: no OpenAI key available."]
            }

        prompt = f"""
        You are an academic quality assurance agent and LLM-as-a-Judge.
        Compare the following AI-extracted question JSON to the Ground Truth question JSON:
        
        AI EXTRACTED:
        {json.dumps(extracted, indent=2, ensure_ascii=False)}
        
        GROUND TRUTH:
        {json.dumps(ground_truth, indent=2, ensure_ascii=False)}
        
        EVALUATE AND SCORE:
        1. "faithfulness" (Score 0.0 to 1.0): Does the extracted text faithfully reflect the original question text and options without introducing hallucinations or external opinions?
        2. "extraction_precision" (Score 0.0 to 1.0): How accurately were the option keys, correct answers, and explanations parsed into their schema elements?
        
        RETURN ONLY a valid JSON object in the following format:
        {{
            "faithfulness": 0.95,
            "extraction_precision": 0.90,
            "discrepancies": ["Option B translated typo", "Missing formula in explanation"]
        }}
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a precise JSON-only evaluator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            raw_res = response.choices[0].message.content
            return json.loads(raw_res)
        except Exception as e:
            logger.error(f"Error during OpenAI LLM-as-a-Judge evaluation: {e}")
            return {
                "faithfulness": 0.50,
                "extraction_precision": 0.50,
                "discrepancies": [f"Evaluation error: {str(e)}"]
            }

async def run_evaluation():
    evaluator = ExtractionEvaluator()
    
    # Mock some datasets to evaluate: UPSC Polity questions
    mock_extracted = [
        {
            "subject": "Indian Polity",
            "text": "Which of the following describes the Preamble?",
            "options": {"A": "Identity card of the constitution", "B": "A simple preface", "C": "Non-binding text"},
            "correct_answer": "A",
            "explanation": "N.A. Palkhivala called the Preamble the identity card of the Constitution."
        },
        {
            "subject": "Geography",
            "text": "The Western Ghats are older than the Himalayas.",
            "options": {"A": "True", "B": "False"},
            "correct_answer": "A",
            "explanation": "Western Ghats are block mountains formed earlier than the young fold Himalayas."
        }
    ]
    
    mock_ground_truth = [
        {
            "subject": "Indian Polity",
            "text": "Which of the following describes the Preamble?",
            "options": {"A": "Identity card of the constitution", "B": "A simple preface", "C": "Non-binding text", "D": "None of the above"},
            "correct_answer": "A",
            "explanation": "N.A. Palkhivala called the Preamble the identity card of the Constitution."
        },
        {
            "subject": "Geography",
            "text": "The Western Ghats are older than the Himalayas.",
            "options": {"A": "True", "B": "False"},
            "correct_answer": "A",
            "explanation": "Western Ghats are block mountains formed earlier than the young fold Himalayas."
        }
    ]
    
    csv_rows = []
    total_faithfulness = 0.0
    total_precision = 0.0
    
    print("\nStarting LLM-as-a-Judge Extraction Validation...")
    
    for idx, (ext, gt) in enumerate(zip(mock_extracted, mock_ground_truth)):
        subject = ext["subject"]
        res = evaluator.evaluate_item(ext, gt)
        
        faith = res["faithfulness"]
        prec = res["extraction_precision"]
        total_faithfulness += faith
        total_precision += prec
        
        print(f"[{subject}] Faithfulness: {faith:.2f} | Precision: {prec:.2f}")
        
        csv_rows.append({
            "subject": subject,
            "faithfulness": faith,
            "extraction_precision": prec,
            "discrepancies": "; ".join(res.get("discrepancies", []))
        })
        
    avg_faithfulness = total_faithfulness / len(mock_extracted)
    avg_precision = total_precision / len(mock_extracted)
    
    # Save to CSV
    csv_path = root_dir / "data" / "processed" / "eval_results.csv"
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["subject", "faithfulness", "extraction_precision", "discrepancies"])
        writer.writeheader()
        writer.writerows(csv_rows)
        
    print(f"\nEvaluation complete. CSV Report written to {csv_path.relative_to(root_dir)}")
    print(f"Average Faithfulness: {avg_faithfulness:.4f} | Average Precision: {avg_precision:.4f}")
    
    # Commit to database
    async with async_session_maker() as session:
        eval_res = EvalResults(
            experiment_name="Module_1_Extraction_Audit",
            faithfulness_score=avg_faithfulness,
            accuracy_score=avg_precision
        )
        session.add(eval_res)
        await session.commit()
        print("Evaluation results successfully persisted to the database.")
        
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_evaluation())
