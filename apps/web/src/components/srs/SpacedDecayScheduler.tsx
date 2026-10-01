"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Clock, 
  Flame, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RotateCw, 
  BookOpen, 
  Calendar,
  Zap,
  TrendingDown
} from "lucide-react";
import { motion } from "framer-motion";

export interface DecayingConceptItem {
  id: string;
  topicName: string;
  domain: string;
  daysSinceLastReview: number;
  halfLifeDays: number;
  initialMastery: number;
  currentRetention: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  standardSource: string;
}

const SAMPLE_DECAYING_ITEMS: DecayingConceptItem[] = [
  {
    id: "decay-1",
    topicName: "1930–1942 Round Table & Mission Chronology",
    domain: "Modern History",
    daysSinceLastReview: 6,
    halfLifeDays: 5,
    initialMastery: 84,
    currentRetention: 36.8, // 84 * 2^(-6/5) = 36.8%
    urgency: "HIGH",
    standardSource: "Spectrum Modern History Ch. 21-24"
  },
  {
    id: "decay-2",
    topicName: "Governor Discretionary Powers (Art. 163 vs 356)",
    domain: "Indian Polity",
    daysSinceLastReview: 4,
    halfLifeDays: 6,
    initialMastery: 78,
    currentRetention: 49.1,
    urgency: "HIGH",
    standardSource: "M. Laxmikanth Chapter 30"
  },
  {
    id: "decay-3",
    topicName: "Monetary Transmission & Repo Spread (EBLR)",
    domain: "Indian Economy",
    daysSinceLastReview: 3,
    halfLifeDays: 7,
    initialMastery: 82,
    currentRetention: 60.9,
    urgency: "MEDIUM",
    standardSource: "Ramesh Singh Chapter 7"
  },
  {
    id: "decay-4",
    topicName: "Western Ghats Ecology & Conservation Committees",
    domain: "Geography & Environment",
    daysSinceLastReview: 2,
    halfLifeDays: 9,
    initialMastery: 90,
    currentRetention: 77.1,
    urgency: "LOW",
    standardSource: "NCERT Class XI & Shankar IAS Ch. 14"
  }
];

export const SpacedDecayScheduler: React.FC = () => {
  const [items] = useState<DecayingConceptItem[]>(SAMPLE_DECAYING_ITEMS);

  return (
    <div className="p-6 bg-[#121212] border border-neutral-800 rounded-3xl shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold rounded-lg uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Exponential Half-Life Regression (HLR) Engine
            </span>
            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold rounded">
              2 Concepts in Critical Forgetting Zone
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">
            Overnight Cognitive Decay &amp; Spaced Retrieval Queue
          </h3>
          <p className="text-xs text-neutral-400 font-sans">
            Mathematical memory retention R(t) = R₀ &times; 2^(&minus;&Delta;t / h). Concepts falling below 60% retention require immediate 2-minute active retrieval to reset half-life.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Next Scheduled Sync: 05:00 AM</span>
        </div>
      </div>

      {/* Decaying Concepts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const isCritical = item.currentRetention < 50;
          const isWarning = item.currentRetention >= 50 && item.currentRetention < 65;

          return (
            <div 
              key={item.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                isCritical 
                  ? "bg-red-950/15 border-red-500/40 hover:border-red-500" 
                  : isWarning 
                  ? "bg-amber-950/15 border-amber-500/40 hover:border-amber-500" 
                  : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400 font-bold uppercase">{item.domain}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isCritical ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    isWarning ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {item.urgency === "HIGH" ? "Review Now" : item.urgency === "MEDIUM" ? "Due Today" : "Stable"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">
                  {item.topicName}
                </h4>

                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Target: {item.standardSource}</span>
                </div>
              </div>

              {/* Retention Decay Gauge */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <TrendingDown className={`w-3.5 h-3.5 ${isCritical ? "text-red-400" : "text-amber-400"}`} />
                    Last Active: {item.daysSinceLastReview}d ago (h = {item.halfLifeDays}d)
                  </span>
                  <span className={`font-bold ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"}`}>
                    Retention: {item.currentRetention.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${item.currentRetention}%` }}
                  />
                </div>
              </div>

              {/* Plug Decay Action */}
              <Link
                href={`/arena?autoStart=true&count=5&subject=${encodeURIComponent(item.domain)}&topic=${encodeURIComponent(item.topicName)}&mode=practice`}
                className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  isCritical 
                    ? "bg-red-500 hover:bg-red-400 text-neutral-950" 
                    : isWarning 
                    ? "bg-amber-500 hover:bg-amber-400 text-neutral-950" 
                    : "bg-neutral-800 hover:bg-neutral-700 text-white"
                }`}
              >
                <span>Reset Half-Life (5 Qs)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>

    </div>
  );
};
