"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  BookOpen, 
  ChevronRight, 
  RotateCw, 
  Target 
} from "lucide-react";
import { useStrategist, TopicDetail } from "../../../hooks/useStrategist";
import { TopicDeepDive } from "./TopicDeepDive";

export const StrategistDashboard: React.FC = () => {
  const { plan, loading, error, hours, setHours, mode, setMode, refreshStrategy } = useStrategist("student_999", 4.0, "UPSC");
  const [selectedTopic, setSelectedTopic] = useState<TopicDetail | null>(null);
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);

  const handleTopicClick = (topic: TopicDetail) => {
    setSelectedTopic(topic);
    setIsDeepDiveOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-neutral-400">
        <RotateCw className="w-5 h-5 animate-spin text-amber-500 mr-2" />
        Synthesizing exam priority vectors and BKT digital twins...
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-900/50 rounded-2xl text-red-400 text-sm">
        {error || "Failed to load strategy details."}
      </div>
    );
  }

  // Combine all topics to render on the Matrix Scatter Plot
  const allTopics: (TopicDetail & { quad: string })[] = [
    ...plan.quadrants.Q1.map(t => ({ ...t, quad: "Q1" })),
    ...plan.quadrants.Q2.map(t => ({ ...t, quad: "Q2" })),
    ...plan.quadrants.Q3.map(t => ({ ...t, quad: "Q3" })),
    ...plan.quadrants.Q4.map(t => ({ ...t, quad: "Q4" }))
  ];

  // SVG Scatter plot parameters
  const svgWidth = 400;
  const svgHeight = 300;
  const padding = 40;
  const chartW = svgWidth - padding * 2;
  const chartH = svgHeight - padding * 2;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header Dashboard Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Module 5: The AI Exam Strategist
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Command Center Strategy
            </h1>
            <p className="text-xs text-neutral-450 mt-0.5">
              Data-driven optimization mapping subtopic mastery against rotation frequency.
            </p>
          </div>

          {/* Configuration Inputs */}
          <div className="flex items-center gap-3">
            {/* Hours Input */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Hours:</label>
              <input
                type="number"
                min="1"
                max="12"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 4)}
                className="w-10 bg-transparent text-white font-mono text-xs font-bold border-none focus:outline-none"
              />
            </div>

            {/* Exam Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-850 rounded-xl">
              <button
                onClick={() => setMode("UPSC")}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                  mode === "UPSC" ? "bg-amber-600 text-white" : "text-neutral-500 hover:text-neutral-350"
                }`}
              >
                UPSC
              </button>
              <button
                onClick={() => setMode("CDS")}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                  mode === "CDS" ? "bg-amber-600 text-white" : "text-neutral-500 hover:text-neutral-350"
                }`}
              >
                CDS
              </button>
            </div>

            <button
              onClick={refreshStrategy}
              className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all"
              title="Refresh Strategy Metrics"
            >
              <RotateCw className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* The "Nudge" Banner */}
        {plan.nudge_message && plan.nudge_style !== "none" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl flex items-start gap-3 border shadow-lg ${
              plan.nudge_style === "amber" 
                ? "bg-amber-950/25 border-amber-500/30 text-amber-200" 
                : "bg-blue-950/25 border-blue-500/30 text-blue-200"
            }`}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              plan.nudge_style === "amber" ? "text-amber-500 animate-pulse" : "text-blue-500 animate-pulse"
            }`} />
            <div className="flex-grow">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                AI Behavior Strategist Action Required
              </div>
              <p className="text-xs font-medium mt-1 leading-relaxed">{plan.nudge_message}</p>
              <div className="text-[10px] font-serif italic mt-1.5 opacity-85 border-t border-neutral-800/40 pt-1.5">
                Twin Reasoning: {plan.behavioral_insight}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Scatter Matrix Plot Widget (Card 1: 2 cols on large screen) */}
          <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" /> Strategic Quadrant Matrix
              </h3>
              <span className="text-[9px] font-mono text-neutral-500">Mastery (X) vs Priority (Y)</span>
            </div>

            {/* Matrix Scatter Plot */}
            <div className="flex justify-center bg-neutral-950/40 border border-neutral-850 rounded-xl p-4 relative overflow-hidden">
              
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible select-none">
                {/* Quadrant backgrounds */}
                {/* Q1: Top-Left (Focus) */}
                <rect x={padding} y={padding} width={chartW / 2} height={chartH / 2} fill="rgba(239, 68, 68, 0.02)" />
                {/* Q2: Top-Right (Maintain/Refine) */}
                <rect x={padding + chartW / 2} y={padding} width={chartW / 2} height={chartH / 2} fill="rgba(16, 185, 129, 0.02)" />
                {/* Q3: Bottom-Left (Secondary) */}
                <rect x={padding} y={padding + chartH / 2} width={chartW / 2} height={chartH / 2} fill="rgba(100, 116, 139, 0.02)" />
                {/* Q4: Bottom-Right (Over-studied) */}
                <rect x={padding + chartW / 2} y={padding + chartH / 2} width={chartW / 2} height={chartH / 2} fill="rgba(59, 130, 246, 0.02)" />

                {/* Split axis lines */}
                <line x1={padding + chartW / 2} y1={padding} x2={padding + chartW / 2} y2={padding + chartH} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={padding} y1={padding + chartH / 2} x2={padding + chartW} y2={padding + chartH / 2} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="3,3" />

                {/* Outer borders */}
                <rect x={padding} y={padding} width={chartW} height={chartH} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                {/* Quadrant labels */}
                <text x={padding + 10} y={padding + 18} fontSize="9" fill="rgba(239, 68, 68, 0.7)" className="font-extrabold tracking-wide">Q1: FOCUS (CRITICAL)</text>
                <text x={padding + chartW / 2 + 10} y={padding + 18} fontSize="9" fill="rgba(16, 185, 129, 0.7)" className="font-extrabold tracking-wide">Q2: REFINE (MAINTAIN)</text>
                <text x={padding + 10} y={padding + chartH / 2 + 18} fontSize="9" fill="rgba(148, 163, 184, 0.7)" className="font-extrabold tracking-wide">Q3: SECONDARY (LOW ROI)</text>
                <text x={padding + chartW / 2 + 10} y={padding + chartH / 2 + 18} fontSize="9" fill="rgba(59, 130, 246, 0.7)" className="font-extrabold tracking-wide">Q4: OVER-STUDIED</text>

                {/* Axes ticks / labels */}
                <text x={padding + chartW / 2} y={padding + chartH + 20} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)">Mastery</text>
                <text x={padding - 25} y={padding + chartH / 2} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)" transform={`rotate(-90, ${padding - 25}, ${padding + chartH / 2})`}>Priority</text>

                {/* Points */}
                {allTopics.map((topic, idx) => {
                  // Map X coordinate from Mastery [0, 1] to chart scale
                  const cx = padding + topic.mastery * chartW;
                  // Map Y coordinate from Priority [0, 1] (inverts Y axis)
                  const cy = padding + (1.0 - topic.priority) * chartH;

                  // Define color based on quadrant
                  const colors = {
                    Q1: "rgba(239, 68, 68, 0.95)",
                    Q2: "rgba(16, 185, 129, 0.95)",
                    Q3: "rgba(148, 163, 184, 0.95)",
                    Q4: "rgba(59, 130, 246, 0.95)"
                  };
                  const color = colors[topic.quad as keyof typeof colors] || "white";

                  return (
                    <g key={idx} className="cursor-pointer group" onClick={() => handleTopicClick(topic)}>
                      {/* Halo on hover */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="8"
                        fill={color}
                        className="opacity-0 group-hover:opacity-20 transition-all duration-150"
                      />
                      {/* Core point */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="4"
                        fill={color}
                        stroke="rgb(17, 24, 39)"
                        strokeWidth="1.5"
                      />
                      {/* Hover label */}
                      <text
                        x={cx}
                        y={cy - 10}
                        textAnchor="middle"
                        fontSize="7"
                        fill="white"
                        className="opacity-0 group-hover:opacity-100 transition-opacity font-mono bg-neutral-900 px-1 py-0.5 rounded"
                      >
                        {topic.topic_name.substring(0, 15)}...
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right Column Stack containing KPI cards (Readiness & Adherence) */}
          <div className="flex flex-col gap-6">
            {/* Readiness Score Card */}
            <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 shadow-2xl flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Cognitive Readiness
                </h3>
                <p className="text-[10px] text-neutral-500 mt-1">Weighted progress estimate relative to exam relevance weightings.</p>
              </div>

              <div className="flex flex-col items-center py-4">
                <div className="relative flex items-center justify-center">
                  <svg width="120" height="120" className="transform -rotate-90">
                    <circle cx="60" cy="60" r="48" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      stroke="rgb(217, 119, 6)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={(2 * Math.PI * 48) * (1 - plan.readiness_score / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-white font-mono">{plan.readiness_score}%</span>
                    <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block mt-0.5">Readiness</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-850/60 text-[9px] text-neutral-455 leading-relaxed">
                Represents your weighted syllabus coverage index. Target Q1 gaps to raise this efficiently.
              </div>
            </div>

            {/* Adherence Tracker Card */}
            <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 shadow-2xl flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" /> Strategy Adherence
                </h3>
                <p className="text-[10px] text-neutral-500 mt-1">7-day performance tracking against recommended study targets.</p>
              </div>

              {/* Consistency Bar Chart */}
              <div className="flex justify-between items-end gap-2 h-16 px-1 my-3">
                {plan.adherence_status.consistency_history.map((h, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 gap-1">
                    <span className="text-[7px] font-mono text-neutral-500">{h.score}%</span>
                    <div className="w-full bg-neutral-950/60 rounded h-10 relative overflow-hidden border border-neutral-850">
                      <div 
                        style={{ height: `${h.score}%` }} 
                        className={`absolute bottom-0 left-0 right-0 rounded-t transition-all duration-500 ${
                          h.score >= 80 ? "bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.25)]" :
                          h.score >= 50 ? "bg-amber-500/80 shadow-[0_0_5px_rgba(245,158,11,0.25)]" :
                          "bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.25)]"
                        }`}
                      />
                    </div>
                    <span className="text-[7px] font-bold text-neutral-500 uppercase tracking-widest">{h.day}</span>
                  </div>
                ))}
              </div>

              <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-850/60 text-[9px] text-neutral-455 flex justify-between items-center">
                <span>Yesterday's Adherence Score:</span>
                <span className={`font-mono font-bold ${plan.adherence_status.adherence_score >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                  {plan.adherence_status.adherence_score}%
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bento Grid Row (Timeline & Time-blocked Plan) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Priority Feed: Vertical Timeline (2 cols) */}
          <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /> Focus Priority Bottleneck Feed
            </h3>

            <div className="flex flex-col gap-4 mt-2">
              {allTopics.filter(t => t.quad === "Q1" || t.quad === "Q2").slice(0, 4).map((item, idx) => {
                const isQ1 = item.quad === "Q1";
                return (
                  <div key={idx} className="flex gap-4 items-start relative border-l border-neutral-800 pl-4 pb-2 ml-2">
                    {/* Node bullet indicator */}
                    <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border border-neutral-950 ${
                       isQ1 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500"
                    }`} />

                    <div className="flex-grow flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          isQ1 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                          {isQ1 ? "Q1: Critical Gap" : "Q2: Refinement"}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">Priority: {item.priority}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-0.5">{item.topic_name}</h4>
                      
                      <p className="text-xs text-neutral-400 leading-relaxed font-serif bg-neutral-950/20 p-2.5 rounded-lg border border-neutral-850/40 mt-1">
                        {item.explanation}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTopicClick(item)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-colors self-center flex-shrink-0 cursor-pointer"
                    >
                      Analyze
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time-blocked Schedule List */}
          <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" /> Daily Time-Blocked Schedule
            </h3>

            <div className="flex flex-col gap-3">
              {plan.schedule.map((item, idx) => {
                const colors = {
                  Q1: "border-red-500/20 bg-red-950/5",
                  Q2: "border-emerald-500/20 bg-emerald-950/5",
                  "Q3/Q4": "border-slate-500/20 bg-neutral-950/40"
                };
                const color = colors[item.quadrant as keyof typeof colors] || "border-neutral-800";

                return (
                  <div key={idx} className={`p-4 border rounded-xl flex flex-col gap-1.5 ${color}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 font-mono">
                          {item.quadrant === "Q3/Q4" ? "General Revision" : `Quadrant ${item.quadrant}`}
                        </span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider ${
                            item.badge === "Missed Yesterday" 
                              ? "bg-red-500/10 text-red-400 border border-red-500/25" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 bg-neutral-950/80 rounded-md text-[10px] font-bold text-white font-mono border border-neutral-850">
                        {item.duration_hours} Hrs
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{item.activity}</h4>
                    <p className="text-[10px] text-neutral-400 leading-relaxed mt-0.5">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Slide-over Deep Dive panel */}
      <TopicDeepDive
        topic={selectedTopic}
        isOpen={isDeepDiveOpen}
        onClose={() => setIsDeepDiveOpen(false)}
      />

    </div>
  );
};

export default StrategistDashboard;
