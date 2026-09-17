import asyncio
import time
import uuid
from typing import Dict, Any, Optional, Callable, Coroutine
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

class TaskStatus:
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class TaskResult(BaseModel):
    task_id: str
    status: str
    progress: int = 0
    created_at: float
    updated_at: float
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class TaskManager:
    """
    In-memory thread-safe Task Execution and Status Registry.
    Decouples heavy LLM/OCR and calibration workloads from synchronous HTTP cycles,
    preventing 504 Gateway Timeouts under high concurrency.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TaskManager, cls).__new__(cls)
            cls._instance._tasks: Dict[str, Dict[str, Any]] = {}
            cls._instance._lock = asyncio.Lock()
        return cls._instance

    async def create_task(self, task_type: str = "generic") -> str:
        task_id = f"task_{uuid.uuid4().hex[:12]}"
        now = time.time()
        async with self._lock:
            self._tasks[task_id] = {
                "task_id": task_id,
                "task_type": task_type,
                "status": TaskStatus.PENDING,
                "progress": 0,
                "created_at": now,
                "updated_at": now,
                "result": None,
                "error": None
            }
        return task_id

    async def update_task(
        self,
        task_id: str,
        status: str,
        progress: int = 0,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        async with self._lock:
            if task_id in self._tasks:
                self._tasks[task_id]["status"] = status
                self._tasks[task_id]["progress"] = progress
                self._tasks[task_id]["updated_at"] = time.time()
                if result is not None:
                    self._tasks[task_id]["result"] = result
                if error is not None:
                    self._tasks[task_id]["error"] = error

    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        async with self._lock:
            task = self._tasks.get(task_id)
            if task:
                return dict(task)
            return None

    def spawn_background_task(
        self,
        task_id: str,
        coro_func: Callable[[str], Coroutine[Any, Any, Any]]
    ):
        """
        Launches an async coroutine in the background event loop.
        """
        async def _wrapper():
            try:
                await self.update_task(task_id, TaskStatus.RUNNING, progress=10)
                result = await coro_func(task_id)
                await self.update_task(task_id, TaskStatus.COMPLETED, progress=100, result=result)
            except Exception as e:
                await self.update_task(task_id, TaskStatus.FAILED, progress=100, error=str(e))

        asyncio.create_task(_wrapper())

task_manager = TaskManager()

router = APIRouter(prefix="/api/v1/tasks", tags=["Background Tasks"])

@router.get("/{task_id}", response_model=TaskResult)
async def get_task_status(task_id: str):
    """
    Polls the real-time execution status and result payload of an asynchronous job.
    """
    task = await task_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found or expired."
        )
    return task
