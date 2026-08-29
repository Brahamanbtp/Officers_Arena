"use client";

import React, { useState, useEffect } from "react";
import { useAdaptiveTest } from "@/src/hooks/useAdaptiveTest";
import { useArenaStore } from "@/src/store/useArenaStore";
import { ArenaLayout } from "@/src/components/arena/ArenaLayout";
import { QuestionCard } from "@/src/components/arena/QuestionCard";
import { QuestionPalette } from "@/src/components/arena/QuestionPalette";
import { CommandDiagnosticReport } from "@/src/components/arena/CommandDiagnosticReport";
import { MasteryMap } from "@/src/components/arena/MasteryMap";
import { TestConfiguratorModal } from "@/src/components/arena/TestConfiguratorModal";
import { Clock, Sliders, Sparkles } from "lucide-react";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";

export default function ArenaPage() {
  const { currentQuestion, submitResponse, loadNextQuestion } = useAdaptiveTest();
  const selectedOption = useArenaStore((state) => state.selectedOption);
  const confidence = useArenaStore((state) => state.confidence);
  const timer = useArenaStore((state) => state.timer);
  const mode = useArenaStore((state) => state.mode);

  // Test Mode State: "practice" | "mock"
  const testMode = useArenaStore((state) => state.testMode);
  const mockQuestions = useArenaStore((state) => state.mockQuestions);
  const activeQuestionIndex = useArenaStore((state) => state.activeQuestionIndex);
  const isMockSubmitted = useArenaStore((state) => state.isMockSubmitted);
  const submitMockTest = useArenaStore((state) => state.submitMockTest);

  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);

  // AUTO-OPEN LOGIC: If no question or mock test is active, pop the Mission Briefing modal immediately
  useEffect(() => {
    const isTestActive = Boolean(currentQuestion || mockQuestions.length > 0);
    if (!isTestActive) {
      setIsConfiguratorOpen(true);
    }
  }, [currentQuestion, mockQuestions.length]);

  const handleSubmitPractice = () => {
    if (selectedOption !== null && confidence !== null) {
      submitResponse(selectedOption, confidence, timer);
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

          {/* Clean Sub-Bar: Backup Configure Setup Action */}
          <div className="flex items-center justify-between gap-4 p-4 bg-[#121212] border border-neutral-800 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                The Adaptive Arena
              </h2>
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider hidden sm:inline-block">
                Mode: {isMock ? "Full Mock Session" : "Adaptive Practice"}
              </span>
            </div>

            {/* ONLY keep the 'Configure Setup' button as backup */}
            <div className="flex items-center gap-3">
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
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-neutral-950" />
                Change Setup
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
                
                {/* Left Column: Question Card */}
                <div className="flex flex-col gap-6 lg:col-span-2 w-full">
                  <QuestionCard
                    onSubmit={handleSubmitPractice}
                    onNext={handleNextPractice}
                  />
                </div>

                {/* Right Column: OMR Grid in Mock Mode or Mastery Map in Practice Mode */}
                <div className="flex flex-col gap-6 lg:col-span-1 lg:sticky lg:top-24">
                  {isMock ? (
                    <QuestionPalette onSubmitTest={submitMockTest} />
                  ) : (
                    <MasteryMap userId="student_999" />
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

      <footer className="border-t border-neutral-800 py-4 text-center text-xs tracking-widest uppercase font-bold text-neutral-400 bg-neutral-900/60">
        Officers Arena &copy; 2026 | ADAPTIVE EXAMINATION ENGINE
      </footer>
    </div>
  );
}
