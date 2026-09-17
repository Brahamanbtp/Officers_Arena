/**
 * Authentication and User Identity Utility
 * Resolves persistent user/guest IDs across Officers Arena client modules.
 */

export function getEffectiveUserId(): string {
  if (typeof window === "undefined") {
    return "guest_cadet";
  }

  // 1. Check logged-in user or stored credentials
  const storedUserId = localStorage.getItem("oa_user_id");
  if (storedUserId && storedUserId.trim() !== "") {
    return storedUserId;
  }

  // 2. Check zustand persisted auth store
  try {
    const authStoreRaw = localStorage.getItem("officers-arena-auth-store");
    if (authStoreRaw) {
      const parsed = JSON.parse(authStoreRaw);
      if (parsed?.state?.user?.id) {
        return parsed.state.user.id;
      }
    }
  } catch (e) {
    // ignore parse error
  }

  // 3. Check or generate guest ID
  let guestId = localStorage.getItem("oa_guest_id");
  if (!guestId || guestId.trim() === "" || guestId === "student_999") {
    guestId = "guest_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("oa_guest_id", guestId);
  }

  return guestId;
}
