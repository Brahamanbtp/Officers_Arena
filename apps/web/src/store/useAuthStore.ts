import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ExamMode, StudentProfile } from "../types/auth";

interface AuthState {
  examMode: ExamMode;
  user: StudentProfile | null;
  isGuest: boolean;
  guestTheta: number;
  guestMasteryMap: Record<string, number>;
  
  // Actions
  setExamMode: (mode: ExamMode) => void;
  setUser: (user: StudentProfile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateGuestMastery: (topic: string, score: number) => void;
  updateGuestTheta: (delta: number) => void;
  clearGuestData: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      examMode: "UPSC",
      user: null,
      isGuest: true,
      guestTheta: 0.0,
      guestMasteryMap: {
        "Indian Polity": 0.15,
        "Geography": 0.15,
        "Modern History": 0.15,
        "General Science": 0.15
      },

      setExamMode: async (examMode: ExamMode) => {
        set({ examMode });

        // 1. Dynamically update global CSS theme accent variables
        if (typeof window !== "undefined") {
          const root = document.documentElement;
          if (examMode === "UPSC") {
            root.style.setProperty("--accent-primary", "#d97706");
            root.style.setProperty("--accent-secondary", "#f59e0b");
            root.style.setProperty("--accent-glow", "rgba(217, 119, 6, 0.25)");
          } else {
            root.style.setProperty("--accent-primary", "#2563eb");
            root.style.setProperty("--accent-secondary", "#3b82f6");
            root.style.setProperty("--accent-glow", "rgba(37, 99, 235, 0.25)");
          }
        }

        // 2. Global Target Persistence: Sync target_exam with backend database
        const currentUser = get().user;
        const userId = currentUser ? currentUser.id : "student_999";
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

        try {
          await fetch(`${apiEndpoint}/v1/student/onboard`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              target_exam: examMode
            })
          });
        } catch (err) {
          console.warn("Failed to sync persistent target exam with backend:", err);
        }
      },

      setUser: (user: StudentProfile | null) => {
        set({ user, isGuest: user === null });
      },

      fetchProfile: async (userId: string) => {
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const examMode = get().examMode;
        try {
          const res = await fetch(`${apiEndpoint}/v1/student/profile/${userId}?exam_type=${examMode}`);
          if (res.ok) {
            const data = await res.json();
            set({
              user: {
                id: userId,
                full_name: data.user_name || "Cadet Officer",
                email: `${userId}@officersarena.in`,
                target_exam: (data.exam_type as ExamMode) || examMode,
                target_year: 2026,
                daily_goal_hours: 4,
                created_at: new Date().toISOString()
              },
              isGuest: false
            });
          }
        } catch (err) {
          console.warn("Failed to fetch persistent student profile:", err);
        }
      },

      updateGuestMastery: (topic: string, score: number) => {
        const currentMap = get().guestMasteryMap;
        set({
          guestMasteryMap: {
            ...currentMap,
            [topic]: score
          }
        });
      },

      updateGuestTheta: (delta: number) => {
        set((state) => ({ guestTheta: state.guestTheta + delta }));
      },

      clearGuestData: () => {
        set({
          guestTheta: 0.0,
          guestMasteryMap: {
            "Indian Polity": 0.15,
            "Geography": 0.15,
            "Modern History": 0.15,
            "General Science": 0.15
          }
        });
      }
    }),
    {
      name: "officers-arena-auth-store"
    }
  )
);
