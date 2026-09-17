"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAdaptiveTest } from "@/src/hooks/useAdaptiveTest";
import { useArenaStore } from "@/src/store/useArenaStore";
import { ArenaLayout } from "@/src/components/arena/ArenaLayout";
import { QuestionCard } from "@/src/components/arena/QuestionCard";
import { QuestionPalette } from "@/src/components/arena/QuestionPalette";
import { CommandDiagnosticReport } from "@/src/components/arena/CommandDiagnosticReport";
import { MasteryMap } from "@/src/components/arena/MasteryMap";
import { TestConfiguratorModal } from "@/src/components/arena/TestConfiguratorModal";
import { OmrSheet } from "@/src/components/arena/OmrSheet";
import { Clock, Sliders, Sparkles, PenTool, LayoutTemplate } from "lucide-react";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { AppFooter } from "@/src/components/shared/AppFooter";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";
import { generateQuestionBank } from "@/src/utils/mockQuestionBank";

function ArenaContent() {
  const searchParams = useSearchParams();
  const { currentQuestion, submitResponse, loadNextQuestion } = useAdaptiveTest();
  const selectedOption = useArenaStore((state) => state.selectedOption);
  const confidence = useArenaStore((state) => state.confidence);
  const timer = useArenaStore((state) => state.timer);
  const mode = useArenaStore((state) => state.mode);
  const setMode = useArenaStore((state) => state.setMode);

  // Test Mode State: "practice" | "mock"
  const testMode = useArenaStore((state) => state.testMode);
  const setTestMode = useArenaStore((state) => state.setTestMode);
  const mockQuestions = useArenaStore((state) => state.mockQuestions);
  const setMockQuestions = useArenaStore((state) => state.setMockQuestions);
  const setQuestion = useArenaStore((state) => state.setQuestion);
  const setMockTimerLeft = useArenaStore((state) => state.setMockTimerLeft);
  const setSelectedSubject = useArenaStore((state) => state.setSelectedSubject);
  const activeQuestionIndex = useArenaStore((state) => state.activeQuestionIndex);
  const setActiveQuestionIndex = useArenaStore((state) => state.setActiveQuestionIndex);
  const userAnswers = useArenaStore((state) => state.userAnswers);
  const recordMockAnswer = useArenaStore((state) => state.recordMockAnswer);
  const isMockSubmitted = useArenaStore((state) => state.isMockSubmitted);
  const submitMockTest = useArenaStore((state) => state.submitMockTest);

  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "omr">("card");

  // Handle URL Auto-Start parameters (from Strategist, Library, or Growth launches)
  useEffect(() => {
    const autoStart = searchParams.get("autoStart");
    if (autoStart === "true") {
      const paramMode = searchParams.get("exam_type") as "UPSC" | "CDS" | null;
      const paramSubject = searchParams.get("subject") || "All";
      const paramTopic = searchParams.get("topic");
      const paramCount = parseInt(searchParams.get("count") || "25", 10);
      const paramTestMode = (searchParams.get("mode") as "practice" | "mock") || "practice";
      const paramYear = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
      const paramSession = searchParams.get("session") || undefined;

      if (paramMode) setMode(paramMode);
      setTestMode(paramTestMode);
      setSelectedSubject(paramSubject);

      const targetExam = paramMode || mode;
      const questions = generateQuestionBank(targetExam, paramSubject, paramCount, paramYear, paramTopic || undefined, paramSession || undefined);
      
      if (paramTestMode === "mock") {
        setMockQuestions(questions);
        setMockTimerLeft(Math.max(300, Math.round(questions.length * 72)));
      } else {
        setMockQuestions(questions);
        setQuestion(questions[0] || null);
      }
      setIsConfiguratorOpen(false);
      return;
    }

    const isTestActive = Boolean(currentQuestion || mockQuestions.length > 0);
    if (!isTestActive) {
      setIsConfiguratorOpen(true);
    }
  }, [searchParams]);

  const handleSubmitPractice = (opt?: string, conf?: number) => {
    const chosenOption = opt || selectedOption;
    const chosenConfidence = conf !== undefined ? conf : (confidence !== null ? confidence : 3);
    if (chosenOption) {
      submitResponse(chosenOption, chosenConfidence, timer);
    }
  };

  const handleNextPractice = () => {
    loadNextQuestion();
  };

  const isMock = testMode === "mock";

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0b0b0b] text-neutral-100">
      <GuestWarningBanner />
      <AppHeader />

      <main className="flex-grow max-w-6xl w-full mx-auto p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-6">

          {/* Clean Sub-Bar: Backup Configure Setup Action & OMR View Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-neutral-800 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                The Adaptive Arena
              </h2>
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider hidden sm:inline-block">
                Mode: {isMock ? "Full Mock Session" : "Adaptive Practice"}
              </span>
            </div>

            {/* View Mode Toggle (Card vs Physical OMR Sheet) in Mock Mode */}
            <div className="flex items-center gap-3">
              {isMock && (
                <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === "card"
                        ? "bg-amber-500 text-neutral-950 shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    Card View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("omr")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === "omr"
                        ? "bg-amber-500 text-neutral-950 shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Physical OMR
                  </button>
                </div>
              )}

              <div className="text-xs font-bold text-neutral-300 font-mono hidden md:block">
                {isMock ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Penalty: {mode === "UPSC" ? "+2.0 / -0.66" : "+0.83 / -0.27"}
                  </span>
                ) : (
                  <span>Adaptive IRT Engine</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsConfiguratorOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-neutral-950" />
                Setup
              </button>
            </div>
          </div>

          {/* MOCK TEST MODE SUBMITTED STATE: Show Command Diagnostic Report */}
          {isMock && isMockSubmitted ? (
            <CommandDiagnosticReport />
          ) : (
            /* ACTIVE TEST ARENA */
            <ArenaLayout
              progressPercent={isMock ? ((activeQuestionIndex + 1) / Math.max(1, mockQuestions.length)) * 100 : 50}
              questionIndex={isMock ? activeQuestionIndex + 1 : 1}
              totalQuestions={isMock ? mockQuestions.length : 10}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
              {/* Left Column: Question Card or Full Physical OMR Sheet */}
              <div className="flex flex-col gap-6 lg:col-span-2 w-full">
                {viewMode === "omr" && isMock ? (
                  <OmrSheet
                    totalQuestions={mockQuestions.length}
                    currentQuestionIndex={activeQuestionIndex}
                    selectedAnswers={Object.fromEntries(
                      Object.entries(userAnswers).map(([k, v]) => [Number(k), v?.selectedOption || ""])
                    )}
                    markedForReview={Object.fromEntries(
                      Object.entries(userAnswers).map(([k, v]) => [Number(k), Boolean(v?.markedForReview)])
                    )}
                    onSelectBubble={(qIdx, optKey) => {
                      recordMockAnswer(qIdx, optKey, null, 1);
                    }}
                    onNavigateQuestion={(qIdx) => {
                      setActiveQuestionIndex(qIdx);
                    }}
                    isMockMode={isMock}
                  />
                ) : (
                  <QuestionCard
                    onSubmit={handleSubmitPractice}
                    onNext={handleNextPractice}
                  />
                )}
              </div>

                {/* Right Column: OMR Grid in Mock Mode or Mastery Map in Practice Mode */}
                <div className="flex flex-col gap-6 lg:col-span-1 lg:sticky lg:top-24">
                  {isMock ? (
                    <QuestionPalette onSubmitTest={submitMockTest} />
                  ) : (
                    <MasteryMap />
                  )}
                </div>

              </div>
            </ArenaLayout>
          )}

        </div>
      </main>

      {/* Pre-Test Mission Briefing Configurator Modal */}
      <TestConfiguratorModal
        isOpen={isConfiguratorOpen}
        onClose={() => setIsConfiguratorOpen(false)}
      />

      <AppFooter />
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-white">Loading Arena...</div>}>
      <ArenaContent />
    </Suspense>
  );
}
