"use client";

import React from "react";
import Link from "next/link";
import { BrainCircuit, ShieldCheck, Zap, BookOpen } from "lucide-react";

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t border-neutral-800 bg-[#080808] text-neutral-400 py-8 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white font-sans">Officers Arena</span> &copy; 2026 • AI Assessment & Cognitive Defense Suite
          </div>
        </div>

        {/* Academic & Methodology Links for Evaluators/Faculty */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-neutral-400">
          <Link
            href="/research"
            className="hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Psychometric Methodology & Validation
          </Link>
          <Link
            href="/library"
            className="hover:text-neutral-200 transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            15,723 Question Corpus
          </Link>
          <span className="text-neutral-600 hidden sm:inline">|</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            FastAPI 3PL CAT Core Active
          </span>
        </div>
      </div>
    </footer>
  );
};
