# Security & Privacy Audit
## Officers Arena — AI Security, Data Governance, & Grounding Guardrails

This document compiles the security protocols, access control mechanisms, and data safety compliance audits implemented in the Officers Arena system.

---

### 1. Student Data Protection & Anonymization

#### A. Data Isolation
*   Student identity mapping is strictly separated from cognitive performance metrics. The database identifies student twins using random `UUID` keys (e.g., `user_id = 'student_999'`) rather than email addresses or phone numbers.
*   Personally Identifiable Information (PII) is encrypted at rest using AES-256 standard encryption keys.

#### B. Telemetry and Logging
*   Telemetry logs compiled by Sentry and LogRocket automatically scrub header cookies, authorization tokens, and student responses to ensure no sensitive content leaks to external monitoring partners.

---

### 2. Authorization Scoping & Role-Based Access Control (RBAC)

#### A. Endpoint Security Verification
All administrative endpoints (such as metrics monitoring, backtesting models, and synthetic generation) are explicitly quarantined behind a security gate:

```python
def verify_research_access(
    x_research_key: Optional[str] = Security(api_key_header),
    research_key: Optional[str] = Query(None)
):
    secret = os.getenv("RESEARCH_SECRET_KEY", "officers_research_secure_2026")
    key = x_research_key or research_key
    if not key or key != secret:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized research token. Verification failed."
        )
```

#### B. Tenant / User Separation
*   Student API routes (`/v1/student/profile/{user_id}`, `/v1/student/alerts`) validate that the requester's authenticated session identifier matches the target parameter.
*   A user possessing a standard "Student" credential cannot access administrative dashboards `/admin/research` or run backtests, which require the specific API Secret.

---

### 3. Input Sanitization & Vulnerability Mitigation

#### A. SQL Injection Shield
*   SQL injection risks are neutralized by using SQLModel / SQLAlchemy Object-Relational Mapping (ORM) structures with parameter binding on every execution query (no raw string concatenations).

#### B. Prompt Injection & XSS Mitigation
*   User inputs for the Socratic Chat route are sanitized before reaching the Gemini LLM pipeline.
*   A defensive filter checks for signature threat payloads (e.g., instructions attempting to hijack system prompts):

```python
def sanitize_chat_message(text: str) -> str:
    # Remove HTML/JS tags to block XSS
    clean = re.sub(r"<[^>]*>", "", text)
    
    # Block common prompt injection payloads
    blacklisted_patterns = [
        r"(ignore|bypass|override)\s+(the\s+)?(previous|system|above)\s+(instructions|prompts)",
        r"you\s+are\s+now\s+a\s+different\s+ai",
        r"reveal\s+(your\s+)?system\s+(prompt|instructions)"
    ]
    for pattern in blacklisted_patterns:
        if re.search(pattern, clean, re.IGNORECASE):
            return "[Threat Warning: Potential prompt injection payload blocked.]"
    return clean
```

---

### 4. Preventing AI Hallucinations & Ensuring Content Grounding

#### A. RAG Grounding Pipelines
*   The Socratic tutor does not answer student queries using its generic pre-trained weights.
*   Each query triggers a cosine-similarity retrieval scan over verified syllabus chapters (NCERT, reference texts, past UPSC papers) to build a prompt context:

```
[Student Message] ---> [Semantic Query] ---> [Vector Search in pgvector]
                                                      |
                                                      v
                                            [Retrieved Book Chunks]
                                                      |
                                                      v
[Grounded Prompt] <--- [Inject Chunks as System Context]
```

#### B. Cosine Distance Guardrail
*   To prevent the tutor from making up answers when verified source material is missing, the system enforces a strict similarity cutoff rule:
    *   **Distance threshold**: $0.3$ (meaning similarity must be $\ge 0.7$).
    *   If the nearest document distance exceeds $0.3$, the system immediately triggers the `FALLBACK_RESPONSE`: *"I cannot find a verified source in my current database to answer this accurately."*
*   Every chat response displays verified source citations (`source_book`, `page_number`, and `chapter_title`) to allow direct student validation.
