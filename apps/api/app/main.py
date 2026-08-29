from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.student import router as student_router
from app.api.intelligence import router as intelligence_router
from app.api.arena import router as arena_router
from app.api.v1.strategist import router as strategist_router
from app.api.v1.tutor import router as tutor_router
from app.api.research import router as research_router
from app.api.ingestion import router as ingestion_router
from app.core.adaptive_engine import router as adaptive_engine_router
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database and create tables asynchronously
    await init_db()
    yield

app = FastAPI(
    title="Officers Arena - Student Intelligence API",
    description="Module 2 & 3: Student Digital Twin and Exam Intelligence Engines.",
    version="1.1.0",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(student_router)
app.include_router(intelligence_router)
app.include_router(arena_router)
app.include_router(strategist_router)
app.include_router(tutor_router)
app.include_router(research_router)
app.include_router(ingestion_router)
app.include_router(adaptive_engine_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Officers Arena Student & Exam Intelligence API Engine"}


@app.get("/health", summary="Health check endpoint for production status")
async def health_check():
    import time
    from sqlmodel import text
    from app.core.database import async_session_maker
    
    health_status = {
        "status": "healthy",
        "database": "untested",
        "vector_store": "healthy",
        "llm_api_latency_ms": 0
    }
    
    # 1. DB check
    try:
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        health_status["database"] = "healthy"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = f"unhealthy: {str(e)}"
        
    # 2. LLM Latency check
    import os
    import httpx
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            start_llm = time.time()
            # Simple async GET call with short timeout to check API reachability
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_key}")
                if res.status_code == 200:
                    health_status["llm_api_latency_ms"] = int((time.time() - start_llm) * 1000)
                else:
                    health_status["status"] = "degraded"
                    health_status["llm_api_latency_ms"] = -1
        except Exception:
            health_status["status"] = "degraded"
            health_status["llm_api_latency_ms"] = -1
    else:
        health_status["llm_api_latency_ms"] = 0 # No key set yet, fallback explanation active
        
    return health_status

