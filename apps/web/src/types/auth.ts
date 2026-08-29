export type ExamMode = "UPSC" | "CDS";

export interface StudentProfile {
  id: string;
  email?: string;
  full_name: string;
  target_exam: ExamMode;
  target_year: number;
  daily_goal_hours: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudentState {
  user_id: string;
  theta: number;
  total_answered: number;
  is_adaptive: boolean;
  mastery_map: Record<string, number>;
  srs_queue_count: number;
  last_active: string;
}

export interface GuestState {
  theta: number;
  masteryMap: Record<string, number>;
  srsMetadata: Record<string, any>;
  performanceLogs: Array<{
    question_id: string;
    is_correct: boolean;
    response_time: number;
    confidence_level: number;
    timestamp: string;
  }>;
}
