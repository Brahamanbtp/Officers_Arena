"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

export const GuestWarningBanner: React.FC = () => {
  const isGuest = useAuthStore((state) => state.isGuest);

  if (!isGuest) return null;

  return (
    <div className="w-full bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 text-xs relative z-40 font-sans">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-200 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <span>
            <strong className="font-bold text-amber-300">Guest Mode Active:</strong> Your ML cognitive mastery stats are saved locally. Sign up to sync to the cloud.
          </span>
        </div>

        <Link
          href="/signup"
          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold uppercase tracking-wider rounded-lg text-xs transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-md shadow-amber-600/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Sync Progress
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
export default GuestWarningBanner;
