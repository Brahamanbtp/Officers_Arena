import os
import sys
import uuid
import asyncio

# Ensure project root is in PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import select
from app.core.database import init_db, async_session_maker
from app.models.database import Syllabus, Questions
from ml.tutor.rag_chain import GraphRAGRetriever
from ml.tutor.error_analyzer import ErrorAnalyzer

async def test_error_analyzer():
    print("Testing Step-wise Error Analyzer...")
    options = {
        "A": "1 and 2 only",
        "B": "2 and 3 only",
        "C": "1 and 3 only",
        "D": "1, 2 and 3"
    }
    
    # Statement fault analysis
    res = ErrorAnalyzer.classify_error(
        question_text="Which of the statements given above is/are correct?",
        options=options,
        user_selected="A",
        correct_answer="B",
        exam_type="UPSC"
    )
    print("UPSC Statement fault classification:", res)
    assert res["error_category"] in ["Conceptual", "Factual"]
    assert "Statement" in res["identified_gap"]

    # Numerical error analysis
    options_math = {
        "A": "12.5 cm",
        "B": "15.0 cm",
        "C": "18.0 cm",
        "D": "20.0 cm"
    }
    res_math = ErrorAnalyzer.classify_error(
        question_text="Calculate the length of the hypotenuse if base is 9 cm and height is 12 cm.",
        options=options_math,
        user_selected="D", # correct is B (sqrt(81+144) = sqrt(225) = 15)
        correct_answer="B",
        exam_type="CDS"
    )
    print("CDS Math fault classification:", res_math)
    assert res_math["error_category"] in ["Calculation", "Formula", "Conceptual"]

    print("Error Analyzer: PASS\n")

async def test_graphrag_retriever():
    print("Testing GraphRAG Retriever...")
    await init_db()
    
    async with async_session_maker() as session:
        # Verify retrieve functions without crashing
        docs, confidence = await GraphRAGRetriever.retrieve(
            session, query="What is Article 21?", limit=2
        )
        print(f"Retrieved {len(docs)} documents. Max confidence similarity: {confidence:.3f}")
        for d in docs:
            print(f"- Source: {d['source']} (Type: {d['type']}, Similarity: {d['similarity']:.3f})")
            
    print("GraphRAG Retriever: PASS\n")

async def main():
    print("============================================================")
    print("RUNNING MODULE 6: CONTEXTUAL AI TUTOR LOCAL TESTS")
    print("============================================================")
    await test_error_analyzer()
    await test_graphrag_retriever()
    print("============================================================")
    print("ALL TUTOR TESTS PASSED")
    print("============================================================")

if __name__ == "__main__":
    asyncio.run(main())
