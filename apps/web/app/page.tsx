"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Zap, 
  Target, 
  PenTool, 
  Flame, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  BrainCircuit, 
  Layers, 
  ShieldCheck,
  TrendingUp,
  Award,
  Globe2,
  Compass,
  FileText,
  Keyboard,
  ChevronRight,
  BarChart3,
  BookmarkCheck,
  Activity
} from "lucide-react";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { AppFooter } from "@/src/components/shared/AppFooter";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";
import { useArenaStore, EXAM_RULES } from "@/src/store/useArenaStore";

export default function HomePage() {
  const router = useRouter();
  const mode = useArenaStore((state) => state.mode);
  const setMode = useArenaStore((state) => state.setMode);

  // Daily dynamic stats
  const [streakCount, setStreakCount] = useState(1);
  const [currentAffairsLinkages, setCurrentAffairsLinkages] = useState<any[]>([]);
  const [countdownDays, setCountdownDays] = useState(245);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStreak = parseInt(localStorage.getItem("oa_streak_count") || "1", 10);
      setStreakCount(Math.max(1, isNaN(savedStreak) ? 1 : savedStreak));
    }
  }, []);

  // Compute live days countdown to upcoming exam cycle dynamically
  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    let targetDate: Date;

    if (mode === "UPSC") {
      // UPSC CSE Prelims is held in late May annually (e.g. May 24)
      const thisYearPrelims = new Date(currentYear, 4, 24, 9, 30);
      if (today < thisYearPrelims) {
        targetDate = thisYearPrelims;
      } else {
        targetDate = new Date(currentYear + 1, 4, 23, 9, 30);
      }
    } else {
      // CDS is held twice a year: CDS-I (mid-April) & CDS-II (early-September)
      const cds1 = new Date(currentYear, 3, 18, 9, 0);
      const cds2 = new Date(currentYear, 8, 6, 9, 0);
      if (today < cds1) {
        targetDate = cds1;
      } else if (today < cds2) {
        targetDate = cds2;
      } else {
        targetDate = new Date(currentYear + 1, 3, 18, 9, 0);
      }
    }

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    setCountdownDays(diffDays);
  }, [mode]);

  useEffect(() => {
    const fetchNews = async () => {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      try {
        const res = await fetch(`${apiEndpoint}/api/v1/intelligence/current-affairs?limit=3`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCurrentAffairsLinkages(data);
          }
        }
      } catch {
        // Fallback handled gracefully
      }
    };
    fetchNews();
  }, []);

  const examRule = EXAM_RULES[mode] || EXAM_RULES.UPSC;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#080808] text-neutral-100 selection:bg-amber-500 selection:text-neutral-950">
      <GuestWarningBanner />
      <AppHeader />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Top Command Banner: Exam Selector + Live Countdown + Daily Streak */}
        <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                  Active Mission Streak: {streakCount} {streakCount === 1 ? "Day" : "Days"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Target Calibrated
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white">
                Officer Command Center • {mode === "UPSC" ? "UPSC Civil Services (CSE)" : "Combined Defence Services (CDS)"}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="px-3.5 py-1.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-neutral-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Target: <strong className="text-amber-400 font-bold">{countdownDays} {countdownDays === 1 ? "Day" : "Days"}</strong> Remaining</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
                window.dispatchEvent(event);
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Jump</span>
              <kbd className="px-1 py-0.2 rounded bg-neutral-800 text-[10px] text-amber-400 font-bold">Ctrl+K</kbd>
            </button>
          </div>
        </div>

        {/* MASTER 1-CLICK ACTION HERO: Start Today's High-Yield Mission */}
        <div className="bg-gradient-to-br from-[#161616] via-[#121212] to-[#0d0d0d] border border-amber-500/40 hover:border-amber-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Primary Daily Directive
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  Estimated Time: <strong>18 Minutes</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Today&apos;s High-Yield Mission
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                {mode === "UPSC" ? (
                  <>The system has pre-calculated your exact daily dosage: <strong>10 Current Affairs Prelims PYQs</strong> + <strong>5 Weakness Scalpel Questions (Modern History & Polity)</strong> + <strong>1 Handwritten Mains Answer Evaluation</strong>.</>
                ) : (
                  <>The system has pre-calculated your exact daily dosage: <strong>10 High-Yield CDS PYQs</strong> + <strong>5 Weakness Scalpel Questions (Elementary Mathematics/English)</strong> + <strong>Speed Pacing Drills</strong>.</>
                )}
              </p>
            </div>

            {/* Master Action Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/arena?autoStart=true&count=10&mode=practice"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 cursor-pointer group"
              >
                <span>START TODAY&apos;S MISSION</span>
                <ArrowRight className="w-5 h-5 text-neutral-950 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Cutoff Predictor Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-800/80 font-mono text-xs">
            <div className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-xl space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase">Target Exam</span>
              <div className="text-base sm:text-lg font-black text-white font-mono">{mode === "UPSC" ? "UPSC CSE GS-1" : "CDS II Exam"}</div>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-xl space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase">Cutoff Benchmark</span>
              <div className="text-base sm:text-lg font-black text-neutral-300 font-mono">{examRule.passingCutoff} Marks</div>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-xl space-y-0.5">
              <span className="text-[10px] text-emerald-400 uppercase">Marking Scheme</span>
              <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">{examRule.markingSummary}</div>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-xl space-y-0.5">
              <span className="text-[10px] text-amber-400 uppercase">Adaptive Efficiency</span>
              <div className="text-base sm:text-lg font-black text-amber-300 font-mono">-76% Fatigue</div>
            </div>
          </div>
        </div>

        {/* HERO SECTION: The 3 Core Daily Rituals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                The 3 Daily Rituals
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Zero fluff. No 2-hour random question dumps. Only the 3 targeted rituals needed to clear the cutoff.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Ritual 1: 10-Min High-Yield Sprint */}
            <div className="bg-[#121212] border border-neutral-800 hover:border-amber-500/50 rounded-3xl p-6 flex flex-col justify-between gap-5 transition-all shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-24 h-24 text-amber-400" />
              </div>

              <div className="space-y-3 z-10">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider">
                    Ritual 1 • 10 Minutes
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~60s / Question
                  </span>
                </div>

                <h3 className="text-lg font-black text-white leading-snug group-hover:text-amber-400 transition-colors">
                  Daily High-Yield Sprint
                </h3>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  10 curated questions dynamically mapped to {mode === "UPSC" ? "current affairs and high-frequency PYQ concepts." : "CDS high-frequency topics and grammar rules."}
                </p>

                <div className="p-3 bg-neutral-900/80 border border-neutral-850 rounded-2xl text-[11px] font-mono text-neutral-300 space-y-1">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Syllabus Focus:</span>
                    <strong className="text-white">{mode === "UPSC" ? "Polity & Economy Linkages" : "English & Elementary Maths"}</strong>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Negative Marking:</span>
                    <strong className="text-red-400">-{examRule.negativeMarks} marks active</strong>
                  </div>
                </div>
              </div>

              <Link
                href="/arena?autoStart=true&count=10&mode=practice"
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer z-10"
              >
                <span>Launch 10-Min Sprint</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Ritual 2: Weakness Scalpel */}
            <div className="bg-[#121212] border border-neutral-800 hover:border-purple-500/50 rounded-3xl p-6 flex flex-col justify-between gap-5 transition-all shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-24 h-24 text-purple-400" />
              </div>

              <div className="space-y-3 z-10">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider">
                    Ritual 2 • Option Tracing AI
                  </span>
                  <span className="text-[11px] font-mono text-red-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Priority Leak
                  </span>
                </div>

                <h3 className="text-lg font-black text-white leading-snug group-hover:text-purple-300 transition-colors">
                  Weakness Scalpel Drill
                </h3>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your current error rate in <strong>Modern History (Freedom Movement Chronology)</strong> is 44%. Fix the specific cognitive trap.
                </p>

                <div className="p-3 bg-neutral-900/80 border border-neutral-850 rounded-2xl text-[11px] font-mono text-neutral-300 space-y-1">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Target Concept:</span>
                    <strong className="text-purple-300">Round Table Conferences & Acts</strong>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Remediation Target:</span>
                    <strong className="text-emerald-400">Spectrum Ch. 21-24</strong>
                  </div>
                </div>
              </div>

              <Link
                href="/arena?autoStart=true&count=5&subject=History&mode=practice"
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer z-10"
              >
                <span>Fix Weakness in 5 Questions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Ritual 3: Daily 1 Mains Answer Challenge */}
            <div className="bg-[#121212] border border-neutral-800 hover:border-emerald-500/50 rounded-3xl p-6 flex flex-col justify-between gap-5 transition-all shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <PenTool className="w-24 h-24 text-emerald-400" />
              </div>

              <div className="space-y-3 z-10">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider">
                    Ritual 3 • Handwritten OCR
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 30s Grading
                  </span>
                </div>

                <h3 className="text-lg font-black text-white leading-snug group-hover:text-emerald-300 transition-colors">
                  Daily 1 Mains Answer
                </h3>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Write on your real paper notebook, snap a photo with your phone, and get verified 5-rubric grading in 30 seconds.
                </p>

                <div className="p-3 bg-neutral-900/80 border border-neutral-850 rounded-2xl text-[11px] font-mono text-neutral-300 space-y-1">
                  <div className="text-neutral-400 line-clamp-2">
                    <strong className="text-white font-sans">Today's GS-2 Question: </strong>
                    &ldquo;Examine the discretionary powers of the Governor under Art. 163 in light of recent rulings.&rdquo;
                  </div>
                </div>
              </div>

              <Link
                href="/mains"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer z-10 font-mono"
              >
                <span>Snap Photo & Grade Answer</span>
                <ArrowRight className="w-4 h-4 text-neutral-950" />
              </Link>
            </div>

          </div>
        </div>

        {/* COMPLETE BENTO GRID: All Officers Arena Command Modules */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Unified Ecosystem
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Officer Preparation Matrix
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
              6 Integrated Modules &bull; Zero Fragmented Tools
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Module 1: Prelims CAT Arena */}
            <Link
              href="/arena"
              className="p-6 bg-[#121212] border border-neutral-800 hover:border-amber-500/50 rounded-3xl space-y-4 group transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors flex items-center justify-between">
                  <span>Prelims CAT Arena</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  3PL Item Response Theory test engine that adapts question difficulty in real time to calculate your true psychometric ability ($\theta$).
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-amber-400">24-Item Diagnostic</span>
                <span>Timer & Pacing Control</span>
              </div>
            </Link>

            {/* Module 2: Mains AES Evaluator */}
            <Link
              href="/mains"
              className="p-6 bg-[#121212] border border-neutral-800 hover:border-blue-500/50 rounded-3xl space-y-4 group transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <PenTool className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
                  <span>Mains 15M / 10M Evaluator</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Anchor-calibrated Rubric Evaluator for handwritten answers. Provides structural, analytical, and factual breakdown in 30 seconds.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-blue-400">5-Rubric Grading</span>
                <span>OCR + Camera Upload</span>
              </div>
            </Link>

            {/* Module 3: 360° Current Affairs Bridge */}
            <Link
              href="/current-affairs"
              className="p-6 bg-[#121212] border border-neutral-800 hover:border-emerald-500/50 rounded-3xl space-y-4 group transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Globe2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>360° Current Affairs Hub</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Aggregates top daily developments from 50+ sources with deep 360° GS Paper linkages, key concepts, and standard textbook cross-references.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-emerald-400">Live GS 1-4 Tagging</span>
                <span>Copy Revision Notes</span>
              </div>
            </Link>

            {/* Module 4: Standard Textbook Library */}
            <Link
              href="/library"
              className="p-6 bg-[#121212] border border-neutral-800 hover:border-amber-500/50 rounded-3xl space-y-4 group transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors flex items-center justify-between">
                  <span>Standard Textbook Library</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Chapter-by-chapter drills from canonical reference books: *Laxmikanth, NCERT Class 6-12, Spectrum Modern India, and Shankar IAS*.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-amber-400">15,720+ Questions</span>
                <span>AI Socratic Tutor</span>
              </div>
            </Link>

            {/* Module 5: Cognitive Strategist */}
            <Link
              href="/strategist"
              className="p-6 bg-[#121212] border border-neutral-800 hover:border-purple-500/50 rounded-3xl space-y-4 group transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-purple-400 transition-colors flex items-center justify-between">
                  <span>Cognitive Strategist</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Detects subconscious test-taking fallacies, elimination failure points, and guesswork biases before real exam day.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-purple-400">Cognitive Bias Radar</span>
                <span>Elimination Doctor</span>
              </div>
            </Link>

            {/* Module 6: Psychometric Growth & Trajectory */}
            <Link
              href="/growth"
              className="p-6 bg-[#121212] border border-neutral-800 hover:border-emerald-500/50 rounded-3xl space-y-4 group transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Growth & Trajectory</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Real-time ability curve ($\theta$), SEM (Standard Error of Measurement), syllabus mastery heatmaps, and cutoff probability forecasting.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-emerald-400">Predicted Cutoff Score</span>
                <span>Subject Mastery Bar</span>
              </div>
            </Link>

          </div>
        </div>

        {/* LIVE SYLLABUS BRIDGE: Current Affairs mapped to Textbook Chapters */}
        <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Live Current Affairs ↔ Static Syllabus Bridge
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Every major news development automatically linked to canonical textbook chapters (*Laxmikanth, NCERT, Shankar IAS*).
              </p>
            </div>
            <Link
              href="/current-affairs"
              className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Explore Daily Intelligence Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(currentAffairsLinkages.length > 0 ? currentAffairsLinkages : [
              {
                id: "ca-1",
                headline: "Supreme Court on Sub-Classification of Scheduled Castes",
                gs_paper: "GS-2 Polity",
                static_concept: "Article 14, 15(4), 16(4), 341 - Affirmative Action",
                textbook_reference: "M. Laxmikanth: Chapter on Fundamental Rights"
              },
              {
                id: "ca-2",
                headline: "RBI Framework on Project Finance & Infrastructure Lending",
                gs_paper: "GS-3 Economy",
                static_concept: "Banking Regulation Act 1949 & Capital Adequacy",
                textbook_reference: "Ramesh Singh: Chapter on Banking & Monetary Policy"
              },
              {
                id: "ca-3",
                headline: "India-France Defense Strategic Partnership & Jet Engine Deal",
                gs_paper: "GS-2 IR / CDS",
                static_concept: "Defense Indigenization & Joint Doctrine",
                textbook_reference: "Defense Studies: Indian Military Modernization"
              }
            ]).slice(0, 3).map((item: any) => (
              <div
                key={item.id}
                className="p-5 bg-neutral-900/50 border border-neutral-850 hover:border-amber-500/40 rounded-2xl flex flex-col justify-between gap-3 transition-all group"
              >
                <div className="space-y-2">
                  <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-amber-400 text-[10px] font-mono font-bold rounded uppercase">
                    {item.gs_paper}
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                    {item.headline}
                  </h4>
                </div>

                <div className="p-2.5 bg-neutral-950/80 border border-neutral-850 rounded-xl space-y-1 text-xs">
                  <div className="text-[11px] text-neutral-300">
                    <strong className="text-amber-400 font-mono">Concept: </strong>
                    {item.static_concept}
                  </div>
                  <div className="text-[10px] text-neutral-400 italic">
                    <strong className="text-purple-300 not-italic font-sans">Source: </strong>
                    {item.textbook_reference}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <AppFooter />
    </div>
  );
}
