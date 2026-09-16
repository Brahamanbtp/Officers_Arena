"use client";

import React, { useState } from "react";
import { useArenaStore } from "../../store/useArenaStore";
import { 
  Award, AlertTriangle, CheckCircle2, XCircle, HelpCircle, 
  RotateCcw, Sparkles, BrainCircuit, ShieldCheck, Zap, Scale, Clock, Timer, TrendingUp
} from "lucide-react";
import { MathRenderer } from "../shared/MathRenderer";

export const CommandDiagnosticReport: React.FC = () => {
  const mockQuestions = useArenaStore((state) => state.mockQuestions);
  const userAnswers = useArenaStore((state) => state.userAnswers);
  const questionTimes = useArenaStore((state) => state.questionTimes);
  const averageResponseTime = useArenaStore((state) => state.averageResponseTime);
  const mode = useArenaStore((state) => state.mode);
  const resetMockTest = useArenaStore((state) => state.resetMockTest);

  const [activeFilter, setActiveFilter] = useState<"all" | "overconfident" | "neutral" | "incorrect" | "unattempted" | "slow">("all");

  // Marking Rules
  const markPerCorrect = mode === "UPSC" ? 2.0 : 0.83;
  const penaltyPerIncorrect = mode === "UPSC" ? 0.66 : 0.27;

  // Cut-off Thresholds (50% for UPSC, 42% for CDS)
  const cutoffPercentage = mode === "UPSC" ? 50.0 : 42.0;

  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  // Metacognitive Matrix Counters (1-2: Hesitant, 3: Neutral/Uncertain, 4-5: Confident)
  let overconfidentMistakes = 0; // Confidence 4-5, Incorrect
  let hesitantCorrect = 0;        // Confidence 1-2, Correct
  let confidentCorrect = 0;       // Confidence 4-5, Correct
  let hesitantMistakes = 0;       // Confidence 1-2, Incorrect
  let neutralUncertainCount = 0;  // Confidence 3

  // Chronometric Velocity Counters
  let totalTimeSeconds = 0;
  let fastAndCorrect = 0;       // < 40s and Correct
  let optimalCorrect = 0;       // 40-75s and Correct
  let timeTraps = 0;            // > 80s and Incorrect
  let impulsiveErrors = 0;      // < 20s and Incorrect

  mockQuestions.forEach((q, idx) => {
    const ans = userAnswers[idx];
    const selected = ans?.selectedOption;
    const confidence = ans?.confidence || 3;
    const qTime = ans?.timeSpentSeconds || questionTimes[q.id] || 45;
    totalTimeSeconds += qTime;

    if (selected === null || selected === undefined) {
      unattemptedCount++;
    } else {
      if (selected === q.correct_answer) {
        correctCount++;
        if (confidence >= 4) confidentCorrect++;
        else if (confidence <= 2) hesitantCorrect++;
        else neutralUncertainCount++;

        if (qTime <= 40) fastAndCorrect++;
        else if (qTime <= 75) optimalCorrect++;
      } else {
        incorrectCount++;
        if (confidence >= 4) overconfidentMistakes++;
        else if (confidence <= 2) hesitantMistakes++;
        else neutralUncertainCount++;

        if (qTime > 80) timeTraps++;
        else if (qTime < 20) impulsiveErrors++;
      }
    }
  });

  const rawScore = correctCount * markPerCorrect;
  const totalPenalty = incorrectCount * penaltyPerIncorrect;
  const netScore = Math.max(0, rawScore - totalPenalty);
  const maxPossibleScore = mockQuestions.length * markPerCorrect;
  const netPercentage = maxPossibleScore > 0 ? (netScore / maxPossibleScore) * 100 : 0;
  const projectedCutoffMark = maxPossibleScore * (cutoffPercentage / 100.0);
  const isCutoffCleared = netScore >= projectedCutoffMark;

  const calculatedAvgTime = mockQuestions.length > 0 ? Math.round(totalTimeSeconds / mockQuestions.length) : averageResponseTime;

  // Filtered Question List for Socratic Review Drawer
  const filteredQuestions = mockQuestions.filter((q, idx) => {
    const ans = userAnswers[idx];
    const selected = ans?.selectedOption;
    const confidence = ans?.confidence || 3;
    const qTime = ans?.timeSpentSeconds || questionTimes[q.id] || 45;
    const isCorrect = selected === q.correct_answer;
    const isUnattempted = selected === null || selected === undefined;

    if (activeFilter === "overconfident") return !isCorrect && !isUnattempted && confidence >= 4;
    if (activeFilter === "neutral") return !isUnattempted && confidence === 3;
    if (activeFilter === "incorrect") return !isCorrect && !isUnattempted;
    if (activeFilter === "unattempted") return isUnattempted;
    if (activeFilter === "slow") return qTime > 80;
    return true;
  });

  const formatTotalTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="bg-[#0f0f0f] border border-neutral-800 p-5 sm:p-7 md:p-8 rounded-3xl shadow-2xl flex flex-col gap-6 text-neutral-100 max-w-5xl mx-auto my-6 font-sans">
      
      {/* Header & Retake CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
            <Award className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block">
              Command Performance & Psychometric Audit
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {mode} Diagnostic Report ({mockQuestions.length} Items)
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={resetMockTest}
          className="self-start sm:self-auto px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer text-neutral-200 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 text-neutral-300" />
          <span>Retake Test</span>
        </button>
      </div>

      {/* 1. REALISTIC SCORING ENGINE: NET SCORE VS PROJECTED CUT-OFF */}
      <div className="bg-[#141414] border border-neutral-800 p-5 sm:p-6 rounded-2xl flex flex-col gap-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block">
              Official UPSC/CDS Marking Formula
            </span>
            <h3 className="text-xs sm:text-sm font-black font-mono text-amber-400 mt-0.5">
              Net Score = ({correctCount} × {markPerCorrect}) - ({incorrectCount} × {penaltyPerIncorrect})
            </h3>
          </div>

          {/* Cutoff Clearance Status Badge */}
          <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto ${
            isCutoffCleared
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-500/10"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-lg shadow-rose-500/10"
          }`}>
            {isCutoffCleared ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{isCutoffCleared ? "Cut-Off Cleared (Command Standard)" : "Below Cut-Off Threshold"}</span>
          </div>
        </div>

        {/* Score vs Cutoff Visual Meter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Your Net Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400">{netScore.toFixed(2)}</span>
              <span className="text-xs font-mono text-neutral-400">/ {maxPossibleScore.toFixed(1)} pts</span>
            </div>
            <span className="text-xs text-neutral-300">Net Percentage: {netPercentage.toFixed(1)}%</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Projected Cut-Off Mark</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-neutral-200">{projectedCutoffMark.toFixed(2)}</span>
              <span className="text-xs font-mono text-neutral-400">({cutoffPercentage}% Threshold)</span>
            </div>
            <span className="text-xs text-neutral-400">Based on historic {mode} cut-off trends</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">
              <span>Score vs Cutoff</span>
              <span className={isCutoffCleared ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {netScore >= projectedCutoffMark ? `+${(netScore - projectedCutoffMark).toFixed(2)} Ahead` : `${(netScore - projectedCutoffMark).toFixed(2)} Deficit`}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-3 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-700 ${isCutoffCleared ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-rose-600 to-rose-400"}`}
                style={{ width: `${Math.min(100, Math.max(0, netPercentage))}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                style={{ left: `${cutoffPercentage}%` }}
                title={`Target Cutoff: ${cutoffPercentage}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHRONOMETRIC RESPONSE TIME VELOCITY PROFILING (SIR'S REQUIREMENT) */}
      <div className="bg-[#141414] border border-neutral-800 p-5 sm:p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              Item-Level Chronometrics & Solving Velocity
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
            <span>Total Time: <strong className="text-white">{formatTotalTime(totalTimeSeconds)}</strong></span>
            <span>•</span>
            <span>Avg Speed: <strong className="text-amber-400">{calculatedAvgTime}s / item</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block">Fast & Accurate (&lt;40s)</span>
            <span className="text-xl font-mono font-black text-white">{fastAndCorrect} items</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">High automaticity</span>
          </div>

          <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-blue-400 block">Optimal Range (40-75s)</span>
            <span className="text-xl font-mono font-black text-white">{optimalCorrect} items</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Solid analytical rhythm</span>
          </div>

          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-rose-400 block">Impulsive Errors (&lt;20s)</span>
            <span className="text-xl font-mono font-black text-white">{impulsiveErrors} items</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Careless slip risk</span>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-amber-400 block">Time Traps (&gt;80s Wrong)</span>
            <span className="text-xl font-mono font-black text-white">{timeTraps} items</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Wasted exam buffer</span>
          </div>
        </div>
      </div>

      {/* 3. METACOGNITIVE BIAS MATRIX (5-BUCKET CALIBRATION) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Metacognitive Bias Matrix (Confidence vs Accuracy)
          </h3>
          <span className="text-[11px] text-neutral-400 font-semibold">5-Level Calibration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Q1: Overconfident Mistakes */}
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col justify-between gap-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Overconfident Mistakes
              </span>
              <span className="text-2xl font-black font-mono text-rose-400">{overconfidentMistakes}</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Confidence 4-5/5 but incorrect. False mastery or examiner trap.
            </p>
          </div>

          {/* Q2: Neutral / Uncertain Calibration (3/5 Confidence) */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex flex-col justify-between gap-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-400" />
                Neutral / Uncertain (3/5)
              </span>
              <span className="text-2xl font-black font-mono text-blue-400">{neutralUncertainCount}</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Confidence 3/5. Moderate certainty boundary requiring review.
            </p>
          </div>

          {/* Q3: Hesitant Correct Answers */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col justify-between gap-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Hesitant Correct (Guesses)
              </span>
              <span className="text-2xl font-black font-mono text-amber-400">{hesitantCorrect}</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Confidence 1-2/5 but correct. Correct by elimination; needs reinforcement.
            </p>
          </div>
        </div>
      </div>

      {/* 4. QUESTION-BY-QUESTION SOCRATIC REVIEW DRAWER */}
      <div className="flex flex-col gap-4 border-t border-neutral-800 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              Socratic Review & Chronometric Logs
            </h3>
            <span className="text-[11px] text-neutral-400">
              Review correct answers, explanations, and exact time taken per question.
            </span>
          </div>

          {/* Review Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-[#141414] p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "all" ? "bg-amber-600 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({mockQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("incorrect")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "incorrect" ? "bg-rose-600 text-white font-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Incorrect ({incorrectCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("slow")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "slow" ? "bg-purple-600 text-white font-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Time Traps ({timeTraps})
            </button>
          </div>
        </div>

        {/* Item List */}
        <div className="flex flex-col gap-3.5">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-[#141414] border border-neutral-800 rounded-2xl text-neutral-400 text-xs font-semibold">
              No questions found for the selected filter criteria.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const origIdx = mockQuestions.findIndex((orig) => orig.id === q.id);
              const ans = userAnswers[origIdx];
              const selected = ans?.selectedOption;
              const confidence = ans?.confidence || 3;
              const qTime = ans?.timeSpentSeconds || questionTimes[q.id] || 45;
              const isCorrect = selected === q.correct_answer;
              const isUnattempted = selected === null || selected === undefined;

              let statusBadge = (
                <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-bold uppercase flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Incorrect (-{penaltyPerIncorrect})
                </span>
              );

              if (isCorrect) {
                statusBadge = (
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-[11px] font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{markPerCorrect})
                  </span>
                );
              } else if (isUnattempted) {
                statusBadge = (
                  <span className="px-2.5 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg text-[11px] font-bold uppercase flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Unattempted
                  </span>
                );
              }

              return (
                <div 
                  key={q.id || origIdx}
                  className="bg-[#141414] border border-neutral-800 p-5 rounded-2xl flex flex-col gap-3.5 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-200 flex items-center justify-center">
                        {origIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                        {(q.metadata as any)?.subject || `${mode} Subject`}
                      </span>
                      <span className="text-[11px] font-mono text-purple-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {qTime}s
                      </span>
                    </div>
                    {statusBadge}
                  </div>

                  <p className="text-sm text-neutral-100 leading-relaxed font-medium">
                    {q.text}
                  </p>

                  {/* Option Matrix Review */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    {Object.entries(q.options).map(([optKey, optVal]) => {
                      const isSelectedOpt = selected === optKey;
                      const isCorrectOpt = q.correct_answer === optKey;

                      let optStyle = "bg-[#0a0a0a] border-neutral-800 text-neutral-300";
                      if (isCorrectOpt) {
                        optStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-200 font-semibold";
                      } else if (isSelectedOpt && !isCorrectOpt) {
                        optStyle = "bg-red-500/10 border-red-500/50 text-red-200 font-semibold";
                      }

                      return (
                        <div 
                          key={optKey}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{optKey}.</span>
                            <span>{optVal}</span>
                          </div>
                          {isCorrectOpt && (
                            <span className="text-[10px] font-bold uppercase text-emerald-400">Correct Answer</span>
                          )}
                          {isSelectedOpt && !isCorrectOpt && (
                            <span className="text-[10px] font-bold uppercase text-red-400">Your Choice</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Socratic Breakdown */}
                  {q.explanation && (
                    <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-neutral-200 leading-relaxed flex flex-col gap-1 mt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Socratic Breakdown
                      </span>
                      <p className="text-xs text-neutral-300">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandDiagnosticReport;
