"use client";

import { useCallback, useEffect } from "react";
import { useArenaStore, Question } from "../store/useArenaStore";

const MOCK_UPSC_QUESTIONS: Question[] = [
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    text: "Under the provisions of Article 356 of the Constitution of India, a Proclamation of President's Rule:\n1. Requires approval by both Houses of Parliament within two months.\n2. Can be extended up to a maximum period of three years with parliamentary approval every six months.\n\nWhich of the statements given above is/are correct?",
    options: {
      "A": "1 only",
      "B": "2 only",
      "C": "Both 1 and 2",
      "D": "Neither 1 nor 2"
    },
    correct_answer: "C",
    explanation: "Under Article 356, President's Rule must be approved by both Houses of Parliament within two months from the date of issue. Upon approval, it remains in force for six months at a time, up to a maximum period of three years.",
    metadata: { difficulty: 0.60, subject: "Indian Polity" }
  },
  {
    id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    text: "With reference to the Indian freedom struggle, consider the following statements regarding the Cabinet Mission Plan (1946):\n1. It recommended a loose confederation with a weak central authority.\n2. It rejected the demand for a full-fledged sovereign Pakistan.\n\nWhich of the statements given above is/are correct?",
    options: {
      "A": "1 only",
      "B": "2 only",
      "C": "Both 1 and 2",
      "D": "Neither 1 nor 2"
    },
    correct_answer: "C",
    explanation: "The Cabinet Mission Plan of 1946 rejected the demand for a sovereign Pakistan and proposed a three-tier grouping of provinces under a weak central government controlling Defense, Foreign Affairs, and Communications.",
    metadata: { difficulty: 0.55, subject: "Modern History" }
  }
];

const MOCK_CDS_QUESTIONS: Question[] = [
  {
    id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    text: "In a right-angled triangle ABC right-angled at B, if AB = 6 cm and BC = 8 cm, what is the radius of the in-circle (inradius r) of the triangle?",
    options: {
      "A": "2 cm",
      "B": "3 cm",
      "C": "4 cm",
      "D": "2.5 cm"
    },
    correct_answer: "A",
    explanation: "In a right-angled triangle with sides a=6, b=8, hypotenuse c = sqrt(6^2 + 8^2) = 10 cm. The inradius r = (a + b - c) / 2 = (6 + 8 - 10) / 2 = 2 cm.",
    metadata: { difficulty: 0.55, subject: "Elementary Mathematics" }
  },
  {
    id: "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
    text: "With reference to the Chief of Defence Staff (CDS) in India, consider the following statements:\n1. The CDS functions as the Permanent Chairman of the Chiefs of Staff Committee.\n2. The CDS exercises direct operational military command over all three service chiefs.\n\nWhich of the statements given above is/are correct?",
    options: {
      "A": "1 only",
      "B": "2 only",
      "C": "Both 1 and 2",
      "D": "Neither 1 nor 2"
    },
    correct_answer: "A",
    explanation: "The CDS functions as the Permanent Chairman of the Chiefs of Staff Committee and Principal Military Adviser to the Raksha Mantri. However, operational command of armed forces remains with the respective Service Chiefs.",
    metadata: { difficulty: 0.60, subject: "Defense Studies" }
  }
];

export const useAdaptiveTest = () => {
  const currentQuestion = useArenaStore((state) => state.currentQuestion);
  const isTransitioning = useArenaStore((state) => state.isTransitioning);
  const timer = useArenaStore((state) => state.timer);
  const mode = useArenaStore((state) => state.mode);
  
  const setQuestion = useArenaStore((state) => state.setQuestion);
  const setTransitioning = useArenaStore((state) => state.setTransitioning);
  const incrementScore = useArenaStore((state) => state.incrementScore);
  const resetTimer = useArenaStore((state) => state.resetTimer);
  const setMasteryMetrics = useArenaStore((state) => state.setMasteryMetrics);
  const setFeedback = useArenaStore((state) => state.setFeedback);

  const getFallbackQuestion = useCallback((examMode: string) => {
    const list = examMode === "CDS" ? MOCK_CDS_QUESTIONS : MOCK_UPSC_QUESTIONS;
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }, []);

  const startTest = useCallback(async () => {
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const response = await fetch(`${apiEndpoint}/api/v1/arena/next-question?user_id=student_999&exam_type=${mode}`);
      if (response.ok) {
        const qData = await response.json();
        setQuestion(qData);
      } else {
        setQuestion(getFallbackQuestion(mode));
      }
    } catch (e) {
      setQuestion(getFallbackQuestion(mode));
    }
    resetTimer();
  }, [setQuestion, resetTimer, mode, getFallbackQuestion]);

  useEffect(() => {
    setQuestion(getFallbackQuestion(mode));
  }, [mode, setQuestion, getFallbackQuestion]);

  const loadNextQuestion = useCallback(async () => {
    setTransitioning(true);
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const nextRes = await fetch(`${apiEndpoint}/api/v1/arena/next-question?user_id=student_999&exam_type=${mode}`);
      if (nextRes.ok) {
        const nextQ = await nextRes.json();
        setQuestion(nextQ);
      } else {
        setQuestion(getFallbackQuestion(mode));
      }
    } catch (e) {
      setQuestion(getFallbackQuestion(mode));
    }
    resetTimer();
    setTransitioning(false);
  }, [mode, setQuestion, setTransitioning, resetTimer, getFallbackQuestion]);

  // Telemetry Submission to FastAPI Backend
  const submitResponse = useCallback(async (
    optionId: string,
    confidence: number,
    timeTaken: number
  ) => {
    if (isTransitioning || !currentQuestion) return;

    setTransitioning(true);
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentQuestion.id);
    const validQuestionId = isUUID ? currentQuestion.id : "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

    try {
      const response = await fetch(`${apiEndpoint}/api/v1/arena/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: "student_999",
          question_id: validQuestionId,
          selected_option: optionId,
          response_time: timeTaken,
          confidence_level: confidence
        })
      });

      let isCorrect = optionId === currentQuestion.correct_answer;
      let explanation = currentQuestion.explanation || "No explanation available.";

      if (response.ok) {
        const submitData = await response.json();
        isCorrect = submitData.is_correct;
        explanation = submitData.explanation || explanation;
        setMasteryMetrics(submitData.mastery_percentage, submitData.theta_delta);
      } else {
        // Fallback local update
        setMasteryMetrics(isCorrect ? 68.5 : 45.2, isCorrect ? 0.08 : -0.04);
      }

      setFeedback(true, isCorrect, explanation);

      if (isCorrect) {
        incrementScore(10);
      }
      setTransitioning(false);

    } catch (error) {
      console.warn("API Error, running local fallback simulation:", error);
      const isCorrect = optionId === currentQuestion.correct_answer;
      if (isCorrect) {
        incrementScore(10);
      }
      setFeedback(true, isCorrect, currentQuestion.explanation || "Fallback explanation.");
      setMasteryMetrics(isCorrect ? 68.5 : 45.2, isCorrect ? 0.08 : -0.04);
      setTransitioning(false);
    }
  }, [currentQuestion, isTransitioning, incrementScore, setFeedback, setMasteryMetrics, setTransitioning, mode]);

  return {
    currentQuestion,
    isTransitioning,
    timer,
    startTest,
    submitResponse,
    loadNextQuestion
  };
};
