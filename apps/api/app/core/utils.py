import uuid
from typing import Any

def resolve_user_uuid(user_id_val: Any) -> uuid.UUID:
    """
    Safely resolves any user identifier (UUID string, username, guest string, or None)
    into a deterministic, valid UUID.
    """
    if isinstance(user_id_val, uuid.UUID):
        return user_id_val
    if not user_id_val:
        return uuid.uuid5(uuid.NAMESPACE_DNS, "guest_student")
    try:
        return uuid.UUID(str(user_id_val))
    except (ValueError, TypeError, AttributeError):
        return uuid.uuid5(uuid.NAMESPACE_DNS, str(user_id_val))
