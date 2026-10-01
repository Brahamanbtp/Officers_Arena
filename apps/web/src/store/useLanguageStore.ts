import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "EN" | "HI";

interface LanguageState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (enText: string, hiText: string) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "EN",
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set({ language: get().language === "EN" ? "HI" : "EN" }),
      t: (enText: string, hiText: string) => (get().language === "HI" ? hiText : enText),
    }),
    {
      name: "officers_language_preference",
    }
  )
);
