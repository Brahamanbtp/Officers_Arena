"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GrowthPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/strategist");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center text-neutral-400 font-mono text-sm">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Redirecting to Strategic Command Hub...</span>
      </div>
    </div>
  );
}
