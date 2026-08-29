"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrainCircuit, Activity, BookOpen, TrendingUp, Sparkles, Moon, Sun, ChevronDown } from "lucide-react";
import { useArenaStore } from "@/src/store/useArenaStore";

export const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const mode = useArenaStore((state) => state.mode);
  const setMode = useArenaStore((state) => state.setMode);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showExamDropdown, setShowExamDropdown] = useState(false);

  const applyThemeToDOM = (selectedTheme: "dark" | "light") => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (selectedTheme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }
    }
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("officers_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    applyThemeToDOM(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("officers_theme", nextTheme);
    applyThemeToDOM(nextTheme);
  };

  const isLight = theme === "light";

  const isArenaActive = pathname === "/" || pathname === "/arena";
  const isLibraryActive = pathname === "/library";
  const isGrowthActive = pathname === "/growth" || pathname.startsWith("/growth");
  const isStrategistActive = pathname === "/strategist";

  const handleSwitchExam = (newMode: "UPSC" | "CDS") => {
    setMode(newMode);
    setShowExamDropdown(false);
  };

  return (
    <header className={`p-4 border-b sticky top-0 backdrop-blur-md z-30 transition-colors ${
      isLight ? "bg-white/95 border-neutral-200 text-neutral-950" : "bg-neutral-900/80 border-neutral-800 text-neutral-100"
    }`}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Logo & App Title */}
        <Link href="/arena" className="flex items-center gap-3 group">
          <div className="p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-md group-hover:scale-105 transition-all">
            <BrainCircuit className="w-6 h-6 text-neutral-950" />
          </div>
          <div>
            <h1 className={`text-base font-black tracking-wider uppercase ${isLight ? "text-neutral-950" : "text-white"}`}>
              Officers Arena
            </h1>
            <p className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">
              UPSC / CDS Adaptive Platform
            </p>
          </div>
        </Link>

        {/* Level 1 Navigation Bar (Next.js File-Based Routing) */}
        <div className={`flex p-1 rounded-xl border transition-all ${
          isLight ? "bg-neutral-100 border-neutral-200" : "bg-neutral-950 border-neutral-800"
        }`}>
          <Link
            href="/arena"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isArenaActive 
                ? "bg-amber-600 text-neutral-950 shadow-md font-black" 
                : `${isLight ? "text-neutral-700 hover:text-neutral-950" : "text-neutral-300 hover:text-white"}`
            }`}
          >
            <Activity className="w-4 h-4" />
            Arena
          </Link>

          <Link
            href="/library"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isLibraryActive 
                ? "bg-amber-600 text-neutral-950 shadow-md font-black" 
                : `${isLight ? "text-neutral-700 hover:text-neutral-950" : "text-neutral-300 hover:text-white"}`
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Library
          </Link>

          <Link
            href="/growth"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isGrowthActive 
                ? "bg-amber-600 text-neutral-950 shadow-md font-black" 
                : `${isLight ? "text-neutral-700 hover:text-neutral-950" : "text-neutral-300 hover:text-white"}`
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Growth
          </Link>

          <Link
            href="/strategist"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isStrategistActive 
                ? "bg-amber-600 text-neutral-950 shadow-md font-black" 
                : `${isLight ? "text-neutral-700 hover:text-neutral-950" : "text-neutral-300 hover:text-white"}`
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Strategist
          </Link>
        </div>

        {/* Active Exam Target Dropdown & Theme Toggle */}
        <div className="flex items-center gap-3">
          
          {/* Active Exam Target Badge */}
          <div className="relative">
            <button
              onClick={() => setShowExamDropdown(!showExamDropdown)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                mode === "UPSC"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:border-amber-500"
                  : "bg-blue-500/10 border-blue-500/40 text-blue-400 hover:border-blue-500"
              }`}
            >
              <span>Target: {mode}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {showExamDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#121212] border border-neutral-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1">
                <button
                  onClick={() => handleSwitchExam("UPSC")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    mode === "UPSC" ? "bg-amber-500/20 text-amber-400 font-black" : "text-neutral-300 hover:bg-neutral-900"
                  }`}
                >
                  <span>UPSC CSE Prelims</span>
                  {mode === "UPSC" && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                </button>

                <button
                  onClick={() => handleSwitchExam("CDS")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    mode === "CDS" ? "bg-blue-500/20 text-blue-400 font-black" : "text-neutral-300 hover:bg-neutral-900"
                  }`}
                >
                  <span>CDS Exam</span>
                  {mode === "CDS" && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </button>

                <div className="border-t border-neutral-800 pt-1 text-[10px] text-neutral-500 font-mono text-center py-1">
                  Global Target Persistent
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isLight 
                ? "bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100" 
                : "bg-neutral-900 border-neutral-800 text-neutral-200 hover:text-white"
            }`}
            title="Toggle Dark / Light Theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

        </div>

      </div>
    </header>
  );
};

export default AppHeader;
