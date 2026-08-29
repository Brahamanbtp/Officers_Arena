"use client";

import React from "react";
import { Check, Edit, Sparkles, AlertCircle, BarChart2 } from "lucide-react";

export interface ParsedQuestionItem {
  content: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: number;
  confidence: number;
  subject?: string;
}

interface IngestionPreviewProps {
  questions: ParsedQuestionItem[];
  onApprove: (index: number) => void;
}

export const IngestionPreview: React.FC<IngestionPreviewProps> = ({ questions, onApprove }) => {
  if (questions.length === 0) return null;

  return (
    <div className="w-full space-y-4 font-sans select-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Parsed Question Candidate Queue ({questions.length})
        </span>
        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
          Review & Commit to Live Bank
        </span>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const confidencePct = Math.round(q.confidence * 100);
          const isHighConfidence = confidencePct >= 90;

          return (
            <div
              key={idx}
              className="bg-[#111111] border border-neutral-850 p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-850 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded-md font-mono font-bold text-[10px] text-amber-400">
                    EXHIBIT #{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {q.subject || "Indian Polity"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isHighConfidence 
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                      : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  }`}>
                    {confidencePct}% AI Confidence
                  </span>

                  <span className="text-[10px] font-mono text-neutral-500">
                    Diff: {q.difficulty.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-xs md:text-sm text-neutral-200 font-medium leading-relaxed whitespace-pre-line">
                {q.content}
              </p>

              {/* Options Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correct_index;
                  const label = String.fromCharCode(65 + oIdx);

                  return (
                    <div
                      key={oIdx}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isCorrect
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold"
                          : "bg-[#0a0a0a] border-neutral-850 text-neutral-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] opacity-70">{label}.</span>
                        <span>{opt}</span>
                      </div>
                      {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-xl text-[11px] text-neutral-400 leading-relaxed">
                <strong className="text-amber-500 font-bold uppercase tracking-wider block mb-1">
                  Socratic Breakdown:
                </strong>
                {q.explanation}
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onApprove(idx)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve & Commit Question
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
