export type Theme = "system" | "light" | "dark";
export type CalendarFormat = "week" | "month";
export type SessionStatus = "scheduled" | "completed" | "skipped" | "rescheduled";
export type SegmentType = "warmup" | "repeat" | "rest" | "cooldown";

export interface Goal {
  id: string;
  name: string;
  race_date: string;
  plan_start_date: string | null;
  distance_km: number;
  target_time: string | null;
  active: number;
}

export interface Session {
  id: string;
  goal_id: string;
  scheduled_date: string;
  run_type: string;
  target_distance_km: number;
  target_duration_seconds: number | null;
  pace_low: string | null;
  pace_high: string | null;
  notes: string | null;
  status: SessionStatus;
  original_date: string | null;
  template_id: string | null;
}

export interface RepeatSubSegment {
  id: number;
  position: number;
  distance_km: number | null;
  duration_seconds: number | null;
  target_pace: string | null;
  rest_distance_km: number | null;
  rest_duration_seconds: number | null;
  rest_pace: string | null;
  include_recovery: number;
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
  children?: RepeatSubSegment[];
}

export interface SessionTemplate {
  id: string;
  name: string;
  notes: string | null;
  segments: SessionTemplateSegment[];
}

export interface Run {
  id: string;
  session_id: string | null;
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
  calendarFormat: CalendarFormat;
}

export interface GoalInput {
  name: string;
  raceDate: string;
  planStartDate?: string;
  distanceKm: number;
  targetTime?: string;
}

export interface SessionInput {
  goalId: string;
  scheduledDate: string;
  runType: string;
  targetDistanceKm: number;
  targetDurationSeconds?: number;
  paceLow?: string;
  paceHigh?: string;
  notes?: string;
  templateId?: string;
}

export interface SessionTemplateInput {
  name: string;
  notes?: string;
  segments: SessionTemplateSegment[];
}

export interface UpdateSessionTemplateInput extends SessionTemplateInput {
  id: string;
}

export interface RunInput {
  sessionId?: string;
  completedDate: string;
  distanceKm: number;
  durationSeconds: number;
  rpe?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  elevationM?: number;
  notes?: string;
}

export interface UpdateRunInput extends RunInput {
  id: string;
}

export interface EditPlanInput {
  id: string;
  name: string;
  raceDate: string;
  planStartDate?: string;
  distanceKm: number;
  targetTime?: string;
}

