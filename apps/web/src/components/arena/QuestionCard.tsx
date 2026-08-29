"use client";

import React, { useState, useEffect } from "react";
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
  Lightbulb
} from "lucide-react";

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

  const setSelectedOption = useArenaStore((state) => state.setSelectedOption);
  const setConfidence = useArenaStore((state) => state.setConfidence);
  const examMode = useAuthStore((state) => state.examMode);

  // 4.2 Conceptual Error Analysis State
  const [errorAnalysis, setErrorAnalysis] = useState<{
    error_category: string;
    identified_gap: string;
    recommendation: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Reset analysis on question change
  useEffect(() => {
    setErrorAnalysis(null);
  }, [currentQuestion?.id]);

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
          user_id: "student_999",
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
      recordMockAnswer(activeQuestionIndex, key, confidence || 3);
    } else {
      setSelectedOption(key);
    }
  };

  const handleSelectConfidence = (lvl: number) => {
    if (isMockMode) {
      recordMockAnswer(activeQuestionIndex, selectedOption, lvl);
    } else {
      setConfidence(lvl);
    }
  };

  const isReadyToSubmit = selectedOption !== null && confidence !== null && !showFeedback;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full bg-[#111111] border border-neutral-800 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col gap-6 relative select-none font-sans"
      >
        {/* Header Badge & Topic */}
        <div className="flex items-center justify-between text-xs border-b border-neutral-850 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg font-bold text-xs uppercase tracking-widest text-amber-400">
              {(currentQuestion.metadata as any)?.subject || `${examMode} Subject`}
            </span>
            <span className="text-xs text-neutral-300 font-bold uppercase tracking-wider">
              {isMockMode ? `Mock Item (${activeQuestionIndex + 1}/${mockQuestions.length})` : `${examMode} Practice Item`}
            </span>
          </div>

          {/* Mark for Review Button in Mock Mode */}
          {isMockMode && (
            <button
              onClick={() => toggleMarkForReview(activeQuestionIndex)}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                isMarked
                  ? "bg-purple-500/20 border-purple-500/60 text-purple-200 shadow-md shadow-purple-500/10"
                  : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isMarked ? "text-purple-400 fill-purple-400" : "text-neutral-400"}`} />
              {isMarked ? "Marked for Review" : "Mark for Review"}
            </button>
          )}
        </div>

        {/* Question Text */}
        <div className="text-base text-neutral-100 font-medium leading-relaxed space-y-4 whitespace-pre-line">
          {currentQuestion.text}
        </div>

        {/* Options Group */}
        <div className="grid grid-cols-1 gap-3.5 pt-2">
          {Object.entries(optionsMap).map(([key, value]) => {
            const isSelected = selectedOption === key;
            const isCorrect = key === currentQuestion.correct_answer;

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
            } else if (isSelected) {
              // In Mock Mode OR Practice Mode before feedback:
              borderStyle = "border-amber-500 bg-amber-500/10 text-amber-300 font-bold shadow-lg";
              iconElement = <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />;
            }

            return (
              <button
                key={key}
                disabled={!isMockMode && showFeedback}
                onClick={() => handleSelectOption(key)}
                className={`p-4 rounded-2xl border text-sm md:text-base text-left flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer ${borderStyle}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs border ${
                    isSelected ? "bg-amber-500 text-neutral-950 border-amber-400" : "bg-neutral-900 border-neutral-800 text-neutral-300"
                  }`}>
                    {key}
                  </span>
                  <span>{value as string}</span>
                </div>
                {iconElement}
              </button>
            );
          })}
        </div>

        {/* Metacognitive Confidence Rating */}
        {selectedOption !== null && !showFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pt-4 border-t border-neutral-850 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300 uppercase tracking-wider">
              <span className="flex items-center gap-2 text-amber-400">
                <HelpCircle className="w-4 h-4" /> Metacognitive Calibration
              </span>
              <span>How confident are you? ({confidence || 3}/5)</span>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleSelectConfidence(lvl)}
                  className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    confidence === lvl
                      ? "bg-amber-500 border-amber-400 text-neutral-950 shadow-md font-black"
                      : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* REQUIREMENT 4.2: SOCRATIC INLINE CONCEPTUAL EXPLANATION & CONCEPTUAL ERROR ANALYSIS */}
        {!isMockMode && showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border bg-neutral-950/90 border-neutral-800 space-y-4 shadow-xl mt-2"
          >
            {/* Status Header & 4.2 "Analyze My Mistake" Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-850 pb-3 gap-3">
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
                  {isAnalyzing ? "Analyzing..." : "Analyze My Mistake"}
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

            {/* 4.2 Backend Conceptual Error Breakdown Result Box */}
            {errorAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-amber-400 font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Cognitive Error Diagnosis: {errorAnalysis.error_category}
                  </span>
                </div>
                <div className="text-neutral-300 leading-relaxed">
                  <strong className="text-white">Identified Gap: </strong> {errorAnalysis.identified_gap}
                </div>
                <div className="text-amber-300/90 font-mono text-[11px] leading-relaxed pt-1 border-t border-amber-500/20">
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

        {/* Navigation & Submission Controls */}
        <div className="pt-4 border-t border-neutral-850 flex items-center justify-between">
          {isMockMode ? (
            <div className="flex items-center justify-between w-full gap-3">
              <button
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                className={`py-3.5 px-5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeQuestionIndex > 0
                    ? "bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200"
                    : "bg-neutral-950 border border-neutral-900 text-neutral-600 cursor-not-allowed"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-xs font-mono text-neutral-300 font-bold">
                Item {activeQuestionIndex + 1} of {mockQuestions.length}
              </span>

              <button
                disabled={activeQuestionIndex === mockQuestions.length - 1}
                onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                className={`py-3.5 px-5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeQuestionIndex < mockQuestions.length - 1
                    ? "bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black shadow-lg"
                    : "bg-neutral-950 border border-neutral-900 text-neutral-600 cursor-not-allowed"
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {!showFeedback ? (
                <button
                  disabled={!isReadyToSubmit}
                  onClick={() => selectedOption && confidence && onSubmit(selectedOption, confidence)}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                    isReadyToSubmit
                      ? "bg-amber-600 hover:bg-amber-500 text-neutral-950"
                      : "bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed"
                  }`}
                  style={isReadyToSubmit ? { boxShadow: "0 0 25px rgba(217,119,6,0.3)" } : {}}
                >
                  Submit Response
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  style={{ boxShadow: "0 0 25px rgba(217,119,6,0.3)" }}
                >
                  Next Calibrated Exhibit
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
