import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export interface IRTMetadata {
  difficulty: number; // difficulty level (1-5 or theta parameter)
  discrimination?: number;
  guessing?: number;
  subject?: string;
  year?: number;
  paper?: string;
  source?: string;
}

export interface Question {
  id: string;
  text: string;
  options: Record<string, string>; // {"A": "Option text...", "B": "..."}
  correct_answer?: string;
  explanation?: string;
  metadata?: IRTMetadata;
  subtopic_id?: string;
  topic_id?: string;
}

export type ThemeMode = "UPSC" | "CDS";
export type TestMode = "practice" | "mock";

export interface UserMockAnswer {
  questionId: string;
  selectedOption: string | null;
  confidence: number | null;
  markedForReview: boolean;
}

interface ArenaState {
  // Test Mode
  testMode: TestMode;
  setTestMode: (mode: TestMode) => void;

  // Active question
  currentQuestion: Question | null;
  sessionScore: number;
  timer: number;
  mockTimerLeft: number; // Global countdown timer for Full Mock mode
  isTransitioning: boolean;
  mode: ThemeMode;
  selectedOption: string | null;
  confidence: number | null;
  averageTopicTime: number; // in seconds
  masteryPercentage: number;
  thetaDelta: number;
  
  // Feedback states for Practice Mode
  showFeedback: boolean;
  feedbackExplanation: string | null;
  isCorrectResult: boolean | null;

  // Mock Test Mode State & OMR Grid
  mockQuestions: Question[];
  activeQuestionIndex: number;
  userAnswers: Record<number, UserMockAnswer>;
  isMockSubmitted: boolean;
  
  // Actions
  setQuestion: (question: Question | null) => void;
  setMode: (mode: ThemeMode) => void;
  setTransitioning: (isTransitioning: boolean) => void;
  incrementScore: (by: number) => void;
  tickTimer: () => void;
  resetTimer: () => void;
  setMockTimerLeft: (seconds: number) => void;
  tickMockTimerLeft: () => void;
  setSelectedOption: (option: string | null) => void;
  setConfidence: (confidence: number | null) => void;
  setAverageTopicTime: (seconds: number) => void;
  setMasteryMetrics: (masteryPercentage: number, thetaDelta: number) => void;
  setFeedback: (show: boolean, isCorrect: boolean | null, explanation: string | null) => void;
  resetSession: () => void;

  // Mock Test Actions
  setMockQuestions: (questions: Question[]) => void;
  setActiveQuestionIndex: (index: number) => void;
  recordMockAnswer: (index: number, option: string | null, confidence: number | null) => void;
  toggleMarkForReview: (index: number) => void;
  submitMockTest: () => void;
  resetMockTest: () => void;
}

export const useArenaStore = create<ArenaState>()(
  persist(
    (set) => ({
      testMode: "practice",
      setTestMode: (testMode) => set({ testMode }),

      currentQuestion: null,
      sessionScore: 0,
      timer: 0,
      mockTimerLeft: 1800,
      isTransitioning: false,
      mode: "UPSC",
      selectedOption: null,
      confidence: null,
      averageTopicTime: 60,
      masteryPercentage: 50.0,
      thetaDelta: 0.0,
      
      showFeedback: false,
      feedbackExplanation: null,
      isCorrectResult: null,

      mockQuestions: [],
      activeQuestionIndex: 0,
      userAnswers: {},
      isMockSubmitted: false,

      setQuestion: (question) => set({ 
        currentQuestion: question, 
        selectedOption: null, 
        confidence: null,
        showFeedback: false,
        feedbackExplanation: null,
        isCorrectResult: null,
        timer: 0
      }),

      setMode: (mode) => {
        set({ mode });
        // Sync with useAuthStore
        useAuthStore.getState().setExamMode(mode);
      },

      setTransitioning: (isTransitioning) => set({ isTransitioning }),
      incrementScore: (by) => set((state) => ({ sessionScore: state.sessionScore + by })),
      tickTimer: () => set((state) => ({ timer: state.timer + 1 })),
      resetTimer: () => set({ timer: 0 }),
      setMockTimerLeft: (mockTimerLeft) => set({ mockTimerLeft }),
      tickMockTimerLeft: () => set((state) => ({ 
        mockTimerLeft: Math.max(0, state.mockTimerLeft - 1) 
      })),
      setSelectedOption: (selectedOption) => set({ selectedOption }),
      setConfidence: (confidence) => set({ confidence }),
      setAverageTopicTime: (averageTopicTime) => set({ averageTopicTime }),
      setMasteryMetrics: (masteryPercentage, thetaDelta) => set({ masteryPercentage, thetaDelta }),
      setFeedback: (showFeedback, isCorrectResult, feedbackExplanation) => set({ showFeedback, isCorrectResult, feedbackExplanation }),
      
      resetSession: () => set({
        currentQuestion: null,
        sessionScore: 0,
        timer: 0,
        isTransitioning: false,
        selectedOption: null,
        confidence: null,
        masteryPercentage: 50.0,
        thetaDelta: 0.0,
        showFeedback: false,
        feedbackExplanation: null,
        isCorrectResult: null
      }),

      setMockQuestions: (mockQuestions) => {
        const initialAnswers: Record<number, UserMockAnswer> = {};
        mockQuestions.forEach((q, idx) => {
          initialAnswers[idx] = {
            questionId: q.id,
            selectedOption: null,
            confidence: null,
            markedForReview: false
          };
        });
        const calculatedSeconds = Math.max(300, Math.round(mockQuestions.length * 72));
        set({
          mockQuestions,
          activeQuestionIndex: 0,
          userAnswers: initialAnswers,
          isMockSubmitted: false,
          currentQuestion: mockQuestions[0] || null,
          mockTimerLeft: calculatedSeconds
        });
      },

      setActiveQuestionIndex: (activeQuestionIndex) => set((state) => ({
        activeQuestionIndex,
        currentQuestion: state.mockQuestions[activeQuestionIndex] || null,
        selectedOption: state.userAnswers[activeQuestionIndex]?.selectedOption || null,
        confidence: state.userAnswers[activeQuestionIndex]?.confidence || null
      })),

      recordMockAnswer: (index, option, confidence) => set((state) => {
        const currentAns = state.userAnswers[index] || {
          questionId: state.mockQuestions[index]?.id || `q-${index}`,
          selectedOption: null,
          confidence: null,
          markedForReview: false
        };
        const updated = {
          ...state.userAnswers,
          [index]: {
            ...currentAns,
            selectedOption: option !== null ? option : currentAns.selectedOption,
            confidence: confidence !== null ? confidence : currentAns.confidence
          }
        };
        return {
          userAnswers: updated,
          selectedOption: option !== null ? option : currentAns.selectedOption,
          confidence: confidence !== null ? confidence : currentAns.confidence
        };
      }),

      toggleMarkForReview: (index) => set((state) => {
        const currentAns = state.userAnswers[index] || {
          questionId: state.mockQuestions[index]?.id || `q-${index}`,
          selectedOption: null,
          confidence: null,
          markedForReview: false
        };
        return {
          userAnswers: {
            ...state.userAnswers,
            [index]: {
              ...currentAns,
              markedForReview: !currentAns.markedForReview
            }
          }
        };
      }),

      submitMockTest: () => set({ isMockSubmitted: true }),

      resetMockTest: () => set((state) => {
        const resetAnswers: Record<number, UserMockAnswer> = {};
        state.mockQuestions.forEach((q, idx) => {
          resetAnswers[idx] = {
            questionId: q.id,
            selectedOption: null,
            confidence: null,
            markedForReview: false
          };
        });
        const calculatedSeconds = Math.max(300, Math.round(state.mockQuestions.length * 72));
        return {
          activeQuestionIndex: 0,
          userAnswers: resetAnswers,
          isMockSubmitted: false,
          currentQuestion: state.mockQuestions[0] || null,
          selectedOption: null,
          confidence: null,
          timer: 0,
          mockTimerLeft: calculatedSeconds
        };
      })
    }),
    {
      name: "officers-arena-storage",
      partialize: (state) => ({
        mode: state.mode,
        testMode: state.testMode,
        sessionScore: state.sessionScore,
        masteryPercentage: state.masteryPercentage,
        thetaDelta: state.thetaDelta
      })
    }
  )
);
