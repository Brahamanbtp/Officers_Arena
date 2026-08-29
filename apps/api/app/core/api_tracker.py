import functools
import inspect
import asyncio
import logging
from typing import Callable, Any, Dict

from app.core.database import async_session_maker
from app.models.intelligence import CostLogs

logger = logging.getLogger("core.api_tracker")

# Model cost maps per million tokens (OpenAI & Anthropic prices as of 2026)
PRICING_REGISTRY = {
    "gpt-4o": {"prompt": 5.00, "completion": 15.00},
    "gpt-4o-mini": {"prompt": 0.15, "completion": 0.60},
    "claude-3-5-sonnet": {"prompt": 3.00, "completion": 15.00},
    "unknown": {"prompt": 2.00, "completion": 10.00}
}

async def log_usage_db(
    task_name: str,
    model_id: str,
    prompt_tokens: int,
    completion_tokens: int
):
    """
    Asynchronously saves the usage statistics and costs to the database.
    """
    total_tokens = prompt_tokens + completion_tokens
    
    # Pricing lookup
    base_model = "unknown"
    for key in PRICING_REGISTRY:
        if key in model_id.lower():
            base_model = key
            break
            
    rates = PRICING_REGISTRY[base_model]
    prompt_cost = (prompt_tokens / 1_000_000.0) * rates["prompt"]
    completion_cost = (completion_tokens / 1_000_000.0) * rates["completion"]
    total_cost = prompt_cost + completion_cost
    
    async with async_session_maker() as session:
        try:
            log = CostLogs(
                task_name=task_name,
                model_id=model_id,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                tokens_used=total_tokens,
                cost_usd=total_cost
            )
            session.add(log)
            await session.commit()
            logger.info(
                f"API Usage Logged: task='{task_name}' | model='{model_id}' | "
                f"tokens={total_tokens} | cost= ${total_cost:.6f}"
            )
        except Exception as e:
            logger.error(f"Failed to write API usage to CostLogs table: {e}")
            await session.rollback()

def track_api_usage(task_name: str):
    """
    FastAPI and Pipeline Decorator to intercept OpenAI/Claude completions,
    extract usage headers or object statistics, and commit usage logs.
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        
        def extract_metrics(response: Any) -> tuple:
            # Safely navigate OpenAI response structures
            prompt_tokens = 0
            completion_tokens = 0
            model_id = "unknown-model"
            
            if response is None:
                return model_id, prompt_tokens, completion_tokens
                
            try:
                # Try dict structure
                if isinstance(response, dict):
                    usage = response.get("usage", {})
                    prompt_tokens = usage.get("prompt_tokens", 0)
                    completion_tokens = usage.get("completion_tokens", 0)
                    model_id = response.get("model", "unknown-model")
                else:
                    # Try object attributes (standard OpenAI ChatCompletion)
                    usage_obj = getattr(response, "usage", None)
                    if usage_obj:
                        prompt_tokens = getattr(usage_obj, "prompt_tokens", 0)
                        completion_tokens = getattr(usage_obj, "completion_tokens", 0)
                    model_id = getattr(response, "model", "unknown-model")
            except Exception as e:
                logger.error(f"Error parsing token usage from LLM response: {e}")
                
            return model_id, prompt_tokens, completion_tokens

        if inspect.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                response = await func(*args, **kwargs)
                model_id, prompt_tokens, completion_tokens = extract_metrics(response)
                await log_usage_db(task_name, model_id, prompt_tokens, completion_tokens)
                return response
            return async_wrapper
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                response = func(*args, **kwargs)
                model_id, prompt_tokens, completion_tokens = extract_metrics(response)
                # Dispatch DB commit to background loop
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(
                            log_usage_db(task_name, model_id, prompt_tokens, completion_tokens)
                        )
                    else:
                        loop.run_until_complete(
                            log_usage_db(task_name, model_id, prompt_tokens, completion_tokens)
                        )
                except Exception as e:
                    logger.error(f"Could not dispatch log_usage_db from synchronous decorator context: {e}")
                return response
            return sync_wrapper
            
    return decorator
