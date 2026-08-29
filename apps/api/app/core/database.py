import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel

# Load database URL from environment or fallback
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Use standard local test SQLite database with aiosqlite driver for async operation
    DATABASE_URL = "sqlite+aiosqlite:///data/test_officers_arena.db"

# Translate postgres:// to postgresql+asyncpg:// if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://")
elif DATABASE_URL.startswith("sqlite:///"):
    DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")

# Create Async Engine
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "postgresql" in DATABASE_URL:
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    }

async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args
)

# Async Session Factory using SQLAlchemy 2.0 async_sessionmaker
async_session_maker = async_sessionmaker(
    async_engine,
    expire_on_commit=False
)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an AsyncSession.
    """
    async with async_session_maker() as session:
        yield session

async def init_db():
    """
    Initializes database tables asynchronously.
    """
    # Import all models to ensure they are registered with SQLModel.metadata
    from app.models.database import Syllabus, Questions, QuestionImages
    from app.models.student_stats import (
        StudentAttempt, StudentMastery, MetacognitiveStats, TopicMastery, 
        UserActivityLog, TutorChatSession
    )
    
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
