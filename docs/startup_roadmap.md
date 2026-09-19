# The Startup Roadmap
## Scaling Officers Arena: From 100 to 100,000 Students

This document details the architectural evolution and scaling strategy to transition the current proof-of-concept codebase into a resilient, high-volume production platform.

---

### Phase 1: MVP Consolidation & Single-Instance Stability (100 to 1,000 Users)

#### Focus Areas
*   **Decouple SQLite Database**: Transition from SQLite (`aiosqlite`) to an external managed database instance (e.g., AWS RDS PostgreSQL or Supabase) to support multi-instance horizontal scaling.
*   **Vector Search Migration**: Move from in-memory / local mock vector calculations to native **pgvector** using index acceleration.
*   **Rate Limiting Implementation**: Add Token Bucket rate-limiting middleware to all expensive Socratic Chat (`/api/v1/tutor/chat`) endpoints to prevent credit drainage.
*   **Task Queue**: Offload heavy mathematical calibrations (e.g., EAP integration, Pearson correlation, and BKT background volatility runs) from the main request thread to a Celery or RQ task worker backed by Redis.

#### Architecture Topology
```
[Client App] ---> [FastAPI Web Server] ---> [PostgreSQL / pgvector]
                      |
                      v (Asynchronous enqueue)
                   [Redis] ---> [Celery Workers]
```

---

### Phase 2: Horizontal Scaling & Cache Optimization (1,000 to 10,000 Users)

#### Focus Areas
*   **Distributed Caching**: Implement Redis to cache static database assets (e.g., syllabus nodes, questions, and reference book chunks). Cache retrieval response targets should be $<50\text{ms}$.
*   **Vector Search Indexing**: As documents grow, switch pgvector queries from sequential scans to **HNSW (Hierarchical Navigable Small World)** indexes:
    ```sql
    CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);
    ```
    This drops vector search latency from $O(N)$ to $O(\log N)$.
*   **Kubernetes / ECS Containerization**: Deploy containerized FastAPI pods with horizontal autoscale (HPA) triggers scaling up based on CPU or active requests/sec.
*   **Student Twin Synchronization**: Replace periodic frontend polls with WebSockets or Server-Sent Events (SSE) to stream BKT mastery updates and fragile alerts to the UI in real time.

#### Metrics & Cost Control
*   **Semantic Cache**: Implement GPT-Cache or a similar semantic embedding cache to avoid redundant calls to LLMs for similar user queries, saving up to $40\%$ of API costs.

---

### Phase 3: High-Availability & Global Distribution (10,000 to 100,000 Users)

#### Focus Areas
*   **Database Read Replicas**: Separate transactional write traffic from analytical read queries. Root all dashboard visualizations and Mastery Galaxy fetches to regional PostgreSQL read replicas.
*   **Edge CDN Grounding**: Deploy reference materials (NCERT chapters, Laxmikanth summaries) to Cloudflare CDN edge nodes. Let the student's browser read static text directly from the edge, while only passing the retrieved context string to the API.
*   **Decoupled Analytic Pipelines**: Periodically extract attempt tables to an offline data lake (e.g., Snowflake or AWS Athena) to run long-term calibration, difficulty gradients, and backtesting validation scripts, isolating the primary OLTP database from analytical locks.
*   **Multi-Region Deployment**: Set up geographical instances of the API with latency-based DNS routing to minimize latency for users across different locations.

---

### Phase 4: OmniGraph & ChronoFact Knowledge Engine (Future Innovation)

#### Focus Areas & Conceptual Blueprint
*   **Database-Driven Knowledge Graph & Chronological Fact Engine**: Convert 25,236+ verified exam questions and 38 canonical textbooks into a linked semantic graph and chronological timeline stream.
*   **Core Capabilities**:
    1.  **Chronological Temporal Stream (`/timeline`)**: Interactive, zoomable timelines for Modern Indian History, Constitutional Acts (1773 Regulating Act to 2026 Amendments), International Treaties, and Landmark Judicial Verdicts. Every point on the timeline aggregates all related UPSC/CDS PYQs and verified textbook citations.
    2.  **Force-Directed Conceptual Knowledge Graph (`/graph`)**: Interactive node-link visualization connecting entities, constitutional articles, PESTLE dimensions, and syllabus topics with bidirectional question links.
    3.  **Atomic Fact Deconstruction Bank**: Statement-level verified fact cards extracted from multi-statement questions (*"Consider the following statements..."*), categorized with truth values, recurring exam frequencies, and common distractor trap flags.
    4.  **1-Click "Graph-to-Arena" Adaptive Bridge**: Direct handoff from any concept/timeline node into an adaptive practice set filtered to that exact topic node.

---

### Infrastructure Timeline

| Metric / Objective | Phase 1 (1k users) | Phase 2 (10k users) | Phase 3 (100k users) | Phase 4 (OmniGraph) |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Database** | Managed PostgreSQL | Managed PG + Read Replicas | Distributed PG + Analytical Lake | Graph Store / Hybrid PG+Apache AGE |
| **Vector DB** | pgvector (Flat Index) | pgvector (HNSW Index) | Dedicated Pinecone / Milvus Cluster | Graph-RAG Vector Entity Index |
| **Caching Layer** | Local memory | Redis (Single node) | Redis Cluster (Geographically dispersed) | Redis Graph Edge Cache |
| **Task Runner** | BackgroundTasks | Celery + Redis | Apache Airflow + RabbitMQ | Graph Extraction & Alignment Workers |
| **LLM Spend Shield** | Basic rate-limiting | Semantic cache + IP quotas | Per-user credit system / monthly tier | Local Entity Extraction Cache |
| **Target P95 Latency** | $<250\text{ms}$ | $<150\text{ms}$ | $<80\text{ms}$ | $<60\text{ms}$ (Graph Walk) |
