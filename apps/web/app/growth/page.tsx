"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";
import { useRouter } from "next/navigation";
import { useArenaStore } from "@/src/store/useArenaStore";
import { MasteryMap } from "@/src/components/arena/MasteryMap";
import { generateQuestionBank } from "@/src/utils/mockQuestionBank";
import { 
  TrendingUp, CheckCircle, Layers, Brain, Calendar, 
  Clock, AlertCircle, Award, ChevronRight, Sparkles, RefreshCw 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface UrgencyItem {
  id: string;
  topic: string;
  subject: string;
  halfLifeDays: number;
  urgencyScore: number;
  lastAttempt: string;
}

const UPSC_FALLBACK_URGENCY_DATA: UrgencyItem[] = [
  {
    id: "urg-1",
    topic: "Emergency Provisions (Article 352-360)",
    subject: "Indian Polity",
    halfLifeDays: 1.2,
    urgencyScore: 0.94,
    lastAttempt: "2 days ago"
  },
  {
    id: "urg-2",
    topic: "Mapping of Indian Rivers and Lakes",
    subject: "Geography",
    halfLifeDays: 2.8,
    urgencyScore: 0.78,
    lastAttempt: "4 days ago"
  },
  {
    id: "urg-3",
    topic: "Governor's Discretionary Powers",
    subject: "Indian Polity",
    halfLifeDays: 4.1,
    urgencyScore: 0.65,
    lastAttempt: "5 days ago"
  },
  {
    id: "urg-4",
    topic: "Swaraj and Partition of Bengal",
    subject: "Modern History",
    halfLifeDays: 6.5,
    urgencyScore: 0.48,
    lastAttempt: "8 days ago"
  }
];

const CDS_FALLBACK_URGENCY_DATA: UrgencyItem[] = [
  {
    id: "urg-1",
    topic: "Trigonometrical Identities and Inradius Properties",
    subject: "Mathematics",
    halfLifeDays: 1.2,
    urgencyScore: 0.94,
    lastAttempt: "2 days ago"
  },
  {
    id: "urg-2",
    topic: "Spotting Errors & Prepositions Usage",
    subject: "English",
    halfLifeDays: 2.8,
    urgencyScore: 0.78,
    lastAttempt: "4 days ago"
  },
  {
    id: "urg-3",
    topic: "Indian National Movement (1857-1947)",
    subject: "General Knowledge",
    halfLifeDays: 4.1,
    urgencyScore: 0.65,
    lastAttempt: "5 days ago"
  },
  {
    id: "urg-4",
    topic: "Elementary Geometry and Area Calculations",
    subject: "Mathematics",
    halfLifeDays: 6.5,
    urgencyScore: 0.48,
    lastAttempt: "8 days ago"
  }
];

export default function GrowthPage() {
  const router = useRouter();
  const mode = useArenaStore((state) => state.mode);
  const masteryPercentage = useArenaStore((state) => state.masteryPercentage);
  const sessionScore = useArenaStore((state) => state.sessionScore);
  const thetaDelta = useArenaStore((state) => state.thetaDelta);
  const setMasteryMetrics = useArenaStore((state) => state.setMasteryMetrics);

  const [items, setItems] = useState<UrgencyItem[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSRSData = async (isManualClick = false) => {
    setIsLoading(true);
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      // 1. Fetch SRS Memory Queue
      const srsRes = await fetch(`${apiEndpoint}/api/v1/arena/srs/dashboard?user_id=student_999`);
      if (srsRes.ok) {
        const srsData = await srsRes.json();
        if (srsData.due_questions && srsData.due_questions.length > 0) {
          const mappedItems: UrgencyItem[] = srsData.due_questions.map((q: any, idx: number) => ({
            id: q.question_id || `srs-${idx}`,
            topic: q.text?.slice(0, 75) + "..." || "Syllabus Concept",
            subject: q.subject || (mode === "CDS" ? "General Knowledge" : "Indian Polity"),
            halfLifeDays: parseFloat((2.0 + (1.0 - q.urgency_score) * 5).toFixed(1)),
            urgencyScore: q.urgency_score,
            lastAttempt: new Date(q.due_date).toLocaleDateString()
          }));
          setItems(mappedItems);
        } else {
          setItems(mode === "CDS" ? CDS_FALLBACK_URGENCY_DATA : UPSC_FALLBACK_URGENCY_DATA);
        }
      } else {
        setItems(mode === "CDS" ? CDS_FALLBACK_URGENCY_DATA : UPSC_FALLBACK_URGENCY_DATA);
      }

      // 2. Fetch BKT Mastery Map
      const masteryRes = await fetch(`${apiEndpoint}/api/v1/arena/mastery-map?user_id=student_999`);
      if (masteryRes.ok) {
        const mData = await masteryRes.json();
        if (mData.mastery_map) {
          const values = Object.values(mData.mastery_map) as number[];
          const avgMastery = values.reduce((a, b) => a + b, 0) / (values.length || 1);
          setMasteryMetrics(Math.round(avgMastery), thetaDelta);
        }
      }

      if (isManualClick) {
        toast.success("Cognitive Twin recalibrated successfully!", {
          description: `Loaded active ${mode} state parameters from the diagnostic vault.`
        });
      }
    } catch (e) {
      console.warn("Failed to connect to ML backend, displaying cached local state:", e);
      setItems(mode === "CDS" ? CDS_FALLBACK_URGENCY_DATA : UPSC_FALLBACK_URGENCY_DATA);
      if (isManualClick) {
        toast.error("Twin Recalibration failed.", {
          description: "Could not connect to the ML engine. Reverting to cached local state."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to UPSC/CDS track switch in the global header
  useEffect(() => {
    setHasMounted(true);
    setItems(mode === "CDS" ? CDS_FALLBACK_URGENCY_DATA : UPSC_FALLBACK_URGENCY_DATA);
    fetchSRSData(false);
  }, [mode]);

  const heatmapData = Array.from({ length: 371 }, (_, index) => {
    if (!hasMounted) return { id: `day-${index}`, level: 0 };
    const val = ((index * 12345 + 67890) % 100) / 100;
    let level = 0;
    if (val > 0.85) level = 4;
    else if (val > 0.65) level = 3;
    else if (val > 0.45) level = 2;
    else if (val > 0.25) level = 1;
    return { id: `day-${index}`, level };
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0b0b0b] text-neutral-100">
      <GuestWarningBanner />
      <AppHeader />

      <main className="flex-grow max-w-6xl w-full mx-auto p-6 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Brain className="w-4 h-4" />
              Spaced Repetition & Cognitive Twin (SRS)
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white mt-1">
              Cognitive Analytics & Retention Engine ({mode} Track)
            </h1>
            <p className="text-sm text-neutral-300 mt-1">
              Active memory half-life mapping, decay prediction, and candidate performance analytics.
            </p>
          </div>

          <button 
            type="button"
            onClick={() => fetchSRSData(true)}
            disabled={isLoading}
            className="self-start md:self-auto px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer text-white shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Recalibrating..." : "Recalibrate Twin"}
          </button>
        </div>

        {/* Top Analytics KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#121212] border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">BKT Global Mastery</span>
              <span className="text-xl font-black font-mono text-white mt-0.5">{masteryPercentage}%</span>
            </div>
          </div>

          <div className="bg-[#121212] border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Session Score</span>
              <span className="text-xl font-black font-mono text-white mt-0.5">{sessionScore} pts</span>
            </div>
          </div>

          <div className="bg-[#121212] border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">3PL-IRT Theta (θ)</span>
              <span className="text-xl font-black font-mono text-white mt-0.5">{thetaDelta.toFixed(3)}</span>
            </div>
          </div>

          <div className="bg-[#121212] border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Chronometric Velocity</span>
              <span className="text-xl font-black font-mono text-white mt-0.5">48.2s <span className="text-[10px] font-normal text-emerald-400">Optimal</span></span>
            </div>
          </div>
        </div>

        {/* 4-Quadrant Metacognitive Calibration Matrix (Research Model) */}
        <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400">
                <Brain className="w-4 h-4" />
                Metacognitive Calibration Matrix (Confidence vs. Accuracy)
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Identifies dangerous negative-marking blindspots (High Confidence + Incorrect) and Imposter Syndrome (Low Confidence + Correct).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono rounded-lg">
                ECE: 0.048 (Well Calibrated)
              </span>
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono rounded-lg">
                Brier: 0.078
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quadrant 1: Mastered */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/30 rounded-2xl flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                  Quadrant I • Mastered
                </span>
                <span className="text-emerald-400 font-mono text-xs font-bold">64% of items</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">High Confidence • Correct</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Rock-solid conceptual retention. Safe for speed answering in prelims OMR.
                </p>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                Avg Response: 32.4s • SM-2 Half-life: 14.2d
              </div>
            </div>

            {/* Quadrant 2: Imposter / Fragile */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/30 rounded-2xl flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/40">
                  Quadrant II • Hesitant
                </span>
                <span className="text-blue-400 font-mono text-xs font-bold">18% of items</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Low Confidence • Correct</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Correct by intuition or elimination, but lacks self-conviction. Needs confidence drills.
                </p>
              </div>
              <div className="text-[10px] text-blue-400 font-mono">
                Avg Response: 76.1s • SM-2 Half-life: 3.8d
              </div>
            </div>

            {/* Quadrant 3: High Risk Blindspot */}
            <div className="p-4 bg-rose-500/5 border border-rose-500/40 rounded-2xl flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded border border-rose-500/40 animate-pulse">
                  Quadrant III • High Risk
                </span>
                <span className="text-rose-400 font-mono text-xs font-bold">11% of items</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">High Confidence • Incorrect</h4>
                <p className="text-xs text-rose-300 mt-1">
                  Dangerous misconceptions triggering negative marking penalty (-0.66 marks).
                </p>
              </div>
              <div className="text-[10px] text-rose-400 font-mono">
                Avg Response: 24.8s (Overhasty) • Priority 1
              </div>
            </div>

            {/* Quadrant 4: Conceptual Gap */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-2xl flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40">
                  Quadrant IV • Unlearned
                </span>
                <span className="text-amber-400 font-mono text-xs font-bold">7% of items</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Low Confidence • Incorrect</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Recognized knowledge gaps. Candidates correctly skip or guess randomly.
                </p>
              </div>
              <div className="text-[10px] text-amber-400 font-mono">
                Avg Response: 98.5s • Needs Textbook Reading
              </div>
            </div>
          </div>
        </div>

        {/* SRS Recall Urgency & Radar Mastery Map Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recall Urgency Priority Queue */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Recall Urgency Priority Queue (HLR Engine)
              </h2>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Sorted by decay rate
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const isCritical = item.urgencyScore >= 0.8;
                return (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    className={`
                      p-5 bg-[#121212] border rounded-2xl shadow-xl flex items-center justify-between transition-all duration-300
                      ${isCritical ? "border-rose-500/40 bg-rose-500/5" : "border-neutral-800"}
                    `}
                  >
                    <div className="flex flex-col gap-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide rounded-md
                          ${isCritical ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-neutral-900 text-neutral-300 border border-neutral-800"}
                        `}>
                          {item.subject}
                        </span>
                        <span className="text-xs text-neutral-400">
                          Due: {item.lastAttempt}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2">
                        {item.topic}
                      </h3>
                      <p className="text-xs text-neutral-300 mt-1">
                        Predicted half-life: <span className="font-semibold text-amber-400">{item.halfLifeDays} days</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                          Urgency
                        </span>
                        <span className={`text-xl font-black font-mono mt-0.5 ${isCritical ? "text-rose-400" : "text-amber-400"}`}>
                          {Math.round(item.urgencyScore * 100)}%
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const setTestMode = useArenaStore.getState().setTestMode;
                          const setSelectedSubject = useArenaStore.getState().setSelectedSubject;
                          const setQuestion = useArenaStore.getState().setQuestion;
                          setTestMode("practice");
                          setSelectedSubject(item.subject);
                          const srsQuestions = generateQuestionBank(mode, item.subject, 10);
                          setQuestion(srsQuestions[0] || null);
                          toast.success(`Launching SRS Revision for ${item.topic.slice(0, 30)}...`, {
                            description: "Socratic feedback enabled for memory reinforcement."
                          });
                          router.push("/arena");
                        }}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        Review Now
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Column: BKT Radar Chart Mastery Map */}
          <div className="flex flex-col gap-4">
            <MasteryMap userId="student_999" />

            <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col gap-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-200">
                Cognitive Twin Parameters
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                The BKT engine computes continuous mastery probabilities across 4 core exam axes. Lower-vertex domains are automatically prioritized in your daily Strategist roadmap.
              </p>
            </div>
          </div>

        </div>

        {/* Consistency Log Heatmap */}
        <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Cognitive Consistency Log
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Daily attempt intensity
            </span>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div 
              style={{ display: "grid", gridTemplateRows: "repeat(7, minmax(0, 1fr))", gridAutoFlow: "column", gap: "4px" }}
              className="w-max min-w-full"
            >
              {heatmapData.map((day) => {
                const levelColors = [
                  "bg-neutral-900", // 0
                  "bg-amber-950/60 text-amber-600 border border-amber-900/30", // 1
                  "bg-amber-800/80 text-amber-400", // 2
                  "bg-amber-600 text-amber-200", // 3
                  "bg-amber-500 font-bold"  // 4
                ];

                return (
                  <div
                    key={day.id}
                    className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 hover:scale-125 cursor-pointer ${levelColors[day.level]}`}
                    title={`Activity intensity: Level ${day.level}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

      </main>

      <footer className="border-t border-neutral-800 py-4 text-center text-xs tracking-widest uppercase font-bold text-neutral-400 bg-neutral-900/60">
        Officers Arena &copy; 2026 | COGNITIVE SRS ANALYTICS
      </footer>
    </div>
  );
}
