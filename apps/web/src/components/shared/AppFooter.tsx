"use client";

import React from "react";
import Link from "next/link";
import { 
  BrainCircuit, 
  ShieldCheck, 
  Zap, 
  BookOpen, 
  Flame, 
  Compass, 
  FileEdit, 
  Globe2, 
  TrendingUp, 
  Keyboard, 
  Sparkles,
  CheckCircle2
} from "lucide-react";

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t border-neutral-800/80 bg-[#080808] text-neutral-400 pt-12 pb-8 px-4 sm:px-6 mt-auto relative overflow-hidden">
      {/* Background Subtle Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 rounded-xl text-amber-400 shadow-inner">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="font-serif font-black text-lg text-white tracking-wide">
                OFFICERS <span className="text-amber-400 font-sans">ARENA</span>
              </div>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              India&apos;s most advanced psychometric & adaptive preparation suite for UPSC CSE and CDS aspirants. Engineered with 3PL Item Response Theory and Rubric-aligned Mains AES.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>FastAPI 3PL CAT Core Online</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-mono">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>15,720+ Curated Question Bank</span>
              </div>
            </div>
          </div>

          {/* Column 1: Core Systems */}
          <div className="space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-white">
              Assessment Engines
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/arena" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Prelims CAT Arena</span>
                </Link>
              </li>
              <li>
                <Link href="/mains" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <FileEdit className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mains 15M / 10M Evaluator</span>
                </Link>
              </li>
              <li>
                <Link href="/current-affairs" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>360° Current Affairs Bridge</span>
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Standard Textbook Library</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Cognitive Analytics */}
          <div className="space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-white">
              Cadet Analytics
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/strategist" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Cognitive Strategist</span>
                </Link>
              </li>
              <li>
                <Link href="/growth" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Growth, Trajectory & $\theta$</span>
                </Link>
              </li>
              <li>
                <Link href="/research" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Psychometric Methodology</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Cadet Authentication</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Keybinds & System */}
          <div className="space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-900/80 border border-neutral-850">
                <span className="text-neutral-400 text-[11px]">Command Palette</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-amber-400 text-[10px]">Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-900/80 border border-neutral-850">
                <span className="text-neutral-400 text-[11px]">Next / Submit</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px]">Enter</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-900/80 border border-neutral-850">
                <span className="text-neutral-400 text-[11px]">Option Selection</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px]">1 - 4</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-neutral-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-neutral-500">
          <div>
            &copy; {new Date().getFullYear()} <span className="text-neutral-300 font-sans font-bold">Officers Arena</span>. Designed for UPSC CSE & CDS Aspirants.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-neutral-400">Strictly aligned with UPSC Syllabus Guidelines</span>
            <span className="hidden sm:inline text-neutral-700">•</span>
            <span className="text-amber-500/80 font-bold">IRT CAT &bull; AES &bull; GS 1-4 &bull; CDS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
