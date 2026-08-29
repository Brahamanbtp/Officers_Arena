import os
import sys
import asyncio

# Add apps/api/app to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import async_session_maker, init_db
from app.services.evaluation_service import EvaluationService
from app.services.report_service import ReportService
from scripts.backtest_engine import run_backtest_for_year

async def main():
    print("============================================================")
    print("TEST SUITE: MODULE 7 RESEARCH & VALIDATION SERVICE")
    print("============================================================")
    
    await init_db()
    
    async with async_session_maker() as db:
        print("\n1. Testing Knowledge Tracing Evaluation...")
        kt_res = await EvaluationService.validate_knowledge_tracing(db)
        print(f"   - AUC-ROC: {kt_res['auc_roc']}")
        print(f"   - RMSE: {kt_res['rmse']}")
        print(f"   - Sample size: {kt_res['sample_size']}")
        assert kt_res["auc_roc"] > 0.5, "AUC-ROC should be greater than 0.5"
        
        print("\n2. Testing Calibration Engine...")
        cal_res = await EvaluationService.calculate_calibration(db)
        print(f"   - ECE: {cal_res['ece']}")
        print(f"   - Brier Score: {cal_res['brier_score']}")
        print(f"   - Reliability Diagram Bins count: {len(cal_res['reliability_diagram'])}")
        assert cal_res["ece"] >= 0.0, "ECE should be calculated"

        print("\n3. Testing Explainable AI Priority Service...")
        from app.services.priority_service import PriorityService
        xai_res = PriorityService.generate_xai_justification(
            topic_name="Fundamental Rights",
            freq_count=8,
            historical_freqs=[1, 2, 0, 3, 2],
            priority_score=0.89
        )
        print(f"   - Topic: {xai_res['topic_name']}")
        print(f"   - Priority: {xai_res['priority_score']}")
        print(f"   - XAI Justifications: {xai_res['justifications']}")
        assert "frequency" in xai_res["justifications"], "Should contain frequency justification"

        print("\n4. Testing Backtest Engine...")
        bt_res = await run_backtest_for_year(db, cutoff_year=2023, exam_type="UPSC", k=10)
        print(f"   - Precision@10: {bt_res['precision_10']}")
        print(f"   - Precision@20: {bt_res['precision_20']}")
        print(f"   - Recall@10: {bt_res['recall_k']}")
        assert "precision_10" in bt_res, "Backtest results should contain precision_10"

        print("\n5. Testing LLM-as-a-Judge RAGAS wrapper...")
        ragas_res = await EvaluationService.run_ragas_judge(
            question="What is Article 21?",
            contexts=["Article 21 guarantees protection of life and personal liberty."],
            answer="Article 21 is a fundamental right protecting personal liberty and life."
        )
        print(f"   - Faithfulness: {ragas_res['faithfulness']}")
        print(f"   - Answer Relevance: {ragas_res['answer_relevance']}")
        print(f"   - Context Precision: {ragas_res['context_precision']}")
        assert "faithfulness" in ragas_res, "Ragas results should contain faithfulness"

        print("\n6. Testing Report Generation Service...")
        metrics = {
            "auc_roc": kt_res["auc_roc"],
            "rmse": kt_res["rmse"],
            "sample_size": kt_res["sample_size"],
            "ece": cal_res["ece"],
            "brier_score": cal_res["brier_score"],
            "precision_10": bt_res["precision_10"],
            "precision_20": bt_res["precision_20"],
            "recall_10": bt_res["recall_k"],
            "faithfulness": ragas_res["faithfulness"],
            "answer_relevance": ragas_res["answer_relevance"],
            "context_precision": ragas_res["context_precision"]
        }
        html_path = ReportService.export_report_files(metrics)
        print(f"   - Generated Report HTML file: {html_path}")
        assert os.path.exists(html_path), "HTML report should be generated on the filesystem"
        
        md_path = html_path.replace(".html", ".md")
        print(f"   - Generated Report Markdown file: {md_path}")
        assert os.path.exists(md_path), "Markdown report should be generated on the filesystem"

    print("\n============================================================")
    print("ALL MODULE 7 TESTS PASSED SUCCESSFULLY!")
    print("============================================================")

if __name__ == "__main__":
    asyncio.run(main())
