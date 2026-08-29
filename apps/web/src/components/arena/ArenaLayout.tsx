"use client";

import React from "react";
import { motion } from "framer-motion";
import { useArenaStore } from "../../store/useArenaStore";
import { TacticalTimer } from "./TacticalTimer";
import { Shield, Settings, Award } from "lucide-react";

interface ArenaLayoutProps {
  children: React.ReactNode;
  progressPercent: number; // e.g. 60 for 60%
  questionIndex: number;
  totalQuestions: number;
}

export const ArenaLayout: React.FC<ArenaLayoutProps> = ({
  children,
  progressPercent,
  questionIndex,
  totalQuestions
}) => {
  const mode = useArenaStore((state) => state.mode);
  const setMode = useArenaStore((state) => state.setMode);
  const sessionScore = useArenaStore((state) => state.sessionScore);

  // Set theme variables dynamically based on state
  const themeStyles = mode === "UPSC"
    ? {
        "--theme-primary": "#1B263B",
        "--theme-bg-gradient": "linear-gradient(135deg, #1B263B 0%, #0D1B2A 100%)",
        "--theme-accent": "#D4AF37",
        "--theme-font-family": "'Newsreader', 'Georgia', serif",
        "--theme-border": "#E5E5E5",
        "--theme-accent-light": "rgba(212, 175, 55, 0.15)"
      } as React.CSSProperties
    : {
        "--theme-primary": "#283618",
        "--theme-bg-gradient": "linear-gradient(135deg, #283618 0%, #111B07 100%)",
        "--theme-accent": "#FF5F1F",
        "--theme-font-family": "var(--font-geist-sans, sans-serif)",
        "--theme-border": "#3F4E2E",
        "--theme-accent-light": "rgba(255, 95, 31, 0.15)"
      } as React.CSSProperties;

  return (
    <div 
      style={themeStyles} 
      className={`min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900 transition-colors duration-500 font-sans`}
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--theme-accent)] transition-colors duration-300" />
            <h1 className="text-sm font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-white dark:to-neutral-400">
              The Adaptive Arena
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Tactical Timer */}
            <TacticalTimer />

            {/* Session Score Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-350">
              <Award className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
              <span>Score: <strong className="font-mono text-neutral-800 dark:text-white">{sessionScore}</strong></span>
            </div>

            {/* Active Exam Target Badge */}
            <div className={`px-2.5 py-1 text-[10px] font-extrabold tracking-widest uppercase rounded-lg border transition-all ${
              mode === "UPSC"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}>
              {mode} Target
            </div>
          </div>
        </div>

        {/* Global Test Progress Bar */}
        <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-900 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={`h-full transition-colors duration-500 ${
              mode === "UPSC" ? "bg-indigo-600" : "bg-amber-600"
            }`}
          />
        </div>
      </header>

      {/* Main Core Layout Body */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-start">
        {/* Test Progress Indicator Header */}
        <div className="flex items-center justify-between mb-4 px-1 text-xs font-bold text-neutral-400 uppercase tracking-widest">
          <span>Question {questionIndex} of {totalQuestions}</span>
          <span>{Math.round(progressPercent)}% Completed</span>
        </div>

        {/* Font Scope Styling applied to Question Content container */}
        <div 
          style={{ fontFamily: "var(--theme-font-family)" }}
          className="question-font-scope flex flex-col gap-6"
        >
          {children}
        </div>
      </main>

      {/* Footer info bar */}
      <footer className="border-t py-4 text-center text-[10px] tracking-wider uppercase font-bold text-neutral-400 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
        Officers Arena &copy; 2026 | METACOGNITIVE CALIBRATION ENGAGED
      </footer>
    </div>
  );
};
