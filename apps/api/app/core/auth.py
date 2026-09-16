import os
import logging
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
import jwt
from dotenv import load_dotenv

load_dotenv("apps/api/.env")

logger = logging.getLogger("core.auth")

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

async def get_current_user_optional(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency to authenticate requests using Supabase JWT Bearer tokens.
    Returns decoded token dictionary if valid, or None for guest sessions.
    """
    if not authorization:
        return None
        
    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
        
    token = parts[1]
    
    # 1. Decode token payload (with signature verification if secret is configured)
    try:
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token, 
                SUPABASE_JWT_SECRET, 
                algorithms=["HS256"], 
                options={"verify_aud": False}
            )
        else:
            # Fallback to unverified decode in local dev when secret is not provisioned
            payload = jwt.decode(
                token, 
                options={"verify_signature": False}
            )
        return payload
    except Exception as e:
        logger.warning(f"JWT Token validation failed: {str(e)}")
        return None

async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Strict FastAPI dependency requiring a valid Bearer token.
    Raises HTTP 401 if missing or invalid.
    """
    user = await get_current_user_optional(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or are invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def verify_user_authorization(authenticated_user: Optional[Dict[str, Any]], requested_user_id: str) -> bool:
    """
    Ensures that an authenticated user can only access/modify their own user_id records.
    If authenticated, token 'sub' MUST match requested_user_id.
    """
    if authenticated_user:
        auth_sub = authenticated_user.get("sub") or authenticated_user.get("id")
        if auth_sub and auth_sub != requested_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Token identity '{auth_sub}' does not match requested user_id '{requested_user_id}'."
            )
    return True
