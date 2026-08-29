# OFFICER'S ARENA: A COMPREHENSIVE PLATFORM FOR COMPETITIVE EXAM PREPARATION

[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL & Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini Vision AI](https://img.shields.io/badge/Vision%20AI-Gemini%203.6%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

An enterprise-grade, research-backed adaptive examination intelligence platform engineered for high-stakes competitive defense examinations (UPSC CDS, NDA, AFCAT). **Officer's Arena** combines **3-Parameter Logistic (3PL) Item Response Theory (IRT)**, **Bayesian Knowledge Tracing (BKT)**, **Spaced Repetition Systems (SRS)**, and **Multi-Modal Vision AI Document Extraction** into a unified ecosystem.

---

## 🌟 Key Features & Core Capabilities

### 1. 📄 Automated Multi-Modal Vision AI Ingestion Pipeline
- **Zero-Manual Typing**: Converts non-selectable, scanned physical examination papers (PDFs) into structured, JSON-schema-compliant relational records.
- **PyMuPDF + Gemini 3.6 Flash**: Renders high-resolution page scans and utilizes vision prompting to extract question stems, multi-choice option sets (A, B, C, D), correct answer keys, and logical explanations.
- **Unified CLI Tool (`ingest_paper.py`)**: One-line terminal ingestion (`python scripts/ingest_paper.py`) with automatic temporary scan cleanup and SQLModel batch insertion.

### 2. 🎯 Dynamic Item Response Theory (IRT) Engine
- **3PL & 2PL Logistic Models**: Estimates student latent ability ($\theta \in [-3.0, +3.0]$), item difficulty ($b$), item discrimination ($a$), and pseudo-guessing probability ($c$).
- **Flow-State Target Matching**: Adaptively selects questions with success probability $P(\theta) \in [0.5, 0.7]$ to optimize cognitive engagement and avoid anxiety/boredom.
- **Self-Correcting Parameter Calibration**: Background Maximum Likelihood Estimation (MLE) workers auto-recalibrate question difficulty ($b$) based on empirical student response telemetry.

### 3. 🧠 Student Digital Twin & Metacognitive Knowledge Tracing
- **Real-Time Latent Ability Updates**: Updates $\theta$ instantly following response events via Expected A Posteriori (EAP) Bayesian estimation.
- **Sub-Topic Mastery Tracking**: Confidence-weighted Bayesian Knowledge Tracing (BKT) adjusts topic mastery based on correctness, response time ($t_{response}$), and self-reported confidence sliders.
- **Ebbinghaus Memory Stability Decay**: Integrates modified SM-2 spaced repetition algorithms to calculate memory half-life and trigger automated review queues.

### 4. 🤖 Theta-Conditioned AI Tutor (Google Gemini)
- **Ability-Aware Explanations**: Generates dynamic hints and step-by-step logic tailored to the candidate's proficiency level:
  - *Beginner ($\theta < -1.0$)*: Core definitions and foundational concepts.
  - *Intermediate ($-1.0 \le \theta \le 1.0$)*: Logical linkages, reasoning pathways, and distractor traps.
  - *Advanced ($\theta > 1.0$)*: Deep nuances, subtle edge cases, and time-saving shortcuts.

### 5. 🔬 Research Suite & XAI Priority Matrix Dashboard
- **Explainable AI (XAI) Decision Popovers**: Visualizes AI decision-making criteria (Mastery Gap, Exam Recency, Learning Curve Weight) for topic prioritization.
- **Real-Time System Logs & Telemetry Export**: Downloadable formatted PDF research reports via `jsPDF` and raw telemetry data in JSON format.
- **A/B Testing Framework**: Built-in control (`is_adaptive = False`) vs. experimental (`is_adaptive = True`) toggles to scientifically evaluate CAT efficiency against linear testing.

### 6. 🛡️ Robust Security & Vector Search Fallbacks
- **Prompt Injection Guardrails**: Pre-processes and sanitizes user input to prevent prompt injection attacks during automated tutoring sessions.
- **pgvector Embedding Resiliency**: Maintains 1536-dimensional embedding vectors for semantic similarity search with automatic dummy-vector fallback logic during API downtime.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Data Ingestion Pipeline
        A[Raw Scanned Exam PDF] -->|PyMuPDF Rendering| B[High-Res Page Scans]
        B -->|Gemini 3.6 Flash Vision AI| C[Structured JSON Question Schema]
        C -->|CLI Tool: ingest_paper.py| D[(Supabase PostgreSQL Database)]
    end

    subgraph FastAPI Cognitive Core
        D -->|SQLModel Queries| E[Adaptive Arena Service]
        E -->|3PL/2PL IRT Engine| F[Student Ability Estimation θ]
        E -->|Confidence BKT| G[Subtopic Mastery Vector]
        E -->|SM-2 Scheduler| H[Spaced Repetition Priority Queue]
    end

    subgraph Student Metacognitive Interface
        F & G & H -->|Sub-100ms API| I[Next.js 14 Web Command Center]
        I -->|User Practice & Confidence Rating| E
        I -->|Theta-Conditioned Tutoring| J[Google Gemini AI Tutor]
    end
```

---

## 📐 Mathematical Foundations

### Item Response Theory (3PL Model)
$$P_i(\theta) = c_i + \frac{1 - c_i}{1 + e^{-a_i (\theta - b_i)}}$$

Where:
- $\theta \in [-3.0, +3.0]$: Student latent trait / ability level.
- $a_i \in [0.5, 2.5]$: Item discrimination index.
- $b_i \in [-3.0, +3.0]$: Item difficulty parameter.
- $c_i \in [0.0, 0.25]$: Pseudo-guessing probability.

### Latent Ability Update Rule (MLE Step)
$$\theta_{new} = \theta_{old} + \eta \cdot (u_i - P_i(\theta_{old})) \cdot a_i$$

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14, React, TypeScript | Modern responsive BENTO-grid UI & exam simulator |
| **State & Styling** | Zustand, TailwindCSS, Framer Motion | Metacognitive telemetry state & micro-animations |
| **Backend API** | Python 3.11+, FastAPI, SQLModel | Low-latency REST microservices & IRT engine |
| **Database** | Supabase PostgreSQL, `pgvector` | Vector embeddings, relational schema, row-level security |
| **Vision & Extraction** | PyMuPDF (`pymupdf`), Google Gemini Flash | Automated PDF rendering & visual question parsing |
| **Analytics & Export** | jsPDF, Chart.js, Recharts | Dynamic telemetry rendering & academic report generation |

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and `pnpm` / `npm`
- PostgreSQL / Supabase connection credentials

### 2. Environment Configuration
Create `apps/api/.env`:
```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
GEMINI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key_optional
```

### 3. Backend Setup (FastAPI)
```powershell
cd apps/api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup (Next.js 14)
```powershell
cd apps/web
npm install
npm run dev
```
Open `http://localhost:3000` to launch the Officer's Arena web command center.

---

## 🚀 Terminal Paper Ingestion CLI Usage

To ingest any new physical exam paper PDF into the production database:

1. Place your PDF inside `data/raw_papers/` (e.g. `data/raw_papers/cds/YOUR_PAPER.pdf`).
2. Run the unified CLI ingestion tool:

```powershell
apps/api/venv/Scripts/python scripts/ingest_paper.py
```

*Or target a specific paper file with explicit parameters:*
```powershell
apps/api/venv/Scripts/python scripts/ingest_paper.py data/raw_papers/cds/CDS-I-26-ENGLISH.pdf --exam CDS --year 2026 --subject English
```

---

## 📚 Repository Structure

```
officers-arena/
├── apps/
│   ├── api/                   # FastAPI backend, SQLModel schemas, IRT engine
│   └── web/                   # Next.js 14 frontend, Bento Dashboard, XAI Matrix
├── data/
│   ├── raw_papers/            # Exam PDF storage directory
│   └── processed/             # Auto-cleaned ingestion working files
├── docs/
│   └── officers_arena_research_proposal.md  # Comprehensive 10-section Academic Paper
├── scripts/
│   ├── ingest_paper.py        # Unified CLI Multi-Modal Paper Ingestion Tool
│   ├── calibrate_questions.py # MLE Item Calibration Worker
│   └── run_validator.py       # Data Integrity Verification Suite
├── pyrightconfig.json         # Python IDE type-checking configuration
└── README.md                  # Project Documentation
```

---

## 📄 License & Citation

This project is licensed under the MIT License. If you use **Officer's Arena** in your academic research, please cite:

```bibtex
@article{officers_arena_2026,
  title={Officer's Arena: A Comprehensive Platform for Competitive Exam Preparation},
  author={Officers Arena Engineering & Research Team},
  journal={Academic Research Suite & Adaptive Testing Intelligence},
  year={2026}
}
```
