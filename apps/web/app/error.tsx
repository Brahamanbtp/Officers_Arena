"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js global application error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-850 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 animate-bounce">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-lg font-black tracking-wide uppercase text-white">System Error Caught</h2>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            The application experienced an unexpected runtime crash. Active sessions and calibrations are safely preserved.
          </p>
        </div>

        {error.digest && (
          <code className="text-[10px] font-mono bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-850 text-neutral-500">
            ID: {error.digest}
          </code>
        )}

        <button
          onClick={() => reset()}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-600/10"
        >
          <RefreshCw className="w-4 h-4" />
          Attempt Recovery
        </button>
      </div>
    </div>
  );
}
