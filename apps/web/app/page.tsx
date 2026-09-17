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
  Award
} from "lucide-react";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { AppFooter } from "@/src/components/shared/AppFooter";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";
import { useArenaStore } from "@/src/store/useArenaStore";

export default function HomePage() {
  const router = useRouter();
  const mode = useArenaStore((state) => state.mode);
  const setMode = useArenaStore((state) => state.setMode);

  // Daily dynamic stats
  const [streakCount] = useState(6);
  const [currentAffairsLinkages, setCurrentAffairsLinkages] = useState<any[]>([]);

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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#080808] text-neutral-100 selection:bg-amber-500 selection:text-neutral-950">
      <GuestWarningBanner />
      <AppHeader />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Top Command Banner: Exam Selector + Countdown + Streak */}
        <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                  Active Mission Streak: {streakCount} Days
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  On Track
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white">
                Daily Officer Command Hub • {mode === "UPSC" ? "UPSC Civil Services CSE 2026" : "Combined Defence Services (CDS II)"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300">
              Target: <strong className="text-amber-400">{mode === "UPSC" ? "Prelims May 2026" : "CDS Sept 2026"}</strong>
            </div>
            <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("UPSC")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  mode === "UPSC" ? "bg-amber-500 text-neutral-950 shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                UPSC
              </button>
              <button
                type="button"
                onClick={() => setMode("CDS")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  mode === "CDS" ? "bg-amber-500 text-neutral-950 shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                CDS
              </button>
            </div>
          </div>
        </div>

        {/* HERO SECTION: The 3 Core Daily Rituals of an Officer Aspirant */}
        <div>
          <div className="flex items-center justify-between pb-3">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
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
                  10 curated questions dynamically mapped to today's current affairs and high-frequency PYQ concepts.
                </p>

                <div className="p-3 bg-neutral-900/80 border border-neutral-850 rounded-2xl text-[11px] font-mono text-neutral-300 space-y-1">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Syllabus Focus:</span>
                    <strong className="text-white">Polity & Economy Linkages</strong>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Negative Marking:</span>
                    <strong className="text-red-400">-0.66 marks enabled</strong>
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
                    "Examine the discretionary powers of the Governor under Art. 163 in light of recent rulings."
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

        {/* THE SUPERPOWER ADVANTAGE: Why Serious Aspirants Choose Officers Arena */}
        <div className="bg-[#101010] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                The Officers Arena Advantage
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                How We Eliminate 1.5 Hours of Daily Preparation Fatigue
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
              3PL IRT Adaptive Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                24-Item Adaptive Diagnostic
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Legacy apps force you to solve 100 repetitive questions. Our Fisher Information engine finds your exact ability level and weak spots in just <strong>24 smart questions</strong> (-76% fatigue).
              </p>
            </div>

            <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                Cognitive Option Tracing
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Competitors paste Wikipedia text. We diagnose <em>why</em> you got tricked (e.g. falling for "Only/Never" absolute qualifier baits) and pinpoint the exact textbook chapter to read.
              </p>
            </div>

            <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Instant 30s Mains AES
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Stop waiting 15 days and paying ₹30,000 for coaching test series. Snap a photo of your handwritten paper and receive anchor-calibrated rubric scores in under 30 seconds.
              </p>
            </div>
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
              href="/library"
              className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Explore 15,723 PYQs</span>
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
