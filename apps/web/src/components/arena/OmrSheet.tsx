"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Bookmark, RefreshCw, PenTool } from "lucide-react";
import { useArenaStore } from "@/src/store/useArenaStore";

interface OmrSheetProps {
  totalQuestions?: number;
  currentQuestionIndex: number;
  selectedAnswers: Record<number, string>; // { [questionIndex]: "A" | "B" | "C" | "D" }
  markedForReview: Record<number, boolean>;
  onSelectBubble: (questionIndex: number, optionKey: string) => void;
  onNavigateQuestion: (questionIndex: number) => void;
  onToggleReview?: (questionIndex: number) => void;
  isMockMode?: boolean;
}

export const OmrSheet: React.FC<OmrSheetProps> = ({
  totalQuestions = 100,
  currentQuestionIndex,
  selectedAnswers,
  markedForReview,
  onSelectBubble,
  onNavigateQuestion,
  onToggleReview,
  isMockMode = true
}) => {
  const mode = useArenaStore((state) => state.mode);
  const options = ["A", "B", "C", "D"];
  const questionsList = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  const attemptedCount = Object.keys(selectedAnswers).length;
  const unattemptedCount = totalQuestions - attemptedCount;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;

  return (
    <div className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6 text-neutral-200">
      {/* OMR Header & Physical Sheet Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white tracking-wide uppercase font-mono">
              {mode === "UPSC" ? "UPSC Civil Services Prelims OMR Sheet" : "CDS Defence Services Examination OMR Sheet"}
            </h3>
          </div>
          <p className="text-xs text-neutral-400 font-mono">
            Optical Mark Recognition Simulation • Black Ballpoint Ink Mode • Negative Marking: {mode === "UPSC" ? "-0.66" : "-0.27"} per error
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2.5 font-mono text-xs">
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Attempted: {attemptedCount}
          </div>
          <div className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl">
            Left: {unattemptedCount}
          </div>
          {reviewCount > 0 && (
            <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-xl font-bold">
              Review: {reviewCount}
            </div>
          )}
        </div>
      </div>

      {/* Physical Paper Texture Grid Container */}
      <div className="bg-[#141414] border border-neutral-850 rounded-2xl p-4 sm:p-6 shadow-inner overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 min-w-[640px]">
          {[0, 1, 2, 3].map((colIdx) => {
            const startNum = colIdx * 25 + 1;
            const endNum = Math.min(startNum + 24, totalQuestions);
            const colQuestions = questionsList.slice(startNum - 1, endNum);

            return (
              <div key={colIdx} className="space-y-2 border-r border-neutral-800/60 last:border-r-0 pr-3">
                <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider font-bold pb-1 text-center border-b border-neutral-850">
                  Q. {startNum} - Q. {endNum}
                </div>

                <div className="space-y-1.5 pt-1">
                  {colQuestions.map((qNum) => {
                    const qIdx = qNum - 1;
                    const isCurrent = qIdx === currentQuestionIndex;
                    const selected = selectedAnswers[qIdx];
                    const isReview = Boolean(markedForReview[qIdx]);

                    return (
                      <div
                        key={qNum}
                        onClick={() => onNavigateQuestion(qIdx)}
                        className={`flex items-center justify-between px-2 py-1 rounded-lg transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-amber-500/20 border border-amber-500/40"
                            : "hover:bg-neutral-900/60"
                        }`}
                      >
                        {/* Question Number */}
                        <div className="flex items-center gap-1.5 w-10">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isCurrent ? "text-amber-400" : selected ? "text-neutral-200" : "text-neutral-500"
                            }`}
                          >
                            {String(qNum).padStart(2, "0")}
                          </span>
                          {isReview && <Bookmark className="w-2.5 h-2.5 text-purple-400 fill-purple-400" />}
                        </div>

                        {/* Bubbles A, B, C, D */}
                        <div className="flex items-center gap-1.5">
                          {options.map((opt) => {
                            const isFilled = selected === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectBubble(qIdx, opt);
                                }}
                                title={`Bubble Option ${opt} for Q.${qNum}`}
                                className={`w-5 h-5 rounded-full border text-[9px] font-mono font-bold flex items-center justify-center transition-all ${
                                  isFilled
                                    ? "bg-neutral-100 border-white text-neutral-950 shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-105"
                                    : "border-neutral-700 bg-neutral-950 text-neutral-400 hover:border-amber-400/80 hover:text-amber-300"
                                }`}
                              >
                                {isFilled ? "●" : opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OMR Usage Instructions */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-500 gap-2 pt-2 border-t border-neutral-850">
        <div>💡 Click any bubble to mark ink. Click again to unmark. UPSC penalty: <strong className="text-red-400">-0.66 marks</strong> for wrong answer.</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-white inline-block" /> Marked Ink
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border border-amber-400 inline-block" /> Active Question
          </span>
        </div>
      </div>
    </div>
  );
};
