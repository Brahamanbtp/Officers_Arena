"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useArenaStore, Question } from "../store/useArenaStore";
import { supabase } from "../lib/supabase/client";

const FALLBACK_UPSC_QUESTIONS: Question[] = [
  {
    id: "q-upsc-polity-presidential",
    text: "Consider the following statements regarding the Executive Powers of the President of India:\n1. All executive actions of the Government of India are formally taken in his name.\n2. He can make rules specifying the manner in which orders and other instruments made and executed in his name shall be authenticated.\n\nWhich of the statements given above is/are correct?",
    options: {
      "A": "1 only",
      "B": "2 only",
      "C": "Both 1 and 2",
      "D": "Neither 1 nor 2"
    },
    correct_answer: "C",
    explanation: "Under Article 77 of the Constitution of India, all executive actions of the Government of India are taken in the name of the President. Article 77(2) authorizes the President to make rules for authenticating orders.",
    metadata: { subject: "UPSC Indian Polity", difficulty: 0.65 }
  }
];

const FALLBACK_CDS_QUESTIONS: Question[] = [
  {
    id: "q-cds-speed-math",
    text: "A train running at a speed of 72 km/h crosses a 200m long platform in 25 seconds. What is the length of the train (in meters)?",
    options: {
      "A": "250 m",
      "B": "300 m",
      "C": "350 m",
      "D": "400 m"
    },
    correct_answer: "B",
    explanation: "Speed = 72 km/h = 72 * (5/18) = 20 m/s. Total distance covered in 25s = 20 * 25 = 500m. Length of train = Total distance - Platform length = 500m - 200m = 300 meters.",
    metadata: { subject: "CDS Speed & Elementary Math", difficulty: 0.55 }
  }
];

export function usePracticeSession() {
  const { user, isGuest, examMode, guestMasteryMap, updateGuestMastery, updateGuestTheta } = useAuthStore();
  const { 
    currentQuestion, 
    selectedOption, 
    confidence, 
    isTransitioning,
    showFeedback,
    isCorrectResult,
    feedbackExplanation,
    setQuestion, 
    setSelectedOption, 
    setConfidence, 
    setTransitioning, 
    setFeedback,
    setMasteryMetrics
  } = useArenaStore();

  const [isLoading, setIsLoading] = useState(false);
  const [socraticTriggered, setSocraticTriggered] = useState(false);
  const [responseTimeStart, setResponseTimeStart] = useState<number>(Date.now());

  const getFallbackItem = useCallback((mode: string) => {
    const list = mode === "CDS" ? FALLBACK_CDS_QUESTIONS : FALLBACK_UPSC_QUESTIONS;
    return list[Math.floor(Math.random() * list.length)];
  }, []);

  // 1. Fetch Next Question from FastAPI dispatcher
  const fetchNextQuestion = useCallback(async () => {
    setIsLoading(true);
    setTransitioning(true);
    setSocraticTriggered(false);
    setSelectedOption(null);
    setConfidence(null);
    setFeedback(false, null, "");

    try {
      const userId = user?.id || "guest_student";
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiEndpoint}/api/v1/arena/next-question?user_id=${userId}&exam_type=${examMode}`);
      
      if (res.ok) {
        const questionData = await res.json();
        setQuestion(questionData);
      } else {
        setQuestion(getFallbackItem(examMode));
      }
    } catch (error) {
      console.warn("[PracticeSession] Dispatcher offline, using grounded fallback item:", error);
      setQuestion(getFallbackItem(examMode));
    } finally {
      setIsLoading(false);
      setTransitioning(false);
      setResponseTimeStart(Date.now());
    }
  }, [user, examMode, setQuestion, setSelectedOption, setConfidence, setFeedback, setTransitioning, getFallbackItem]);

  // Initial load
  useEffect(() => {
    fetchNextQuestion();
  }, [fetchNextQuestion]);

  // 2. Submit Answer Lifecycle
  const submitAnswer = useCallback(async (optionId: string, confLevel: number) => {
    if (!currentQuestion || isTransitioning) return;

    const responseTimeMs = Date.now() - responseTimeStart;
    const isCorrect = optionId === currentQuestion.correct_answer;
    const explanation = currentQuestion.explanation || "No detailed breakdown available.";

    // Set UI Feedback
    setFeedback(true, isCorrect, explanation);

    // Trigger Socratic Sidekick if answer is incorrect OR confidence is low (< 3)
    if (!isCorrect || confLevel < 3) {
      setSocraticTriggered(true);
    }

    // A. Logged-in State: Save attempt to Supabase
    if (user?.id) {
      try {
        await supabase.from("user_attempts").insert([
          {
            user_id: user.id,
            question_id: currentQuestion.id,
            chosen_option_id: optionId,
            is_correct: isCorrect,
            response_time_ms: responseTimeMs
          }
        ]);
      } catch (err) {
        console.warn("[PracticeSession] Supabase attempt logging fallback:", err);
      }
    }

    const topicName = (currentQuestion.metadata as any)?.subject || `${examMode} Syllabus`;
    const currentMastery = guestMasteryMap[topicName] || 0.15;
    const newMastery = isCorrect 
      ? Math.min(1.0, currentMastery + 0.05) 
      : Math.max(0.0, currentMastery - 0.04);

    if (isGuest) {
      updateGuestMastery(topicName, newMastery);
      updateGuestTheta(isCorrect ? 0.08 : -0.05);
    }

    // Call FastAPI Adaptive Engine endpoint for real-time BKT & IRT calculation
    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const engineRes = await fetch(`${apiEndpoint}/v1/engine/update-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || "guest_student",
          topic_name: topicName,
          is_correct: isCorrect,
          current_theta: 0.0,
          current_mastery: currentMastery,
          difficulty_b: (currentQuestion.metadata as any)?.difficulty || 0.5,
          response_time_ms: responseTimeMs
        })
      });

      if (engineRes.ok) {
        const engineData = await engineRes.json();
        setMasteryMetrics(engineData.mastery_percentage, engineData.theta_delta);
      } else {
        setMasteryMetrics(newMastery * 100, isCorrect ? 0.08 : -0.05);
      }
    } catch (e) {
      setMasteryMetrics(newMastery * 100, isCorrect ? 0.08 : -0.05);
    }
  }, [currentQuestion, isTransitioning, responseTimeStart, user, isGuest, guestMasteryMap, updateGuestMastery, updateGuestTheta, setFeedback, setMasteryMetrics, examMode]);

  return {
    currentQuestion,
    selectedOption,
    confidence,
    isLoading,
    isTransitioning,
    showFeedback,
    isCorrectResult,
    feedbackExplanation,
    socraticTriggered,
    setSelectedOption,
    setConfidence,
    setSocraticTriggered,
    fetchNextQuestion,
    submitAnswer
  };
}
