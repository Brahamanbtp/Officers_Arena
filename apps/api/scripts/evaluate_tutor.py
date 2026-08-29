import os
import asyncio
import numpy as np
from typing import List, Dict, Any

# Ragas metric placeholders
# Ragas typically requires setting OPENAI_API_KEY or other model configuration.
# Since this is an evaluation script skeleton, we showcase the configuration flow
# and run a simulated mock evaluation when keys are missing.

async def mock_ragas_evaluation(dataset: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Simulates Ragas evaluation calculations (Faithfulness and Relevancy)
    based on overlap and similarity metrics when offline or key is missing.
    """
    faithfulness_scores = []
    relevancy_scores = []
    
    for row in dataset:
        query = row["question"]
        contexts = row["contexts"]
        answer = row["answer"]
        ground_truth = row["ground_truth"]
        
        # Simulated faithfulness: check how many terms in answer exist in retrieved contexts
        context_words = set(" ".join(contexts).lower().split())
        answer_words = set(answer.lower().split())
        if answer_words:
            faithfulness = len(answer_words.intersection(context_words)) / len(answer_words)
            # Add some randomness for realism
            faithfulness = min(1.0, faithfulness * 1.5)
        else:
            faithfulness = 1.0
            
        # Simulated answer relevancy: check overlap between answer and user query
        query_words = set(query.lower().split())
        if query_words:
            relevancy = len(answer_words.intersection(query_words)) / len(query_words)
            relevancy = min(1.0, relevancy * 2.0)
        else:
            relevancy = 1.0
            
        faithfulness_scores.append(faithfulness)
        relevancy_scores.append(relevancy)
        
    return {
        "faithfulness": float(np.mean(faithfulness_scores)),
        "answer_relevancy": float(np.mean(relevancy_scores))
    }

async def run_evaluation():
    print("============================================================")
    print("RAGAS EVALUATION RUNNER: CONTEXTUAL AI TUTOR")
    print("============================================================")
    
    # 1. Define evaluation dataset (Queries, Contexts, Answers, Ground Truth)
    eval_dataset = [
        {
            "question": "What is the constitutional significance of Article 21 and personal liberty?",
            "contexts": [
                "Fundamental Rights are enshrined in Part III of the Constitution from Articles 12 to 35. Article 21 guarantees protection of life and personal liberty, stating that no person shall be deprived of his life or personal liberty except according to procedure established by law."
            ],
            "answer": "Article 21 protects life and personal liberty. It is justiciable under Part III, meaning courts can enforce it, ensuring no deprivation happens without legal procedure [Source: M. Laxmikanth, Chapter 7].",
            "ground_truth": "Article 21 guarantees protection of life and personal liberty, which is justiciable and only restricted under procedure established by law."
        },
        {
            "question": "Under what article can the President declare a national emergency, and what is the ground of armed rebellion?",
            "contexts": [
                "Under Article 352, the President can declare a National Emergency on the grounds of war, external aggression, or armed rebellion. The word 'armed rebellion' was inserted by the 44th Amendment Act."
            ],
            "answer": "The President can declare national emergency under Article 352. The ground of 'armed rebellion' was added by the 44th Constitutional Amendment Act to replace internal disturbance.",
            "ground_truth": "Article 352 allows national emergency declarations on war, external aggression, or armed rebellion. The 44th amendment replaced 'internal disturbance' with 'armed rebellion'."
        }
    ]
    
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        print("Detected OpenAI API Key. Initializing official RAGAS metrics...")
        try:
            # We wrap imports inside try/except since ragas is a heavy external library
            from datasets import Dataset  # type: ignore
            from ragas import evaluate  # type: ignore
            from ragas.metrics import (  # type: ignore
                faithfulness, answer_relevancy, context_precision, context_recall
            )
            
            # Format to Ragas HuggingFace dataset
            data_dict = {
                "question": [row["question"] for row in eval_dataset],
                "contexts": [[c] for row in eval_dataset for c in row["contexts"]],
                "answer": [row["answer"] for row in eval_dataset],
                "ground_truth": [row["ground_truth"] for row in eval_dataset]
            }
            dataset = Dataset.from_dict(data_dict)
            
            # Run official evaluation
            result = evaluate(
                dataset=dataset,
                metrics=[faithfulness, answer_relevancy, context_precision, context_recall]
            )
            print("\nEvaluation completed successfully via official Ragas:")
            for metric, score in result.items():
                print(f"- {metric}: {score:.4f}")
                
        except ImportError as ie:
            print(f"Ragas packages not installed in virtual env: {str(ie)}")
            print("Falling back to Socratic GraphRAG simulated evaluation...")
            scores = await mock_ragas_evaluation(eval_dataset)
            print("\nSimulated Evaluation Results:")
            for metric, score in scores.items():
                print(f"- {metric}: {score:.4f}")
    else:
        print("No OPENAI_API_KEY found. Running in local simulated mode...")
        scores = await mock_ragas_evaluation(eval_dataset)
        print("\nSimulated Evaluation Results (Grounded Overlaps):")
        for metric, score in scores.items():
            print(f"- {metric}: {score:.4f}")
            
    print("============================================================")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
