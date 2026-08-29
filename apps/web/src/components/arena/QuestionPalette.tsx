"use client";

import React, { memo } from "react";
import { useArenaStore } from "../../store/useArenaStore";
import { CheckCircle2, Bookmark, Circle, Send, RefreshCw } from "lucide-react";

interface QuestionPaletteProps {
  onSubmitTest: () => void;
}

const PaletteButton = memo(({
  idx,
  isActive,
  isAttempted,
  isMarked,
  onSelect
}: {
  idx: number;
  isActive: boolean;
  isAttempted: boolean;
  isMarked: boolean;
  onSelect: (index: number) => void;
}) => {
  let btnStyles = "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700";
  if (isMarked) {
    btnStyles = "bg-purple-500/20 text-purple-200 border-purple-500/60 font-black shadow-purple-500/10";
  } else if (isAttempted) {
    btnStyles = "bg-emerald-500/20 text-emerald-200 border-emerald-500/60 font-black shadow-emerald-500/10";
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(idx)}
      className={`h-11 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center relative cursor-pointer ${btnStyles} ${
        isActive ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-neutral-950 scale-105" : ""
      }`}
    >
      {idx + 1}
      {isMarked && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-neutral-950" />
      )}
    </button>
  );
});

PaletteButton.displayName = "PaletteButton";

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({ onSubmitTest }) => {
  const mockQuestions = useArenaStore((state) => state.mockQuestions);
  const activeQuestionIndex = useArenaStore((state) => state.activeQuestionIndex);
  const userAnswers = useArenaStore((state) => state.userAnswers);
  const setActiveQuestionIndex = useArenaStore((state) => state.setActiveQuestionIndex);
  const isMockSubmitted = useArenaStore((state) => state.isMockSubmitted);
  const resetMockTest = useArenaStore((state) => state.resetMockTest);

  const total = mockQuestions.length;
  let attemptedCount = 0;
  let markedCount = 0;
  let unattemptedCount = 0;

  mockQuestions.forEach((_, idx) => {
    const ans = userAnswers[idx];
    if (ans?.markedForReview) {
      markedCount++;
    } else if (ans?.selectedOption !== null && ans?.selectedOption !== undefined) {
      attemptedCount++;
    } else {
      unattemptedCount++;
    }
  });

  return (
    <div className="bg-[#111111] border border-neutral-800 p-6 rounded-3xl shadow-2xl flex flex-col gap-5 w-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-100">
          OMR Question Palette ({total} Qs)
        </h3>
        <span className="text-xs font-mono text-amber-400 font-bold">
          {attemptedCount} / {total} Answered
        </span>
      </div>

      {/* Status Legend Badges */}
      <div className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider">
        <div className="flex items-center justify-between gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Attempted</span>
          </div>
          <span className="font-mono text-emerald-400">{attemptedCount}</span>
        </div>

        <div className="flex items-center justify-between gap-2 p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>Marked for Review</span>
          </div>
          <span className="font-mono text-purple-400">{markedCount}</span>
        </div>

        <div className="flex items-center justify-between gap-2 p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300">
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span>Unattempted</span>
          </div>
          <span className="font-mono text-neutral-400">{unattemptedCount}</span>
        </div>
      </div>

      {/* Grid Palette - Managed Scroll Container for 100+ Questions */}
      <div className={`grid grid-cols-5 gap-2.5 ${total > 15 ? "max-h-96 overflow-y-auto pr-1.5 scrollbar-thin" : ""}`}>
        {mockQuestions.map((_, idx) => {
          const ans = userAnswers[idx];
          const isActive = idx === activeQuestionIndex;
          const isAttempted = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
          const isMarked = Boolean(ans?.markedForReview);

          return (
            <PaletteButton
              key={idx}
              idx={idx}
              isActive={isActive}
              isAttempted={isAttempted}
              isMarked={isMarked}
              onSelect={setActiveQuestionIndex}
            />
          );
        })}
      </div>

      {/* Action Buttons */}
      {!isMockSubmitted ? (
        <button
          onClick={onSubmitTest}
          className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
          style={{ boxShadow: "0 0 20px rgba(217, 119, 6, 0.25)" }}
        >
          <Send className="w-4 h-4" />
          Submit Full Test ({total} Items)
        </button>
      ) : (
        <button
          onClick={resetMockTest}
          className="w-full py-4 bg-neutral-800 hover:bg-neutral-750 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          Retake Mock Test
        </button>
      )}
    </div>
  );
};
export default QuestionPalette;
