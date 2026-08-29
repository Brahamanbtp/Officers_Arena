# API Reference Manual
## Officers Arena — REST API & ML Interfaces

This reference manual documents all API endpoints exposed by the Officers Arena Student Intelligence & Exam Intelligence backend.

---

### 1. Student Digital Twin Endpoints (`/v1/student` / `/v1/attempts`)

These endpoints manage student attempts, diagnostics, alerts, and spaced repetition schedules.

#### A. Submit Attempt
*   **Path**: `POST /v1/attempts/submit`
*   **Description**: Saves student question attempt. Triggers Bayesian Knowledge Tracing (BKT) updates, item response updates, and runs performance volatility tracking in the background.
*   **Request Payload**:
    ```json
    {
      "user_id": "student_007",
      "subtopic_id": "29ac97b0-6263-42b7-be5b-42cec1da8b70",
      "exam_type": "UPSC",
      "is_correct": true,
      "response_time": 45.2,
      "confidence_level": 4,
      "difficulty_level": 3,
      "use_confidence": true,
      "use_irt": true
    }
    ```
*   **Response Payload**:
    ```json
    {
      "status": "success",
      "new_mastery": 0.7173,
      "half_life_days": 4.6
    }
    ```

#### B. Initialize Onboarding
*   **Path**: `POST /v1/student/onboard/initialize`
*   **Description**: Establishes custom baseline mastery weights for a student profile using an initial diagnostic onboarding test.
*   **Request Payload**:
    ```json
    {
      "user_id": "student_007",
      "exam_type": "UPSC",
      "attempts": [
        {
          "subtopic_id": "29ac97b0-6263-42b7-be5b-42cec1da8b70",
          "is_correct": true,
          "confidence_level": 4
        }
      ]
    }
    ```
*   **Response Payload**:
    ```json
    {
      "user_id": "student_007",
      "exam_type": "UPSC",
      "initialized_subtopics_count": 1,
      "subtopics": [
        {
          "subtopic_id": "29ac97b0-6263-42b7-be5b-42cec1da8b70",
          "baseline_mastery": 0.69,
          "initial_half_life_days": 4.6
        }
      ]
    }
    ```

#### C. Get Student Profile
*   **Path**: `GET /v1/student/profile/{user_id}`
*   **Parameters**:
    *   `exam_type` (Query, required): `UPSC` or `CDS`
*   **Response Payload**:
    ```json
    {
      "user_id": "student_007",
      "exam_type": "UPSC",
      "global_mastery": 0.7173,
      "subject_mastery": {
        "Indian Polity": 0.7173
      }
    }
    ```

#### D. Get Spaced Repetition Revision List
*   **Path**: `GET /v1/student/revision-list`
*   **Parameters**:
    *   `user_id` (Query, required): Student identifier
    *   `exam_type` (Query, required): `UPSC` or `CDS`
*   **Response Payload**:
    ```json
    [
      {
        "subtopic_id": "29ac97b0-6263-42b7-be5b-42cec1da8b70",
        "subtopic_name": "Preamble",
        "recall_probability": 0.42,
        "half_life_days": 4.6,
        "days_since_last_practice": 7.2
      }
    ]
    ```

#### E. Get Mastery Galaxy coordinates
*   **Path**: `GET /v1/student/analytics/galaxy`
*   **Parameters**:
    *   `user_id` (Query, required): Student identifier
    *   `exam_type` (Query, required): `UPSC` or `CDS`
*   **Response Payload**:
    ```json
    {
      "user_id": "student_007",
      "exam_type": "UPSC",
      "nodes": [
        {
          "id": "29ac97b0-6263-42b7-be5b-42cec1da8b70",
          "name": "Preamble",
          "level": "Subtopic",
          "parent_topic": "Constitutional Framework",
          "subject": "Indian Polity",
          "x": 184.78,
          "y": -76.54,
          "size": 26.52,
          "color": "#4CAF50",
          "mastery": 0.7173,
          "retention": 1.0
        }
      ],
      "edges": [
        {
          "source": "26067f13-4eb3-4912-8541-4ca86d4a0c69",
          "target": "29ac97b0-6263-42b7-be5b-42cec1da8b70",
          "type": "dependency"
        }
      ]
    }
    ```

#### F. Get Fragile Learning Alerts
*   **Path**: `GET /v1/student/alerts`
*   **Parameters**:
    *   `user_id` (Query, required): Student identifier
    *   `exam_type` (Query, required): `UPSC` or `CDS`
*   **Response Payload**:
    ```json
    [
      {
        "subtopic_id": "29ac97b0-6263-42b7-be5b-42cec1da8b70",
        "subtopic_name": "Preamble",
        "mastery_score": 0.7173,
        "volatility": 0.4899,
        "stability_index": 0.3659,
        "feedback": "You've shown mastery in Preamble, but your performance is inconsistent. We recommend a Deep Review to solidify your understanding."
      }
    ]
    ```

---

### 2. Adaptive Practice & Arena Endpoints (`/api/v1/arena`)

These endpoints drive the core practice session, question fetching, submissions, and Socratic hints.

#### A. Fetch Next Question
*   **Path**: `GET /api/v1/arena/next-question`
*   **Parameters**:
    *   `user_id` (Query, required): Student identifier
    *   `exam_type` (Query, required): `UPSC` or `CDS`
*   **Response Payload**:
    ```json
    {
      "id": "8ab173c5-73e3-47c3-811a-f1afd1c4dd9e",
      "text": "Mock Polity Question: President's Rule",
      "options": {
        "A": "1 only",
        "B": "2 only",
        "C": "Both",
        "D": "Neither"
      },
      "correct_answer": "C",
      "explanation": "Explanation...",
      "metadata": {
        "difficulty": 0.0,
        "discrimination": 1.2,
        "guessing": 0.25
      }
    }
    ```

#### B. Submit Practice Response
*   **Path**: `POST /api/v1/arena/submit`
*   **Request Payload**:
    ```json
    {
      "user_id": "student_007",
      "question_id": "8ab173c5-73e3-47c3-811a-f1afd1c4dd9e",
      "selected_option": "C",
      "response_time_seconds": 32.5,
      "confidence_rating": 4,
      "exam_type": "UPSC"
    }
    ```
*   **Response Payload**:
    ```json
    {
      "is_correct": true,
      "correct_answer": "C",
      "explanation": "Explanation...",
      "new_theta": 0.2796,
      "theta_delta": 0.2796,
      "mastery_percentage": 53.5,
      "predicted_score": 106.99,
      "accuracy_margin": 28.28
    }
    ```

#### C. Ask Socratic Tutor
*   **Path**: `POST /api/v1/tutor/chat`
*   **Request Payload**:
    ```json
    {
      "user_id": "student_007",
      "question_id": "8ab173c5-73e3-47c3-811a-f1afd1c4dd9e",
      "message": "Can you give me a hint without revealing the correct option?"
    }
    ```
*   **Response Payload**:
    ```json
    {
      "reply": "Consider the relationship between parliamentary approval and the duration of President's Rule. How long can it continue without a resolution?"
    }
    ```

---

### 3. Exam Intelligence Endpoints (`/api/v1/intelligence`)

These endpoints compute macro syllabus metrics, semantic trends, and expert weight overrides.

#### A. Expert Overrides
*   **Path**: `POST /api/v1/intelligence/expert-override`
*   **Request Payload**:
    ```json
    {
      "topic_id": "7e4b8e44-58eb-487c-8cd0-cb43834031e7",
      "year": 2026,
      "exam_type": "UPSC",
      "expert_weight": 1.5,
      "expert_note": "Crucial update due to new federalism guidelines"
    }
    ```
*   **Response Payload**:
    ```json
    {
      "topic_id": "7e4b8e44-58eb-487c-8cd0-cb43834031e7",
      "year": 2026,
      "exam_type": "UPSC",
      "previous_priority": 0.7651,
      "updated_priority": 1.0,
      "expert_weight": 1.5,
      "ai_reasoning": "Ranked high due to a 5-year appearance gap and strong alignment with current affairs."
    }
    ```

#### B. Dashboard Summary
*   **Path**: `GET /api/v1/intelligence/dashboard-summary`
*   **Parameters**:
    *   `user_id` (Query, required): Student identifier
    *   `exam_type` (Query, required): `UPSC` or `CDS`
*   **Response Payload**:
    ```json
    {
      "radar_data": [
        {
          "year": "2024",
          "Cluster_1_Static": 40.0,
          "Cluster_2_Dynamic": 40.0,
          "Cluster_3_Applied": 20.0
        }
      ],
      "priority_list": [
        {
          "topic_id": "7e4b8e44-58eb-487c-8cd0-cb43834031e7",
          "topic_name": "Emergency Provisions",
          "year": 2026,
          "priority_score": 1.0,
          "drift_index": 0.045,
          "ai_reasoning": "..."
        }
      ],
      "student_gap": [
        {
          "topic_id": "7e4b8e44-58eb-487c-8cd0-cb43834031e7",
          "topic_name": "Emergency Provisions",
          "priority_score": 1.0,
          "user_accuracy": 0.6667,
          "personalized_urgency": 0.3333,
          "ai_reasoning": "..."
        }
      ],
      "difficulty_trend": [
        {
          "year": 2026,
          "linguistic_complexity_grade": 12.61,
          "trap_density": 0.7519,
          "composite_complexity": 0.6912
        }
      ]
    }
    ```

---

### 4. Admin / Research Endpoints (`/api/v1/research`)

*Requires `X-Research-Key` header token verification.*

#### A. Fetch Research Metrics
*   **Path**: `GET /api/v1/research/metrics`
*   **Headers**:
    *   `X-Research-Key` (required): API secret token
*   **Response Payload**:
    ```json
    {
      "auc_roc": 0.852,
      "rmse": 0.521,
      "sample_size": 30,
      "precision_10": 0.80,
      "precision_20": 0.75,
      "recall_10": 0.70,
      "faithfulness": 0.92,
      "answer_relevance": 0.88,
      "context_precision": 0.95,
      "learning_gain": [],
      "topic_drift": [],
      "ece": 0.082,
      "brier_score": 0.266,
      "reliability_diagram": [],
      "xai_justifications": []
    }
    ```

#### B. Export Thesis Report
*   **Path**: `GET /api/v1/research/export`
*   **Parameters / Headers**:
    *   `research_key` (Query parameter) or `X-Research-Key` (Header)
*   **Response**: Binary response (`text/html`) downloading `empirical_validation_report.html`.
