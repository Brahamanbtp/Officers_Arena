"use client";

import React from "react";
import Link from "next/link";
import { BrainCircuit, ShieldCheck, Zap, BookOpen, Keyboard } from "lucide-react";

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t border-neutral-850 bg-[#0a0a0a] text-neutral-400 py-4 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
        {/* Brand & Copyright */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <BrainCircuit className="w-3.5 h-3.5" />
          </div>
          <span className="text-neutral-300 font-sans font-bold">Officers Arena</span>
          <span className="text-neutral-600">&bull;</span>
          <span className="text-neutral-500 text-[11px]">&copy; {new Date().getFullYear()} UPSC &amp; CDS Cognitive Suite</span>
        </div>

        {/* Essential Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <Link
            href="/research"
            className="hover:text-amber-400 transition-colors flex items-center gap-1 text-neutral-400"
          >
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>Psychometric Methodology</span>
          </Link>
          <span className="text-neutral-700 hidden sm:inline">&bull;</span>
          <Link
            href="/library"
            className="hover:text-amber-400 transition-colors flex items-center gap-1 text-neutral-400"
          >
            <BookOpen className="w-3 h-3 text-blue-400" />
            <span>15,720+ Question Vault</span>
          </Link>
        </div>

        {/* Live Core Status & Quick Jump Chip */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CAT Core 3PL Active</span>
          </div>
          <div className="hidden lg:flex items-center gap-1 text-neutral-500">
            <Keyboard className="w-3 h-3 text-neutral-400" />
            <kbd className="px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-amber-400 font-bold">Ctrl+K</kbd>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
