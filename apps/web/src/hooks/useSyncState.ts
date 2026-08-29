"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase/client";

export function useSyncState() {
  const { 
    user, 
    isGuest, 
    guestTheta, 
    guestMasteryMap, 
    setUser, 
    clearGuestData 
  } = useAuthStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  // 1. Listen for Supabase Auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        // Fetch User Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: session.user.email,
            full_name: profile.full_name,
            target_exam: profile.target_exam,
            target_year: profile.target_year,
            daily_goal_hours: profile.daily_goal_hours
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  // 2. Migration Function: Guest -> User Supabase Data Merge
  const migrateGuestData = useCallback(async (userId: string) => {
    setIsSyncing(true);
    setSyncStatus("syncing");

    try {
      // A. Prepare payload of local guest BKT mastery maps
      const entries = Object.entries(guestMasteryMap).map(([topic_name, mastery_score]) => ({
        user_id: userId,
        topic_name,
        mastery_score,
        updated_at: new Date().toISOString()
      }));

      if (entries.length > 0) {
        // B. Upsert into Supabase user_topic_mastery table
        const { error: supabaseErr } = await supabase
          .from("user_topic_mastery")
          .upsert(entries, { onConflict: "user_id,topic_name" });

        if (supabaseErr) {
          console.warn("[HybridSync] Supabase upsert error:", supabaseErr.message);
        }
      }

      // C. Call FastAPI Backend to sync Student Digital Twin State
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      await fetch(`${apiEndpoint}/v1/student/onboard/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          baseline_theta: guestTheta,
          mastery_map: guestMasteryMap
        })
      }).catch((e) => console.warn("[HybridSync] FastAPI sync fallback:", e));

      // D. Clear Guest Local Storage Cache upon success
      clearGuestData();
      setSyncStatus("success");
    } catch (error) {
      console.error("[HybridSync] Migration failed:", error);
      setSyncStatus("error");
    } finally {
      setIsSyncing(false);
    }
  }, [guestMasteryMap, guestTheta, clearGuestData]);

  return {
    user,
    isGuest,
    isSyncing,
    syncStatus,
    guestTheta,
    guestMasteryMap,
    migrateGuestData
  };
}
