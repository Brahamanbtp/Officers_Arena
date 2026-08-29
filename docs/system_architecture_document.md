# System Architecture Document (SAD)
## Officers Arena — Socratic AI Tutor & Exam Intelligence Platform

### 1. High-Level Architectural Diagram

Below is the conceptual high-level diagram illustrating the modular interactions between the Next.js 14 Web Portal, FastAPI Student Intelligence API, PostgreSQL / SQLite Database engines, and local Machine Learning/LLM pipelines.

```mermaid
graph TD
    %% Clients & Presentation Layer
    subgraph Client [Presentation Layer - Next.js 14]
        WebPortal["Web Portal (React, TypeScript, Tailwind)"]
        AdminDashboard["Admin Research Dashboard (Recharts)"]
    end

    %% API / Gateway Layer
    subgraph APILayer [Gateway & API Routing - FastAPI]
        StudentRouter["Student API Router (/v1/student)"]
        ArenaRouter["Arena Router (/api/v1/arena)"]
        IntelRouter["Intelligence Router (/api/v1/intelligence)"]
        ResearchRouter["Research Router (/api/v1/research)"]
    end

    %% Core Services / Engines Layer
    subgraph EngineLayer [Application & ML Engines]
        TutorService["Tutor Service (Socratic Hint, RAG Grounding)"]
        KTProcessor["BKT Engine (Bayesian Knowledge Tracing)"]
        HLREngine["HLR Engine (Half-Life Spaced Repetition)"]
        IRTEngine["IRT EAP Engine (Item Response Theory 3PL)"]
        DriftEngine["Exam Drift & Difficulty Analyzer (K-Means / NLP)"]
        EvaluationService["Validation Service (RMSE, Brier, RAGAS)"]
    end

    %% Storage & Persistence Layer
    subgraph DataStore [Persistence Layer]
        RelationalDB[("SQL database (SQLModel / PostgreSQL / SQLite)")]
        VectorStore[("Vector DB (pgvector / Chroma)")]
    end

    %% External APIs & Foundation Models
    subgraph FoundationModels [Foundation Models]
        GeminiAPI["Gemini AI (Socratic Grounded Tutor)"]
        OpenAIAPI["OpenAI / Local Embeddings (1536-dim)"]
    end

    %% Data Flow Connections
    WebPortal -->|HTTPS / WSS| StudentRouter
    WebPortal -->|HTTPS| ArenaRouter
    AdminDashboard -->|HTTP (with X-Research-Key Auth)| ResearchRouter
    
    StudentRouter & ArenaRouter & IntelRouter & ResearchRouter --> TutorService
    StudentRouter -->|Trigger Volatility background task| KTProcessor
    StudentRouter --> HLREngine
    ArenaRouter --> IRTEngine
    IntelRouter --> DriftEngine
    ResearchRouter --> EvaluationService
    
    TutorService & KTProcessor & HLREngine & IRTEngine & DriftEngine & EvaluationService -->|Async Session| RelationalDB
    TutorService -->|Cosine Similarity query| VectorStore
    
    TutorService -->|Structured Prompts| GeminiAPI
    DriftEngine & EvaluationService -->|Text Embeddings| OpenAIAPI
```

---

### 2. Module Specifications

#### A. Presentation Layer (Next.js 14)
*   **Routing Architecture**: Client-side rendering under the App Router framework.
*   **State Management**: Zustand lightweight store (`useArenaStore`) syncing session attempts, metacognitive inputs, and current active question states.
*   **UI/UX Paradigm**: Mobile-responsive CSS layout obeying a strict 8px grid and standard interactive minimum dimensions ($\ge 44 \times 44\text{px}$) to secure premium touch targets.

#### B. API Gateway (FastAPI)
*   **Framework**: Python FastAPI leveraging high-performance asynchronous loop handlers (`async/await` with `uvicorn`).
*   **Authentication & Guardrails**:
    *   *Student Scope*: Stateless UUID-based user mappings.
    *   *Admin / Research Scope*: Protected by `APIKeyHeader` token validation check (`X-Research-Key`) which prevents arbitrary user traversal to evaluation metrics.
*   **Input Sanitization**: Regular expression signature filters (`sanitize_chat_message`) targeting Cross-Site Scripting (XSS) and Prompt Injection overrides.

#### C. Machine Learning & Cognitive Modeling Engines
1.  **Bayesian Knowledge Tracing (BKT)**:
    Estimates a student's latent probability of subtopic mastery $P(L_t)$ via recursive updates based on correct/incorrect attempts:
    $$P(L_{t+1}) = P(L_t \mid \text{Response}) + (1 - P(L_t \mid \text{Response})) \cdot P(T)$$
2.  **Half-Life Regression (HLR)**:
    Integrates Spaced Repetition (SM-2 quality ratings) and cognitive decay factors to estimate the recall probability $P(\Delta t)$ after an elapsed interval $\Delta t$:
    $$P(\Delta t) = 2^{-\frac{\Delta t}{h}}$$
    where $h$ is the calculated memory half-life in days.
3.  **Item Response Theory (IRT - 3PL Model)**:
    Models question correctness probability based on student ability ($\theta$), item difficulty ($b$), discrimination ($a$), and pseudo-guessing factor ($c$):
    $$P(\theta) = c + \frac{1 - c}{1 + e^{-a(\theta - b)}}$$
    Estimations of $\theta$ are performed using Expected A Posteriori (EAP) updates over Quadrature Nodes.

#### D. Storage and Database Layer
*   **Relational Model**: Implemented using SQLModel (SQLAlchemy wrapper) mapping entities like `StudentAttempt`, `StudentMastery`, `Syllabus`, and `Questions`.
*   **Vector Search**: pgvector integration with cosine distance metric ($1 - \text{similarity}$). If cosine distance $> 0.3$, the system prevents halluncinations by outputting a fallback guardrail string.

---

### 3. Design Decisions & Trade-Offs

| Decision | Alternative Considered | Chosen Rationale / Trade-Off |
| :--- | :--- | :--- |
| **SQLModel (SQLite + aiosqlite)** | PostgreSQL / Prisma | High-velocity local testing, zero-configuration local database seeding, and clean SQLite memory instances for isolated test suites. |
| **EAP Quadrature Integration** | MCMC (Markov Chain Monte Carlo) | EAP updates are deterministic, highly performant, and run inside the request loop without introducing blocking I/O latency. |
| **Grounded LLM Guardrails** | Fine-tuned custom models | RAG-grounded system instructions using Gemini API are cheaper, modularly updateable, and guarantee zero-drift responses. |
