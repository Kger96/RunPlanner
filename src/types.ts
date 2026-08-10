export type Theme = "system" | "light" | "dark";
export type SessionStatus = "scheduled" | "completed" | "skipped" | "rescheduled";
export type SegmentType = "warmup" | "repeat" | "rest" | "cooldown";

export interface Goal {
  id: number;
  name: string;
  race_date: string;
  plan_start_date: string | null;
  distance_km: number;
  target_time: string | null;
  active: number;
}

export interface Session {
  id: number;
  goal_id: number;
  scheduled_date: string;
  run_type: string;
  target_distance_km: number;
  target_duration_seconds: number | null;
  pace_low: string | null;
  pace_high: string | null;
  notes: string | null;
  status: SessionStatus;
  original_date: string | null;
  template_id: number | null;
}

export interface SessionTemplateSegment {
  id?: number;
  position: number;
  segment_type: SegmentType;
  distance_km: number | null;
  duration_seconds: number | null;
  target_pace: string | null;
  repeat_count: number | null;
  rest_distance_km: number | null;
  rest_duration_seconds: number | null;
  rest_pace: string | null;
  include_recovery?: number;
}

export interface SessionTemplate {
  id: number;
  name: string;
  notes: string | null;
  segments: SessionTemplateSegment[];
}

export interface Run {
  id: number;
  session_id: number | null;
  completed_date: string;
  distance_km: number;
  duration_seconds: number;
  rpe: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  elevation_m: number | null;
  notes: string | null;
  is_unplanned: number;
}

export interface PlannerState {
  activeGoal: Goal | null;
  goals: Goal[];
  sessions: Session[];
  templates: SessionTemplate[];
  runs: Run[];
  theme: Theme;
}

export interface GoalInput {
  name: string;
  raceDate: string;
  planStartDate?: string;
  distanceKm: number;
  targetTime?: string;
}

export interface SessionInput {
  goalId: number;
  scheduledDate: string;
  runType: string;
  targetDistanceKm: number;
  targetDurationSeconds?: number;
  paceLow?: string;
  paceHigh?: string;
  notes?: string;
  templateId?: number;
}

export interface SessionTemplateInput {
  name: string;
  notes?: string;
  segments: SessionTemplateSegment[];
}

export interface RunInput {
  sessionId?: number;
  completedDate: string;
  distanceKm: number;
  durationSeconds: number;
  rpe?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  elevationM?: number;
  notes?: string;
}

declare global {
  interface Window {
    trainingPlanner: {
      getState: () => Promise<PlannerState>;
      createGoal: (input: GoalInput) => Promise<PlannerState>;
      createSession: (input: SessionInput) => Promise<PlannerState>;
      createSessionTemplate: (input: SessionTemplateInput) => Promise<PlannerState>;
      rescheduleSession: (input: { id: number; scheduledDate: string }) => Promise<PlannerState>;
      skipSession: (id: number) => Promise<PlannerState>;
      logRun: (input: RunInput) => Promise<PlannerState>;
      setTheme: (theme: Theme) => Promise<PlannerState>;
    };
  }
}