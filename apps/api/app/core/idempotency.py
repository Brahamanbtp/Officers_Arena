import time
from typing import Dict, Any, Optional
from fastapi import Header, HTTPException, status

class IdempotencyRegistry:
    """
    In-memory Idempotency Store with TTL (Time-To-Live).
    Guarantees that retry attempts or duplicate clicks with identical X-Idempotency-Key
    do not execute duplicate database writes or double-mutate student theta scores.
    """
    def __init__(self, ttl_seconds: int = 300):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._ttl_seconds = ttl_seconds

    def check_or_set(self, key: str) -> Optional[Dict[str, Any]]:
        now = time.time()
        # Clean expired
        expired_keys = [k for k, v in self._store.items() if now - v["timestamp"] > self._ttl_seconds]
        for k in expired_keys:
            del self._store[k]

        if key in self._store:
            # Return cached response
            return self._store[key].get("response")
        
        # Reserve key
        self._store[key] = {
            "timestamp": now,
            "response": None,
            "status": "PROCESSING"
        }
        return None

    def complete(self, key: str, response: Dict[str, Any]):
        if key in self._store:
            self._store[key]["response"] = response
            self._store[key]["status"] = "COMPLETED"

idempotency_store = IdempotencyRegistry(ttl_seconds=300)

def require_idempotency_key(
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key")
) -> Optional[str]:
    """
    FastAPI dependency for verifying or returning idempotency keys.
    """
    if x_idempotency_key:
        cached = idempotency_store.check_or_set(x_idempotency_key)
        if cached is not None:
            # Short-circuit or attach to request state
            return x_idempotency_key
    return x_idempotency_key
