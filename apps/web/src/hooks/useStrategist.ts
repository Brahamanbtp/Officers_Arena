"use client";

import { useState, useEffect, useCallback } from "react";

export interface TopicDetail {
  topic_name: string;
  priority: number;
  mastery: number;
  explanation: string;
}

export interface QuadrantsGroup {
  Q1: TopicDetail[];
  Q2: TopicDetail[];
  Q3: TopicDetail[];
  Q4: TopicDetail[];
}

export interface ScheduleItem {
  activity: string;
  duration_hours: number;
  description: string;
  quadrant: string;
  badge?: string;
}

export interface AdherenceStatus {
  adherence_score: number;
  focus_drift_detected: boolean;
  consistency_history: { day: string; score: number }[];
}

export interface DailyPlan {
  readiness_score: number;
  bottlenecks: string[];
  quadrants: QuadrantsGroup;
  schedule: ScheduleItem[];
  adherence_status: AdherenceStatus;
  behavioral_insight: string;
  nudge_style: string;
  nudge_message?: string;
}

export const useStrategist = (userId: string = "student_999", initialHours: number = 4.0, examType: string = "UPSC") => {
  const [hours, setHours] = useState<number>(initialHours);
  const [mode, setMode] = useState<string>(examType);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/strategist/daily-plan?user_id=${userId}&hours=${hours}&exam_type=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      } else {
        setError("Failed to retrieve cognitive daily plan.");
      }
    } catch (err) {
      setError("Network or API communication failure.");
    } finally {
      setLoading(false);
    }
  }, [userId, hours, mode]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const refreshStrategy = useCallback(() => {
    fetchPlan();
  }, [fetchPlan]);

  return {
    plan,
    loading,
    error,
    hours,
    setHours,
    mode,
    setMode,
    refreshStrategy
  };
};
