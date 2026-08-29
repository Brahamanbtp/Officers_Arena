"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { TopicDetail } from "../../../hooks/useStrategist";

interface TopicDeepDiveProps {
  topic: TopicDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TopicDeepDive: React.FC<TopicDeepDiveProps> = ({ topic, isOpen, onClose }) => {
  if (!topic) return null;

  // Mock data for trend and growth
  const trendYears = [2021, 2022, 2023, 2024, 2025, 2026];
  const trendValues = [0.4, 0.55, 0.7, 0.65, 0.8, topic.priority]; // Ends at current priority

  const masteryYears = [1, 2, 3, 4, 5];
  const masteryValues = [0.15, 0.25, 0.35, 0.42, topic.mastery]; // Ends at current mastery

  // Generate SVG Points for Line Chart
  const chartWidth = 300;
  const chartHeight = 120;
  
  const linePoints = trendValues.map((val, idx) => {
    const x = (idx / (trendValues.length - 1)) * chartWidth;
    const y = chartHeight - (val * chartHeight);
    return `${x},${y}`;
  }).join(" ");

  // Generate SVG Points for Area Chart
  const areaPointsArray = masteryValues.map((val, idx) => {
    const x = (idx / (masteryValues.length - 1)) * chartWidth;
    const y = chartHeight - (val * chartHeight);
    return { x, y };
  });
  const areaPath = [
    `0,${chartHeight}`,
    ...areaPointsArray.map(p => `${p.x},${p.y}`),
    `${chartWidth},${chartHeight}`
  ].join(" ");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-neutral-950 border-l border-neutral-850 p-6 z-50 shadow-2xl flex flex-col gap-6 overflow-y-auto text-neutral-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Cognitive Deep Dive
                </span>
                <h3 className="text-lg font-black text-white mt-1 leading-tight">
                  {topic.topic_name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-900 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {/* XAI Reasoning Callout */}
            <div className="p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-xl leading-relaxed text-xs text-neutral-300 font-serif">
              {topic.explanation}
            </div>

            {/* Trend Graph (Priority over years) */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Exam Priority Trend (2021 - 2026)
              </h4>
              <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-850">
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75, 1.0].map((yVal, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={chartHeight - (yVal * chartHeight)}
                      x2={chartWidth}
                      y2={chartHeight - (yVal * chartHeight)}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Trend Line Path */}
                  <polyline
                    fill="none"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth="3"
                    points={linePoints}
                  />

                  {/* Vertices circles */}
                  {trendValues.map((val, idx) => {
                    const x = (idx / (trendValues.length - 1)) * chartWidth;
                    const y = chartHeight - (val * chartHeight);
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="rgb(99, 102, 241)"
                        stroke="rgb(17, 24, 39)"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>

                {/* Years Labels */}
                <div className="flex justify-between text-[8px] font-mono text-neutral-500 mt-2">
                  {trendYears.map((year, i) => (
                    <span key={i}>{year}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mastery Growth Area Chart */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                BKT Mastery Calibration Timeline
              </h4>
              <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-850">
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75, 1.0].map((yVal, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={chartHeight - (yVal * chartHeight)}
                      x2={chartWidth}
                      y2={chartHeight - (yVal * chartHeight)}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Area Fill */}
                  <polygon
                    fill="rgba(16, 185, 129, 0.15)"
                    points={areaPath}
                  />
                  
                  {/* Boundary Line */}
                  <polyline
                    fill="none"
                    stroke="rgb(16, 185, 129)"
                    strokeWidth="2"
                    points={areaPointsArray.map(p => `${p.x},${p.y}`).join(" ")}
                  />
                </svg>

                {/* Attempts Labels */}
                <div className="flex justify-between text-[8px] font-mono text-neutral-500 mt-2">
                  <span>Initial Calibration</span>
                  <span>Practice 2</span>
                  <span>Practice 3</span>
                  <span>Practice 4</span>
                  <span>Current Mastery</span>
                </div>
              </div>
            </div>

            {/* Current Affairs & Syllabus Tags */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Linked Current Affairs & Context
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-red-950/40 border border-red-900/40 text-red-400 rounded-md text-[10px] font-bold uppercase tracking-wide">
                  PIB Press Release 2026
                </span>
                <span className="px-2.5 py-1 bg-blue-950/40 border border-blue-900/40 text-blue-400 rounded-md text-[10px] font-bold uppercase tracking-wide">
                  Supreme Court Judgment Ref
                </span>
                <span className="px-2.5 py-1 bg-amber-950/40 border border-amber-900/40 text-amber-400 rounded-md text-[10px] font-bold uppercase tracking-wide">
                  Syllabus Sec II
                </span>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
