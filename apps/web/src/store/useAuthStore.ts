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

      setExamMode: (examMode: ExamMode) => {
        set({ examMode });

        // Dynamically update global CSS theme accent variables
        if (typeof window !== "undefined") {
          const root = document.documentElement;
          if (examMode === "UPSC") {
            // Saffron / Gold theme accent
            root.style.setProperty("--accent-primary", "#d97706");
            root.style.setProperty("--accent-secondary", "#f59e0b");
            root.style.setProperty("--accent-glow", "rgba(217, 119, 6, 0.25)");
          } else {
            // Steel / Blue theme accent
            root.style.setProperty("--accent-primary", "#2563eb");
            root.style.setProperty("--accent-secondary", "#3b82f6");
            root.style.setProperty("--accent-glow", "rgba(37, 99, 235, 0.25)");
          }
        }
      },

      setUser: (user: StudentProfile | null) => {
        set({ user, isGuest: user === null });
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
