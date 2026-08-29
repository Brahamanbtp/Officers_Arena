"use client";

import React, { useState } from "react";
import { useArenaStore } from "../../store/useArenaStore";
import { 
  Award, AlertTriangle, CheckCircle2, XCircle, HelpCircle, 
  RotateCcw, Sparkles, BrainCircuit, ShieldCheck, Zap, Scale
} from "lucide-react";

export const CommandDiagnosticReport: React.FC = () => {
  const mockQuestions = useArenaStore((state) => state.mockQuestions);
  const userAnswers = useArenaStore((state) => state.userAnswers);
  const mode = useArenaStore((state) => state.mode);
  const resetMockTest = useArenaStore((state) => state.resetMockTest);

  const [activeFilter, setActiveFilter] = useState<"all" | "overconfident" | "neutral" | "incorrect" | "unattempted">("all");

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
  let neutralUncertainCount = 0;  // Confidence 3 (Neutral/Uncertain Calibration)

  mockQuestions.forEach((q, idx) => {
    const ans = userAnswers[idx];
    const selected = ans?.selectedOption;
    const confidence = ans?.confidence || 3;

    if (selected === null || selected === undefined) {
      unattemptedCount++;
    } else {
      if (selected === q.correct_answer) {
        correctCount++;
        if (confidence >= 4) confidentCorrect++;
        else if (confidence <= 2) hesitantCorrect++;
        else neutralUncertainCount++;
      } else {
        incorrectCount++;
        if (confidence >= 4) overconfidentMistakes++;
        else if (confidence <= 2) hesitantMistakes++;
        else neutralUncertainCount++;
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

  // Filtered Question List for Socratic Review Drawer
  const filteredQuestions = mockQuestions.filter((q, idx) => {
    const ans = userAnswers[idx];
    const selected = ans?.selectedOption;
    const confidence = ans?.confidence || 3;
    const isCorrect = selected === q.correct_answer;
    const isUnattempted = selected === null || selected === undefined;

    if (activeFilter === "overconfident") return !isCorrect && !isUnattempted && confidence >= 4;
    if (activeFilter === "neutral") return !isUnattempted && confidence === 3;
    if (activeFilter === "incorrect") return !isCorrect && !isUnattempted;
    if (activeFilter === "unattempted") return isUnattempted;
    return true;
  });

  return (
    <div className="bg-[#0f0f0f] border border-neutral-800 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col gap-8 text-neutral-100 max-w-4xl mx-auto my-6 font-sans">
      
      {/* Header & Retake CTA */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block">
              Official Command Performance Audit
            </span>
            <h2 className="text-2xl font-black text-white mt-0.5">
              {mode} Diagnostic Report ({mockQuestions.length} Items)
            </h2>
          </div>
        </div>

        <button
          onClick={resetMockTest}
          className="px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer text-neutral-200 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 text-neutral-300" />
          Retake Test
        </button>
      </div>

      {/* 1. REALISTIC SCORING ENGINE: NET SCORE VS PROJECTED CUT-OFF */}
      <div className="bg-[#141414] border border-neutral-800 p-6 rounded-2xl flex flex-col gap-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-300 block">
              Scoring Engine Formula
            </span>
            <h3 className="text-sm font-black font-mono text-amber-400 mt-1">
              Net Score = (Correct × {markPerCorrect}) - (Incorrect × {penaltyPerIncorrect})
            </h3>
          </div>

          {/* Cutoff Clearance Status Badge */}
          <div className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto ${
            isCutoffCleared
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-500/10"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-lg shadow-rose-500/10"
          }`}>
            {isCutoffCleared ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {isCutoffCleared ? "Cut-Off Cleared (Command Standard)" : "Below Cut-Off Threshold"}
          </div>
        </div>

        {/* Score vs Cutoff Visual Meter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Your Net Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-amber-400">{netScore.toFixed(2)}</span>
              <span className="text-xs font-mono text-neutral-400">/ {maxPossibleScore.toFixed(1)} pts</span>
            </div>
            <span className="text-xs text-neutral-300">Net Percentage: {netPercentage.toFixed(1)}%</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Projected Cut-Off Mark</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-neutral-200">{projectedCutoffMark.toFixed(2)}</span>
              <span className="text-xs font-mono text-neutral-400">({cutoffPercentage}% Threshold)</span>
            </div>
            <span className="text-xs text-neutral-300">Based on historic {mode} cut-off trends</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neutral-300">
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

      {/* 2. METACOGNITIVE BIAS MATRIX (5-BUCKET CALIBRATION) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <Zap className="w-4.5 h-4.5 text-amber-500" />
            Metacognitive Bias Matrix (Confidence vs Accuracy)
          </h3>
          <span className="text-xs text-neutral-400 font-semibold">5-Level Calibration Spectrum</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Q1: Overconfident Mistakes */}
          <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col justify-between gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Overconfident Mistakes
              </span>
              <span className="text-2xl font-black font-mono text-rose-400">{overconfidentMistakes}</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Confidence 4-5/5 but incorrect. False mastery or examiner trap.
            </p>
          </div>

          {/* Q2: Neutral / Uncertain Calibration (3/5 Confidence) */}
          <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex flex-col justify-between gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" />
                Neutral / Uncertain (3/5)
              </span>
              <span className="text-2xl font-black font-mono text-blue-400">{neutralUncertainCount}</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Confidence 3/5. Moderate certainty boundary requiring review.
            </p>
          </div>

          {/* Q3: Hesitant Correct Answers */}
          <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col justify-between gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Hesitant Correct (Guesses)
              </span>
              <span className="text-2xl font-black font-mono text-amber-400">{hesitantCorrect}</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Confidence 1-2/5 but correct. Intuitive elimination; needs consolidation.
            </p>
          </div>

          {/* Q4: Confident Correct (TRUE MASTERY) */}
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col justify-between gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Confident Correct (Mastery)
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">{confidentCorrect}</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Confidence 4-5/5 and correct. Locked-in cognitive mastery.
            </p>
          </div>

          {/* Q5: Hesitant Mistakes */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between gap-3 shadow-lg lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-neutral-400" />
                Hesitant Mistakes (Knowledge Gap)
              </span>
              <span className="text-2xl font-black font-mono text-neutral-200">{hesitantMistakes}</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Confidence 1-2/5 and incorrect. Recognized knowledge gap requiring fundamental textbook reading.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SOCRATIC REVIEW DRAWER (FILTERABLE ITEM BREAKDOWN) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <BrainCircuit className="w-4.5 h-4.5 text-amber-500" />
            Socratic Review Drawer ({filteredQuestions.length} Items)
          </h3>

          {/* Filter Tabs */}
          <div className="flex flex-wrap p-1 bg-[#141414] border border-neutral-800 rounded-xl text-xs font-bold uppercase gap-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeFilter === "all" ? "bg-amber-600 text-neutral-950 font-black" : "text-neutral-300 hover:text-white"}`}
            >
              All ({mockQuestions.length})
            </button>
            <button
              onClick={() => setActiveFilter("overconfident")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeFilter === "overconfident" ? "bg-rose-600 text-white font-black" : "text-neutral-300 hover:text-white"}`}
            >
              Overconfident ({overconfidentMistakes})
            </button>
            <button
              onClick={() => setActiveFilter("neutral")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeFilter === "neutral" ? "bg-blue-600 text-white font-black" : "text-neutral-300 hover:text-white"}`}
            >
              Neutral 3/5 ({neutralUncertainCount})
            </button>
            <button
              onClick={() => setActiveFilter("incorrect")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeFilter === "incorrect" ? "bg-amber-600/30 text-amber-300 font-black" : "text-neutral-300 hover:text-white"}`}
            >
              Incorrect ({incorrectCount})
            </button>
            <button
              onClick={() => setActiveFilter("unattempted")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeFilter === "unattempted" ? "bg-neutral-800 text-neutral-200 font-black" : "text-neutral-300 hover:text-white"}`}
            >
              Unattempted ({unattemptedCount})
            </button>
          </div>
        </div>

        {/* Item List */}
        <div className="flex flex-col gap-4">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-[#141414] border border-neutral-800 rounded-2xl text-neutral-300 text-xs font-semibold">
              No questions found for the selected filter criteria.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const origIdx = mockQuestions.findIndex((orig) => orig.id === q.id);
              const ans = userAnswers[origIdx];
              const selected = ans?.selectedOption;
              const confidence = ans?.confidence || 3;
              const isCorrect = selected === q.correct_answer;
              const isUnattempted = selected === null || selected === undefined;

              let statusBadge = (
                <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Incorrect (-{penaltyPerIncorrect})
                </span>
              );

              if (isCorrect) {
                statusBadge = (
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{markPerCorrect})
                  </span>
                );
              } else if (isUnattempted) {
                statusBadge = (
                  <span className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" /> Unattempted (0.0)
                  </span>
                );
              }

              return (
                <div 
                  key={q.id || origIdx}
                  className="bg-[#141414] border border-neutral-800 p-6 rounded-2xl flex flex-col gap-4 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-200 flex items-center justify-center">
                        {origIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                        {(q.metadata as any)?.subject || `${mode} Subject`}
                      </span>
                      <span className="text-xs font-mono text-amber-400 font-bold ml-2">
                        Confidence: {confidence}/5
                      </span>
                    </div>
                    {statusBadge}
                  </div>

                  <p className="text-sm md:text-base text-neutral-100 leading-relaxed font-medium">
                    {q.text}
                  </p>

                  {/* Option Matrix Review */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-1">
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
                          className={`p-3.5 rounded-xl border text-xs md:text-sm flex items-center justify-between ${optStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold">{optKey}.</span>
                            <span>{optVal}</span>
                          </div>
                          {isCorrectOpt && (
                            <span className="text-xs font-bold uppercase text-emerald-400">Correct Answer</span>
                          )}
                          {isSelectedOpt && !isCorrectOpt && (
                            <span className="text-xs font-bold uppercase text-red-400">Your Choice</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Socratic Breakdown */}
                  {q.explanation && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs md:text-sm text-neutral-200 leading-relaxed flex flex-col gap-1.5 mt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Socratic Breakdown & Conceptual Framework
                      </span>
                      <p className="text-xs text-neutral-300 mt-1">
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
