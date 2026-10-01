"use client";

import React from "react";
import { 
  ShieldAlert, 
  Brain, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  TrendingUp, 
  Sliders, 
  Flame,
  Target
} from "lucide-react";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import Link from "next/link";

interface EliminationDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  examMode: "UPSC" | "CDS";
}

export const EliminationDoctorModal: React.FC<EliminationDoctorModalProps> = ({
  isOpen,
  onClose,
  examMode
}) => {
  if (!isOpen) return null;

  // Tri-Vector MIRT Trait Data
  const mirtVectors = [
    { dimension: "Factual Recall", theta: 1.42, sem: 0.18, benchmark: 1.10, description: "Direct statutory articles, historical dates, and numerical constants." },
    { dimension: "Analytical Synthesis", theta: 0.86, sem: 0.22, benchmark: 0.95, description: "Multi-statement causality, economic mechanisms, and constitutional rationale." },
    { dimension: "Option Elimination", theta: 0.34, sem: 0.26, benchmark: 0.85, description: "Distractor detection, extreme qualifier traps, and 50:50 judgment." }
  ];

  // Cognitive Trap Susceptibility Benchmarks
  const cognitiveTraps = [
    {
      name: "The 50:50 Distractor Trap",
      rate: 46,
      severity: "CRITICAL",
      description: "When eliminating down to 2 choices, candidate selects the tempting distractor in 46% of attempts.",
      cure: "Apply the 'Statutory Anchor Test' before finalizing your last eliminated pair."
    },
    {
      name: "Extreme Qualifier Blindness",
      rate: 38,
      severity: "MODERATE",
      description: "Overlooks qualifiers like 'only', 'strictly', 'solely', and 'completely' in statement 2 of multi-statement MCQs.",
      cure: "Circle extreme adverbs immediately upon first reading the question stem."
    },
    {
      name: "Overthinking Latency Penalty",
      rate: 31,
      severity: "MODERATE",
      description: "Questions taking > 90 seconds result in second-guessing correct first instincts.",
      cure: "Institute a hard 75-second ceiling per MCQ in Prelims Paper-I."
    }
  ];

  const radarData = [
    { subject: "Factual Recall", score: 82, fullMark: 100 },
    { subject: "Analytical Logic", score: 68, fullMark: 100 },
    { subject: "Distractor Resistance", score: 44, fullMark: 100 },
    { subject: "Speed / Pacing", score: 76, fullMark: 100 },
    { subject: "Metacognitive Calibration", score: 58, fullMark: 100 },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between gap-4 bg-[#161616]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded uppercase flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                MIRT Diagnostic &amp; Cognitive Trap Doctor
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Multidimensional Item Response Theory (θ-Vector)
              </span>
            </div>
            <h2 className="text-xl font-black text-white leading-tight">
              Cognitive Traps &amp; Option Elimination Profiler ({examMode})
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow text-xs leading-relaxed text-neutral-200">
          
          {/* MIRT 3-Vector Ability Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-amber-400 font-mono flex items-center gap-2">
                <Target className="w-4 h-4" /> Multidimensional Ability Vector &theta; = (&theta;_F, &theta;_A, &theta;_E)
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">Target Standard Error: SEM &le; 0.22</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mirtVectors.map((vec) => (
                <div 
                  key={vec.dimension}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                    vec.theta >= 1.0 ? "bg-emerald-950/20 border-emerald-800/40" :
                    vec.theta >= 0.5 ? "bg-amber-950/20 border-amber-800/40" :
                    "bg-red-950/20 border-red-800/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-neutral-300">{vec.dimension}</span>
                      <span className={`font-black ${vec.theta >= 1.0 ? "text-emerald-400" : vec.theta >= 0.5 ? "text-amber-400" : "text-red-400"}`}>
                        θ = {vec.theta > 0 ? `+${vec.theta.toFixed(2)}` : vec.theta.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">{vec.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>SEM: &plusmn;{vec.sem}</span>
                    <span>Topper Benchmark: +{vec.benchmark}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar & Cognitive Traps Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Left: 5D Cognitive Radar Chart */}
            <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-neutral-300 font-mono flex items-center justify-between">
                <span>Cognitive Bias &amp; Acuity Radar</span>
                <span className="text-[10px] text-amber-400 font-mono">5 Dimensions</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#262626" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#a3a3a3", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#404040" tick={{ fill: "#737373", fontSize: 9 }} />
                    <Radar name="Candidate Ability" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Cognitive Traps Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-300 font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Detected Subconscious Fallacies
              </div>

              <div className="space-y-2.5">
                {cognitiveTraps.map((trap) => (
                  <div key={trap.name} className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white">{trap.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        trap.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {trap.rate}% Failure Rate
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300">{trap.description}</p>
                    <div className="text-[10px] text-emerald-400 font-mono bg-neutral-950 p-1.5 rounded border border-neutral-850">
                      <strong>Rx / Cognitive Cure: </strong>{trap.cure}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action Callout */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Recommended Prescription: Fortify Option Elimination ($\theta_E$)
              </div>
              <p className="text-[11px] text-neutral-400 max-w-lg">
                Run a 10-question high-distractor elimination drill specifically focusing on multi-statement qualifying traps.
              </p>
            </div>

            <Link
              href="/arena?autoStart=true&count=10&subject=Polity&mode=practice"
              onClick={onClose}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md font-mono flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Launch Elimination Drill</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-[#161616] flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-mono">
            3PL-MIRT Psychometric Diagnostics Engine v2.6
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
