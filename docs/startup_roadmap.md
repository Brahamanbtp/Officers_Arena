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

### Infrastructure Timeline

| Metric / Objective | Phase 1 (1k users) | Phase 2 (10k users) | Phase 3 (100k users) |
| :--- | :--- | :--- | :--- |
| **Primary Database** | Managed PostgreSQL | Managed PG + Read Replicas | Distributed PG + Analytical Lake |
| **Vector DB** | pgvector (Flat Index) | pgvector (HNSW Index) | Dedicated Pinecone / Milvus Cluster |
| **Caching Layer** | Local memory | Redis (Single node) | Redis Cluster (Geographically dispersed) |
| **Task Runner** | BackgroundTasks | Celery + Redis | Apache Airflow + RabbitMQ |
| **LLM Spend Shield** | Basic rate-limiting | Semantic cache + IP quotas | Per-user credit system / monthly tier |
| **Target P95 Latency** | $<250\text{ms}$ | $<150\text{ms}$ | $<80\text{ms}$ |
