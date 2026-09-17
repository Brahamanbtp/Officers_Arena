"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArenaStore } from "../../store/useArenaStore";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Bookmark,
  Sparkles,
  BookOpen,
  Brain,
  Loader2,
  AlertTriangle,
  Clock,
  Zap,
  Sliders,
  Ban
} from "lucide-react";
import { MathRenderer } from "../shared/MathRenderer";
import { QuestionRenderer } from "./QuestionRenderer";
import { MapViewer } from "../shared/MapViewer";
import { getEffectiveUserId } from "../../lib/authUtils";

interface QuestionCardProps {
  onSubmit: (optionId: string, confidence: number) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ onSubmit, onNext, isLoading = false }) => {
  const testMode = useArenaStore((state) => state.testMode);
  const currentQuestion = useArenaStore((state) => state.currentQuestion);
  const selectedOption = useArenaStore((state) => state.selectedOption);
  const confidence = useArenaStore((state) => state.confidence);
  const showFeedback = useArenaStore((state) => state.showFeedback);
  const isCorrectResult = useArenaStore((state) => state.isCorrectResult);
  
  const mockQuestions = useArenaStore((state) => state.mockQuestions);
  const activeQuestionIndex = useArenaStore((state) => state.activeQuestionIndex);
  const userAnswers = useArenaStore((state) => state.userAnswers);
  const setActiveQuestionIndex = useArenaStore((state) => state.setActiveQuestionIndex);
  const recordMockAnswer = useArenaStore((state) => state.recordMockAnswer);
  const toggleMarkForReview = useArenaStore((state) => state.toggleMarkForReview);
  
  const enableConfidenceRating = useArenaStore((state) => state.enableConfidenceRating);
  const setEnableConfidenceRating = useArenaStore((state) => state.setEnableConfidenceRating);
  const recordQuestionTime = useArenaStore((state) => state.recordQuestionTime);
  const questionTimes = useArenaStore((state) => state.questionTimes);

  const setSelectedOption = useArenaStore((state) => state.setSelectedOption);
  const setConfidence = useArenaStore((state) => state.setConfidence);
  const examMode = useAuthStore((state) => state.examMode);

  // Live Item-Level Chronometric Timer
  const [itemTimeSeconds, setItemTimeSeconds] = useState<number>(0);

  // Option Elimination / Strikethrough State (Pen-and-paper UPSC technique)
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, boolean>>({});

  // Conceptual Error Analysis State (Option Tracing)
  const [errorAnalysis, setErrorAnalysis] = useState<{
    misconception_tag?: string;
    error_category: string;
    identified_gap: string;
    recommendation: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Reset timer & elimination on question change
  useEffect(() => {
    setErrorAnalysis(null);
    setEliminatedOptions({});
    setItemTimeSeconds(0);
    const interval = setInterval(() => {
      setItemTimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion?.id]);

  const toggleEliminateOption = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setEliminatedOptions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
    // If currently selected, deselect
    if (selectedOption === key) {
      setSelectedOption(null);
    }
  };

  const handleAnalyzeMistake = async () => {
    if (!currentQuestion || isAnalyzing) return;
    setIsAnalyzing(true);

    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentQuestion.id);
    const validQuestionId = isUUID ? currentQuestion.id : "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

    try {
      const res = await fetch(`${apiEndpoint}/api/v1/tutor/analyze-error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getEffectiveUserId(),
          question_id: validQuestionId,
          user_answer: selectedOption || "A"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setErrorAnalysis(data);
      } else {
        setErrorAnalysis({
          error_category: isCorrectResult ? "Mastery Verified" : "Conceptual Trap",
          identified_gap: isCorrectResult
            ? "Your reasoning correctly isolated statement 1 while eliminating distractor 2."
            : "Fell for a subtle conceptual trap in option choice. Confused procedure requirement rules.",
          recommendation: "Review Laxmikanth Chapter 3 (Salient Features of the Constitution)."
        });
      }
    } catch (e) {
      setErrorAnalysis({
        error_category: isCorrectResult ? "Mastery Verified" : "Conceptual Trap",
        identified_gap: isCorrectResult
          ? "Your reasoning correctly isolated statement 1 while eliminating distractor 2."
          : "Fell for a subtle conceptual trap in option choice. Confused procedure requirement rules.",
        recommendation: "Review Laxmikanth Chapter 3 (Salient Features of the Constitution)."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Loading state
  if (isLoading || !currentQuestion) {
    return (
      <div className="w-full bg-[#111111] border border-neutral-800 p-8 rounded-3xl space-y-6 shadow-2xl animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 bg-neutral-800 rounded-md" />
          <div className="h-5 w-20 bg-neutral-800 rounded-md" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-full bg-neutral-800 rounded-lg" />
          <div className="h-6 w-4/5 bg-neutral-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-neutral-850 border border-neutral-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const optionsMap = currentQuestion.options || {};
  const isMockMode = testMode === "mock";

  // Active answer in Mock Mode
  const currentMockAns = userAnswers[activeQuestionIndex];
  const isMarked = currentMockAns?.markedForReview || false;

  const handleSelectOption = (key: string) => {
    if (isMockMode) {
      recordMockAnswer(activeQuestionIndex, key, confidence, itemTimeSeconds);
      if (currentQuestion) {
        recordQuestionTime(currentQuestion.id, itemTimeSeconds);
      }
    } else {
      setSelectedOption(key);
    }
  };

  const handleSelectConfidence = (lvl: number) => {
    if (isMockMode) {
      recordMockAnswer(activeQuestionIndex, selectedOption, lvl, itemTimeSeconds);
    } else {
      setConfidence(lvl);
    }
  };

  // Frictionless Submission: Selecting an option immediately allows submission!
  const isReadyToSubmit = selectedOption !== null && !showFeedback;

  const handleExecuteSubmit = () => {
    if (!selectedOption) return;
    if (currentQuestion) {
      recordQuestionTime(currentQuestion.id, itemTimeSeconds);
    }
    // If confidence rating is skipped or disabled, pass default calibrated score (3)
    const effectiveConfidence = confidence !== null ? confidence : 3;
    onSubmit(selectedOption, effectiveConfidence);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full bg-[#111111] border border-neutral-800 p-5 sm:p-7 md:p-8 rounded-3xl shadow-2xl flex flex-col gap-5 relative select-none font-sans"
      >
        {/* Header Badge, Source Provenance & Live Item Chronometrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-neutral-850 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg font-bold text-xs uppercase tracking-widest text-amber-400">
              {(currentQuestion.metadata as any)?.subject || `${examMode} Subject`}
            </span>
            
            {/* Provenance Badge (Official PYQ vs Standard Textbook) */}
            {(currentQuestion.metadata as any)?.source_type === "TEXTBOOK_PRACTICE" || (currentQuestion.metadata as any)?.book_chapter ? (
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                {(currentQuestion.metadata as any)?.book_chapter || "Standard Textbook Practice"}
                {(currentQuestion.metadata as any)?.book_page_number ? ` (Pg. ${(currentQuestion.metadata as any).book_page_number})` : ""}
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {(currentQuestion.metadata as any)?.source || `${examMode} Official PYQ`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Item Chronometric Speedometer */}
            <div className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] font-bold text-neutral-300 flex items-center gap-1.5" title="Time spent on this specific question">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{itemTimeSeconds}s</span>
              <span className="text-[10px] text-neutral-500 font-normal">
                {itemTimeSeconds < 20 ? "(Fast)" : itemTimeSeconds > 80 ? "(Deliberate)" : "(Optimal)"}
              </span>
            </div>

            {/* Optional Metacognitive Calibration Toggle (Practice Mode) */}
            {!isMockMode && (
              <button
                type="button"
                onClick={() => setEnableConfidenceRating(!enableConfidenceRating)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition-all flex items-center gap-1 cursor-pointer ${
                  enableConfidenceRating 
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40" 
                    : "bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300"
                }`}
                title="Toggle self-reported confidence calibration rating"
              >
                <Brain className="w-3 h-3" />
                <span>Confidence Rating: {enableConfidenceRating ? "ON" : "OFF"}</span>
              </button>
            )}

            {/* Mark for Review in Mock Mode */}
            {isMockMode && (
              <button
                type="button"
                onClick={() => toggleMarkForReview(activeQuestionIndex)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isMarked
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isMarked ? "text-purple-400 fill-purple-400" : "text-neutral-400"}`} />
                <span>{isMarked ? "Marked" : "Review"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Text & Visual Content */}
        <div className="text-sm md:text-base text-neutral-100 font-medium leading-relaxed space-y-3">
          {/* UPSC 2023-2026 Pairwise Trap Detection Banner */}
          {/only one pair|only two pairs|all three pairs|none of the pairs|how many of the pairs/i.test(
            currentQuestion.text + " " + JSON.stringify(currentQuestion.options || {})
          ) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-300 font-mono">UPSC Pairwise Format (2023–2026 Trend): </strong>
                <span>Standard option elimination does not work here. You must independently determine the truth value of each statement pair.</span>
              </div>
            </div>
          )}

          <QuestionRenderer 
            text={currentQuestion.text} 
            imageUrls={(currentQuestion.images || []).reduce((acc, img) => {
              const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
              const fullUrl = img.url.startsWith("http") ? img.url : `${apiEndpoint}${img.url}`;
              acc[img.id] = fullUrl;
              return acc;
            }, {} as Record<string, string>)}
          />
          {currentQuestion.images && currentQuestion.images.length > 0 && !/\[IMAGE_REF:/i.test(currentQuestion.text) && (
            <div className="flex flex-col gap-3 pt-2">
              {currentQuestion.images.map((img) => {
                const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                const fullUrl = img.url.startsWith("http") ? img.url : `${apiEndpoint}${img.url}`;
                return (
                  <MapViewer
                    key={img.id}
                    src={fullUrl}
                    alt={img.description || "Original PDF Figure Exhibit"}
                    caption={img.description || "Original PDF Figure Exhibit: Click to open pan & zoom interface"}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Options Group (1-Click Selection + Option Elimination Strikethrough Tool) */}
        <div className="grid grid-cols-1 gap-3 pt-1">
          {Object.entries(optionsMap).map(([key, value]) => {
            const isSelected = selectedOption === key;
            const isCorrect = key === currentQuestion.correct_answer;
            const isEliminated = Boolean(eliminatedOptions[key]);

            let borderStyle = "border-neutral-800 bg-[#0a0a0a] text-neutral-200 hover:border-neutral-700";
            let iconElement = null;

            // In Practice Mode with feedback enabled:
            if (!isMockMode && showFeedback) {
              if (isCorrect) {
                borderStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10";
                iconElement = <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
              } else if (isSelected && !isCorrect) {
                borderStyle = "border-red-500 bg-red-500/10 text-red-300 font-bold shadow-lg shadow-red-500/10";
                iconElement = <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
              } else {
                borderStyle = "border-neutral-850 bg-[#0a0a0a]/50 text-neutral-400 opacity-60";
              }
            } else if (isEliminated) {
              borderStyle = "border-neutral-900 bg-neutral-950/70 text-neutral-500 opacity-40";
            } else if (isSelected) {
              // In Mock Mode OR Practice Mode before feedback:
              borderStyle = "border-amber-500 bg-amber-500/10 text-amber-300 font-bold shadow-lg";
              iconElement = <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />;
            }

            return (
              <div key={key} className="relative flex items-center group">
                <button
                  type="button"
                  disabled={(!isMockMode && showFeedback) || isEliminated}
                  onClick={() => handleSelectOption(key)}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-sm md:text-base text-left flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer ${borderStyle} ${
                    isEliminated ? "line-through cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 pr-10">
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs border shrink-0 ${
                      isEliminated ? "bg-neutral-900 border-neutral-850 text-neutral-600 line-through" :
                      isSelected ? "bg-amber-500 text-neutral-950 border-amber-400" : "bg-neutral-900 border-neutral-800 text-neutral-300"
                    }`}>
                      {key}
                    </span>
                    <div className={`text-neutral-200 text-xs sm:text-sm ${isEliminated ? "line-through text-neutral-500" : ""}`}>
                      <MathRenderer content={value as string} inline />
                    </div>
                  </div>
                  {iconElement}
                </button>

                {/* Option Elimination (Strikethrough) Action Button */}
                {(!showFeedback || isMockMode) && (
                  <button
                    type="button"
                    onClick={(e) => toggleEliminateOption(e, key)}
                    title={isEliminated ? `Restore Option ${key}` : `Eliminate Option ${key} (UPSC Strikethrough)`}
                    className={`absolute right-3 p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isEliminated
                        ? "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                        : "bg-neutral-900/80 text-neutral-500 border-neutral-800 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-500/40"
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Metacognitive Confidence Rating (Only shown when enabled by user) */}
        {!isMockMode && enableConfidenceRating && selectedOption !== null && !showFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pt-3 border-t border-neutral-850 space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-purple-400">
                <HelpCircle className="w-4 h-4" /> Optional Metacognitive Calibration
              </span>
              <span className="text-[11px] text-neutral-400">
                {confidence !== null ? `Confidence: ${confidence}/5` : "(Click to rate or submit directly)"}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleSelectConfidence(lvl)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    confidence === lvl
                      ? "bg-purple-500 border-purple-400 text-neutral-950 shadow-md font-black"
                      : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Practice Mode Socratic Inline Conceptual Explanation */}
        {!isMockMode && showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl border bg-neutral-950/90 border-neutral-800 space-y-3.5 shadow-xl mt-1"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-850 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Socratic Conceptual Explanation
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAnalyzeMistake}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  <span>{isAnalyzing ? "Analyzing..." : "Analyze My Mistake"}</span>
                </button>

                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                  isCorrectResult
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}>
                  {isCorrectResult ? "Correct (+1.0)" : "Incorrect (-0.33)"}
                </span>
              </div>
            </div>

            {/* Explanation Content */}
            <div className="text-xs md:text-sm text-neutral-200 leading-relaxed font-sans space-y-2">
              <p className="whitespace-pre-line font-medium text-neutral-200">
                {currentQuestion.explanation || "First-principles socratic analysis based on standard syllabus materials."}
              </p>
            </div>

            {/* Conceptual Error Breakdown Result Box */}
            {errorAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-2xl space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between text-amber-400 font-black uppercase tracking-wider gap-2">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Cognitive Error Diagnosis: {errorAnalysis.error_category}
                  </span>
                  {errorAnalysis.misconception_tag && (
                    <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-black rounded-lg">
                      Option Tracing: {errorAnalysis.misconception_tag}
                    </span>
                  )}
                </div>
                <div className="text-neutral-300 leading-relaxed">
                  <strong className="text-white">Identified Gap: </strong> {errorAnalysis.identified_gap}
                </div>
                <div className="text-amber-300/90 font-mono text-[11px] leading-relaxed pt-1.5 border-t border-amber-500/20">
                  <strong className="text-amber-400">Actionable Remediation: </strong> {errorAnalysis.recommendation}
                </div>
              </motion.div>
            )}

            {/* Grounded Citation Footer */}
            <div className="p-3 bg-neutral-900 border border-neutral-850 rounded-xl flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Standard Reference Context:</span>
              </div>
              <span className="text-amber-400 font-bold font-mono">
                {(currentQuestion.metadata as any)?.book_reference || "M. Laxmikanth / NCERT Standard Vault"}
              </span>
            </div>
          </motion.div>
        )}

        {/* Navigation & Frictionless Submission Controls */}
        <div className="pt-3 border-t border-neutral-850 flex items-center justify-between">
          {isMockMode ? (
            <div className="flex items-center justify-between w-full gap-3">
              <button
                type="button"
                disabled={activeQuestionIndex === 0}
                onClick={() => {
                  if (currentQuestion) recordQuestionTime(currentQuestion.id, itemTimeSeconds);
                  setActiveQuestionIndex(activeQuestionIndex - 1);
                }}
                className={`py-3 px-4 sm:px-5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeQuestionIndex > 0
                    ? "bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200"
                    : "bg-neutral-950 border border-neutral-900 text-neutral-600 cursor-not-allowed"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <span className="text-xs font-mono text-neutral-300 font-bold">
                Item {activeQuestionIndex + 1} of {mockQuestions.length}
              </span>

              <button
                type="button"
                disabled={activeQuestionIndex === mockQuestions.length - 1}
                onClick={() => {
                  if (currentQuestion) recordQuestionTime(currentQuestion.id, itemTimeSeconds);
                  setActiveQuestionIndex(activeQuestionIndex + 1);
                }}
                className={`py-3 px-4 sm:px-5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeQuestionIndex < mockQuestions.length - 1
                    ? "bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black shadow-lg"
                    : "bg-neutral-950 border border-neutral-900 text-neutral-600 cursor-not-allowed"
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {!showFeedback ? (
                <button
                  type="button"
                  disabled={!isReadyToSubmit}
                  onClick={handleExecuteSubmit}
                  className={`w-full py-3.5 sm:py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                    isReadyToSubmit
                      ? "bg-amber-600 hover:bg-amber-500 text-neutral-950"
                      : "bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed"
                  }`}
                  style={isReadyToSubmit ? { boxShadow: "0 0 25px rgba(217,119,6,0.3)" } : {}}
                >
                  <span>Submit Response</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNext}
                  className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  style={{ boxShadow: "0 0 25px rgba(217,119,6,0.3)" }}
                >
                  <span>Next Adaptive Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuestionCard;
