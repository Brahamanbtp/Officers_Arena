import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export interface IRTMetadata {
  difficulty: number; // difficulty level (1-5 or theta parameter)
  discrimination?: number;
  guessing?: number;
  subject?: string;
  year?: number;
  session?: string;
  paper?: string;
  source?: string;
  exam_type?: string;
  book_reference?: string;
}

export interface QuestionImage {
  id: string;
  url: string;
  file_path?: string;
  description?: string;
}

export interface Question {
  id: string;
  text: string;
  options: Record<string, string>; // {"A": "Option text...", "B": "..."}
  correct_answer?: string;
  explanation?: string;
  images?: QuestionImage[];
  metadata?: IRTMetadata;
  subtopic_id?: string;
  topic_id?: string;
}

export type ThemeMode = "UPSC" | "CDS";
export type TestMode = "practice" | "mock";

export interface ExamRule {
  name: string;
  positiveMarks: number;
  negativeMarks: number;
  defaultQuestions: number;
  defaultDurationSeconds: number;
  passingCutoff: number;
  markingSummary: string;
}

export const EXAM_RULES: Record<ThemeMode, ExamRule> = {
  UPSC: {
    name: "UPSC Civil Services Prelims (GS-1)",
    positiveMarks: 2.0,
    negativeMarks: 0.66,
    defaultQuestions: 100,
    defaultDurationSeconds: 7200,
    passingCutoff: 96.0,
    markingSummary: "+2.0 / -0.66 per question"
  },
  CDS: {
    name: "Combined Defence Services (CDS)",
    positiveMarks: 0.833,
    negativeMarks: 0.277,
    defaultQuestions: 120,
    defaultDurationSeconds: 7200,
    passingCutoff: 105.0,
    markingSummary: "+0.83 / -0.27 per question"
  }
};

export interface UserMockAnswer {
  questionId: string;
  selectedOption: string | null;
  confidence: number | null;
  markedForReview: boolean;
  timeSpentSeconds?: number;
}

interface ArenaState {
  // Test Mode
  testMode: TestMode;
  setTestMode: (mode: TestMode) => void;

  // Metacognitive Calibration Setting (Optional toggle)
  enableConfidenceRating: boolean;
  setEnableConfidenceRating: (enabled: boolean) => void;

  // Active question
  currentQuestion: Question | null;
  sessionScore: number;
  timer: number;
  mockTimerLeft: number; // Global countdown timer for Full Mock mode
  mockExamEndTime: number | null; // Wall-clock timestamp to avoid background tab throttling
  isTransitioning: boolean;
  mode: ThemeMode;
  selectedOption: string | null;
  confidence: number | null;
  averageTopicTime: number; // in seconds
  masteryPercentage: number;
  thetaDelta: number;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
  
  // Feedback states for Practice Mode
  showFeedback: boolean;
  feedbackExplanation: string | null;
  isCorrectResult: boolean | null;

  // Item-level Response Time Chronometrics
  questionTimes: Record<string, number>;
  recordQuestionTime: (questionId: string, seconds: number) => void;
  averageResponseTime: number;

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
  recordMockAnswer: (index: number, option: string | null, confidence: number | null, timeSpent?: number) => void;
  toggleMarkForReview: (index: number) => void;
  submitMockTest: () => void;
  resetMockTest: () => void;
}

export const useArenaStore = create<ArenaState>()(
  persist(
    (set) => ({
      testMode: "practice",
      setTestMode: (testMode) => set({ testMode }),

      enableConfidenceRating: false, // Default to FALSE for frictionless fast answering
      setEnableConfidenceRating: (enableConfidenceRating) => set({ enableConfidenceRating }),

      currentQuestion: null,
      sessionScore: 0,
      timer: 0,
      mockTimerLeft: 1800,
      isTransitioning: false,
      mode: "UPSC",
      selectedOption: null,
      confidence: null,
      averageTopicTime: 48,
      masteryPercentage: 50.0,
      thetaDelta: 0.0,
      selectedSubject: "All",
      setSelectedSubject: (selectedSubject) => set({ selectedSubject }),
      
      showFeedback: false,
      feedbackExplanation: null,
      isCorrectResult: null,

      questionTimes: {},
      averageResponseTime: 48,
      recordQuestionTime: (questionId, seconds) => set((state) => {
        const updated = { ...state.questionTimes, [questionId]: seconds };
        const vals = Object.values(updated);
        const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 48;
        return { questionTimes: updated, averageResponseTime: avg };
      }),

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
      mockExamEndTime: null as number | null,
      setMockTimerLeft: (mockTimerLeft) => set({ 
        mockTimerLeft, 
        mockExamEndTime: Date.now() + mockTimerLeft * 1000 
      }),
      tickMockTimerLeft: () => set((state) => {
        if (state.mockExamEndTime) {
          const remaining = Math.max(0, Math.floor((state.mockExamEndTime - Date.now()) / 1000));
          return { mockTimerLeft: remaining };
        }
        return { mockTimerLeft: Math.max(0, state.mockTimerLeft - 1) };
      }),
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
        isCorrectResult: null,
        questionTimes: {}
      }),

      setMockQuestions: (mockQuestions) => {
        const initialAnswers: Record<number, UserMockAnswer> = {};
        mockQuestions.forEach((q, idx) => {
          initialAnswers[idx] = {
            questionId: q.id,
            selectedOption: null,
            confidence: null,
            markedForReview: false,
            timeSpentSeconds: 0
          };
        });
        const calculatedSeconds = Math.max(300, Math.round(mockQuestions.length * 72));
        set({
          mockQuestions,
          activeQuestionIndex: 0,
          userAnswers: initialAnswers,
          isMockSubmitted: false,
          currentQuestion: mockQuestions[0] || null,
          mockTimerLeft: calculatedSeconds,
          mockExamEndTime: Date.now() + calculatedSeconds * 1000,
          questionTimes: {}
        });
      },

      setActiveQuestionIndex: (activeQuestionIndex) => set((state) => {
        const targetQ = state.mockQuestions[activeQuestionIndex] || null;
        const targetAns = state.userAnswers[activeQuestionIndex];
        const hasAnswered = targetAns?.selectedOption !== null && targetAns?.selectedOption !== undefined;
        return {
          activeQuestionIndex,
          currentQuestion: targetQ,
          selectedOption: targetAns?.selectedOption || null,
          confidence: targetAns?.confidence || null,
          showFeedback: state.testMode === "practice" && hasAnswered,
          feedbackExplanation: state.testMode === "practice" && hasAnswered ? (targetQ?.explanation || null) : null,
          isCorrectResult: state.testMode === "practice" && hasAnswered ? (targetAns?.selectedOption === targetQ?.correct_answer) : null,
          timer: 0
        };
      }),

      recordMockAnswer: (index, option, confidence, timeSpent = 0) => set((state) => {
        const currentAns = state.userAnswers[index] || {
          questionId: state.mockQuestions[index]?.id || `q-${index}`,
          selectedOption: null,
          confidence: null,
          markedForReview: false,
          timeSpentSeconds: 0
        };
        const updated = {
          ...state.userAnswers,
          [index]: {
            ...currentAns,
            selectedOption: option !== null ? option : currentAns.selectedOption,
            confidence: confidence !== null ? confidence : currentAns.confidence,
            timeSpentSeconds: timeSpent > 0 ? timeSpent : currentAns.timeSpentSeconds
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
          markedForReview: false,
          timeSpentSeconds: 0
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

      submitMockTest: async () => {
        set({ isMockSubmitted: true });
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const userId = useAuthStore.getState().user?.id || (typeof window !== "undefined" ? localStorage.getItem("oa_guest_id") : null) || "guest_student";
        const state = useArenaStore.getState();

        const answersList = Object.values(state.userAnswers).map((ans) => ({
          question_id: ans.questionId,
          selected_option: ans.selectedOption,
          confidence_level: ans.confidence || 3,
          response_time: ans.timeSpentSeconds || 45.0
        }));

        const totalCalculatedTime = Object.values(state.userAnswers).reduce(
          (acc, ans) => acc + (ans.timeSpentSeconds || 0),
          0
        );

        try {
          const res = await fetch(`${apiEndpoint}/api/v1/arena/submit-batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              exam_type: state.mode,
              paper_name: `${state.mode} Full Mock Test`,
              answers: answersList,
              total_time_seconds: totalCalculatedTime > 0 ? totalCalculatedTime : 60.0
            })
          });
          if (res.ok) {
            const data = await res.json();
            set({
              masteryPercentage: data.mastery_percentage,
              thetaDelta: data.theta_delta
            });
          }
        } catch (err) {
          console.warn("Failed to persist mock test batch submission:", err);
        }
      },

      resetMockTest: () => set((state) => {
        const resetAnswers: Record<number, UserMockAnswer> = {};
        state.mockQuestions.forEach((q, idx) => {
          resetAnswers[idx] = {
            questionId: q.id,
            selectedOption: null,
            confidence: null,
            markedForReview: false,
            timeSpentSeconds: 0
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
          mockTimerLeft: calculatedSeconds,
          mockExamEndTime: Date.now() + calculatedSeconds * 1000,
          questionTimes: {}
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
        thetaDelta: state.thetaDelta,
        enableConfidenceRating: state.enableConfidenceRating,
        mockQuestions: state.mockQuestions,
        userAnswers: state.userAnswers,
        activeQuestionIndex: state.activeQuestionIndex,
        mockTimerLeft: state.mockTimerLeft,
        isMockSubmitted: state.isMockSubmitted,
        questionTimes: state.questionTimes
      })
    }
  )
);
