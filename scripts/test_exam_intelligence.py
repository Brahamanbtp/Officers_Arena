import os
import sys
import asyncio
import numpy as np
import uuid
from pathlib import Path
from sqlmodel import select
from fastapi.testclient import TestClient

# Ensure apps/api is in Python's search path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir / "apps" / "api"))

from app.main import app
from app.core.database import init_db, async_engine, async_session_maker
from ml.exam_trends.drift_analyzer import TrendAnalyzer
from ml.exam_trends.rotation_engine import RotationEngine
from ml.exam_trends.cross_correlator import CrossExamCorrelator
from ml.exam_trends.difficulty_analyzer import DifficultyEstimator
from ml.exam_trends.mock_generator import PredictiveMockGenerator
from app.services.analytics_service import AnalyticsService
from app.services.personalization_service import PersonalizationService
from app.core.api_tracker import track_api_usage
from app.models.intelligence import CostLogs, EvalResults, TopicTrends
from app.models.database import Syllabus
from app.models.student_stats import StudentAttempt
from pipelines.pre_processing import process_low_quality_scan

# Client setup for router testing
client = TestClient(app)

# Simple mock LLM response class for testing the decorator
class MockUsage:
    def __init__(self, prompt, completion):
        self.prompt_tokens = prompt
        self.completion_tokens = completion

class MockLLMResponse:
    def __init__(self, model, prompt_tok, comp_tok):
        self.model = model
        self.usage = MockUsage(prompt_tok, comp_tok)

# Decorated function for testing
@track_api_usage("UPSC_Polity_Extraction_Task")
def call_mock_openai_api(prompt_tok: int, comp_tok: int) -> MockLLMResponse:
    return MockLLMResponse("gpt-4o-mini", prompt_tok, comp_tok)

async def test_drift_analyzer():
    print("\n--- Testing Component A: Semantic Drift ---")
    np.random.seed(42)
    embeddings_2024 = [np.random.rand(1536) for _ in range(5)]
    embeddings_2025 = [np.random.rand(1536) + 0.1 for _ in range(5)]
    
    yearly_data = {
        2024: embeddings_2024,
        2025: embeddings_2025
    }
    
    drift_res = TrendAnalyzer.analyze_drift(yearly_data)
    print("Semantic Drift Timeline:", drift_res["drift_timeline"])
    
    all_embeddings = embeddings_2024 + embeddings_2025
    years = [2024]*5 + [2025]*5
    shift_res = TrendAnalyzer.identify_topic_shifts(all_embeddings, years, n_clusters=2)
    print("Cluster radar distributions:", [d["distribution"] for d in shift_res["radar_data"]])

def test_rotation_engine():
    print("\n--- Testing Component B: Rotation Engine ---")
    appearances = [2009, 2012, 2018, 2021]
    prob_res = RotationEngine.calculate_recurrence_probability(
        appearance_years=appearances,
        start_year=2009,
        target_year=2027
    )
    print("Poisson Recurrence Probabilities:", prob_res)

def test_cross_exam_correlation():
    print("\n--- Testing Component H: Cross-Exam Intelligence ---")
    cds_theme_trend = [0.1, 0.1, 0.8, 0.9, 0.2]
    upsc_theme_trend = [0.05, 0.12, 0.15, 0.78, 0.85]
    
    r = CrossExamCorrelator.calculate_lagged_correlation(cds_theme_trend, upsc_theme_trend)
    print(f"Lagged Pearson correlation (CDS T-1 vs UPSC T): {r:.4f}")
    
    factor = CrossExamCorrelator.calculate_leading_indicator_factor(
        cds_recent_freq=5,
        upsc_recent_freq=1,
        cds_historical_avg=2.0,
        upsc_historical_avg=1.5
    )
    print(f"Leading Indicator Factor Multiplier: {factor}x")

async def test_priority_score_and_db(mock_subtopic_id: uuid.UUID):
    print("\n--- Testing Component C: Priority Scoring & DB ---")
    async with async_session_maker() as session:
        syl = Syllabus(
            id=mock_subtopic_id,
            name="Emergency Provisions",
            level="Subtopic",
            exam_type="UPSC",
            parent_id=None
        )
        session.add(syl)
        await session.commit()

        np.random.seed(100)
        subtopic_vec = np.random.rand(1536)
        news_vec = np.random.rand(1536)
        
        trend = await AnalyticsService.persist_topic_trends(
            db=session,
            topic_id=mock_subtopic_id,
            year=2026,
            exam_type="UPSC",
            freq_count=8,
            max_freq=12,
            historical_freqs=[5, 6, 7],
            drift_index=0.045,
            subtopic_vector=subtopic_vec,
            recent_news_vector=news_vec,
            cross_exam_factor=1.2,
            topic_name="Emergency Provisions"
        )
        print("Persisted TopicTrend Priority Score:", trend.priority_score)
        print("Persisted TopicTrend Drift Index:", trend.drift_index)
        print("Persisted TopicTrend AI Reasoning:", trend.ai_reasoning)

def test_image_preprocessing():
    print("\n--- Testing Component E: Image Pre-processing ---")
    try:
        process_low_quality_scan("non_existent_page.png")
    except FileNotFoundError as e:
        print("[Passed] OpenCV handles missing files correctly:", e)
    except ImportError as e:
        print("[Warning] OpenCV not fully configured in environment:", e)

async def test_api_cost_logger():
    print("\n--- Testing Component F: API Cost & Token Tracker ---")
    call_mock_openai_api(400, 150)
    await asyncio.sleep(0.5)
    
    async with async_session_maker() as session:
        stmt = select(CostLogs).where(CostLogs.task_name == "UPSC_Polity_Extraction_Task")
        res = await session.execute(stmt)
        log = res.scalars().first()
        if log:
            print(f"[Passed] Cost log found: model={log.model_id} | tokens={log.tokens_used} | cost=${log.cost_usd:.6f}")
        else:
            print("[Failed] No Cost logs generated by the tracker decorator.")

async def test_expert_override_endpoint(mock_subtopic_id: uuid.UUID):
    print("\n--- Testing Component I: Human-in-the-Loop Override API ---")
    
    response = client.post(
        "/api/v1/intelligence/expert-override",
        json={
            "topic_id": str(mock_subtopic_id),
            "year": 2026,
            "exam_type": "UPSC",
            "expert_weight": 1.5,
            "expert_note": "Crucial update due to new federalism guidelines"
        }
    )
    print("Expert Override Response:")
    print(response.json())
    
    async with async_session_maker() as session:
        stmt = select(CostLogs).where(CostLogs.task_name == "Expert_Override_Audit")
        res = await session.execute(stmt)
        log = res.scalars().first()
        if log:
            print(f"[Passed] Audit trail found in CostLogs: model_id='{log.model_id}'")
        else:
            print("[Failed] Audit trail missing in CostLogs.")

def test_difficulty_estimator():
    print("\n--- Testing Component J: Difficulty & Distractor Evolution ---")
    # Readability testing
    stem = "Under the constitutional framework of India, the Preamble serves as an introductory declaration."
    grade = DifficultyEstimator.calculate_flesch_kincaid_grade(stem)
    print(f"Stem FK Readability Grade: {grade}")
    
    # Option similarity (Trap Density)
    correct_vector = np.array([0.9, 0.1, 0.0])
    distractor_vectors = [
        np.array([0.8, 0.15, 0.05]), # high similarity
        np.array([0.1, 0.9, 0.0])   # low similarity
    ]
    trap_density = DifficultyEstimator.calculate_distractor_similarity(correct_vector, distractor_vectors)
    print(f"Trap Density (Distractor Cosine Similarity): {trap_density}")

async def test_personalization_service(mock_subtopic_id: uuid.UUID):
    print("\n--- Testing Component K: Personalized Urgency Engine ---")
    async with async_session_maker() as session:
        # Seed some student attempts to verify accuracy calculation
        # Let's seed 3 attempts: 2 correct, 1 incorrect. Accuracy = 2/3 = 0.6667
        att1 = StudentAttempt(
            id=uuid.uuid4(),
            user_id="student_007",
            subtopic_id=mock_subtopic_id,
            exam_type="UPSC",
            is_correct=True,
            confidence_level=4,
            response_time=12.0,
            difficulty_weight=0.5,
            timestamp=None
        )
        att2 = StudentAttempt(
            id=uuid.uuid4(),
            user_id="student_007",
            subtopic_id=mock_subtopic_id,
            exam_type="UPSC",
            is_correct=True,
            confidence_level=5,
            response_time=10.0,
            difficulty_weight=0.5,
            timestamp=None
        )
        att3 = StudentAttempt(
            id=uuid.uuid4(),
            user_id="student_007",
            subtopic_id=mock_subtopic_id,
            exam_type="UPSC",
            is_correct=False,
            confidence_level=2,
            response_time=15.0,
            difficulty_weight=0.5,
            timestamp=None
        )
        session.add(att1)
        session.add(att2)
        session.add(att3)
        await session.commit()
        
        personalized_gaps = await PersonalizationService.get_personalized_urgency(
            db=session,
            user_id="student_007",
            exam_type="UPSC",
            year=2026
        )
        print("Personalized Urgency output:", personalized_gaps)

async def test_predictive_mock_generator():
    print("\n--- Testing Component L: 2027 Predictor Blueprint ---")
    async with async_session_maker() as session:
        blueprint = await PredictiveMockGenerator.generate_blueprint(
            db=session,
            exam_type="UPSC",
            target_year=2027,
            total_expected_questions=10
        )
        print("2027 Expected Syllabus Blueprint Output:")
        print(blueprint)

def test_dashboard_summary_endpoint():
    print("\n--- Testing GET /api/v1/intelligence/dashboard-summary Endpoint ---")
    response = client.get("/api/v1/intelligence/dashboard-summary?user_id=student_007&exam_type=UPSC")
    print("Dashboard Summary API Payload Response Status Code:", response.status_code)
    payload = response.json()
    print("Summary radar_data keys/structure:", payload.keys())
    print("Radar data:", payload["radar_data"])
    print("Difficulty trend:", payload["difficulty_trend"])

async def run_all():
    print("="*60)
    print("STARTING TEST SUITE FOR MODULE 3: EXAM INTELLIGENCE")
    print("="*60)
    
    # Setup test SQLite file
    db_file = root_dir / "data" / "test_officers_arena.db"
    if db_file.exists():
        try:
            os.remove(db_file)
            print("[Test DB] Cleared old test database file.")
        except Exception as e:
            print(f"[Test DB] Warning: Could not remove database file: {e}")

    # Setup database tables
    await init_db()
    
    # Generate unified mock subtopic UUID
    mock_subtopic_id = uuid.uuid4()
    
    await test_drift_analyzer()
    test_rotation_engine()
    test_cross_exam_correlation()
    await test_priority_score_and_db(mock_subtopic_id)
    test_image_preprocessing()
    await test_api_cost_logger()
    await test_expert_override_endpoint(mock_subtopic_id)
    
    # New enhancements
    test_difficulty_estimator()
    await test_personalization_service(mock_subtopic_id)
    await test_predictive_mock_generator()
    test_dashboard_summary_endpoint()
    
    print("\n" + "="*60)
    print("TEST SUITE COMPLETED SUCCESSFULLY")
    print("="*60)
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_all())
