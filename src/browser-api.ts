import type { EditPlanInput, Goal, GoalInput, PlannerState, Run, RunInput, Session, SessionInput, SessionTemplate, SessionTemplateInput, Theme } from "./types";

const storageKey = "training-planner-state-v2";
const legacyStorageKey = "training-planner-preview-state";
const storageVersion = 2;
const emptyState: PlannerState = { activeGoal: null, goals: [], sessions: [], templates: [], runs: [], theme: "system" };

function normalizeState(value: Partial<PlannerState>): PlannerState {
  return {
    ...emptyState,
    ...value,
    templates: (value.templates || []).map((template) => ({
      ...template,
      segments: template.segments.map((segment) => ({ ...segment, include_recovery: segment.include_recovery === 0 ? 0 : 1 })),
    })),
  };
}

function readState(): PlannerState {
  try {
    const current = localStorage.getItem(storageKey);
    if (current) return normalizeState(JSON.parse(current).state);
    const legacy = localStorage.getItem(legacyStorageKey);
    if (!legacy) return emptyState;
    const migrated = normalizeState(JSON.parse(legacy));
    writeState(migrated);
    return migrated;
  } catch (error) {
    throw new Error("Local browser storage could not be read.", { cause: error });
  }
}

function writeState(state: PlannerState): PlannerState {
  try {
    const normalized = normalizeState(state);
    localStorage.setItem(storageKey, JSON.stringify({ version: storageVersion, state: normalized }));
    return normalized;
  } catch (error) {
    throw new Error("Local browser storage could not be updated.", { cause: error });
  }
}

function nextId(items: { id: number }[]): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

window.trainingPlanner = {
  getState: async () => readState(),
  createGoal: async (input: GoalInput) => {
    if (!input.name.trim() || !input.raceDate || !(input.distanceKm > 0)) throw new Error("Goal name, race date, and distance are required.");
    const state = readState();
    const goals = state.goals.map((goal) => ({ ...goal, active: 0 }));
    const goal: Goal = { id: nextId(goals), name: input.name.trim(), race_date: input.raceDate, plan_start_date: input.planStartDate || null, distance_km: input.distanceKm, target_time: input.targetTime?.trim() || null, active: 1 };
    return writeState({ ...state, goals: [...goals, goal], activeGoal: goal, sessions: [] });
  },
  createSession: async (input: SessionInput) => {
    if (!input.runType.trim() || !input.scheduledDate || (input.targetDistanceKm < 0) || (!(input.targetDistanceKm > 0) && !(input.targetDurationSeconds && input.targetDurationSeconds > 0))) throw new Error("Run type, date, and a target distance or duration are required.");
    const state = readState();
    const goal = state.goals.find((candidate) => candidate.id === input.goalId);
    if (goal && ((goal.plan_start_date && input.scheduledDate < goal.plan_start_date) || input.scheduledDate > goal.race_date)) throw new Error("Sessions must be scheduled within the active plan dates.");
    const session: Session = { id: nextId(state.sessions), goal_id: input.goalId, scheduled_date: input.scheduledDate, run_type: input.runType.trim(), target_distance_km: input.targetDistanceKm || 0, target_duration_seconds: input.targetDurationSeconds || null, pace_low: input.paceLow?.trim() || null, pace_high: input.paceHigh?.trim() || null, notes: input.notes?.trim() || null, status: "scheduled", original_date: null, template_id: input.templateId || null };
    return writeState({ ...state, sessions: [...state.sessions, session] });
  },
  createSessionTemplate: async (input: SessionTemplateInput) => {
    if (!input.name.trim() || !input.segments.length) throw new Error("A template name and at least one segment are required.");
    if (input.segments.some((segment) => !(segment.distance_km && segment.distance_km > 0) && !(segment.duration_seconds && segment.duration_seconds > 0))) throw new Error("Every segment needs a distance or duration.");
    const state = readState();
    if (state.templates.some((template) => template.name.toLowerCase() === input.name.trim().toLowerCase())) throw new Error("A session template with this name already exists.");
    const template: SessionTemplate = { id: nextId(state.templates), name: input.name.trim(), notes: input.notes?.trim() || null, segments: input.segments.map((segment, position) => ({ ...segment, id: position + 1, position })) };
    return writeState({ ...state, templates: [...state.templates, template] });
  },
  rescheduleSession: async ({ id, scheduledDate }) => {
    const state = readState();
    const session = state.sessions.find((candidate) => candidate.id === id);
    const goal = state.goals.find((candidate) => candidate.id === session?.goal_id);
    if (goal && ((goal.plan_start_date && scheduledDate < goal.plan_start_date) || scheduledDate > goal.race_date)) throw new Error("Sessions must be scheduled within the active plan dates.");
    return writeState({ ...state, sessions: state.sessions.map((session) => session.id === id ? { ...session, original_date: session.original_date || session.scheduled_date, scheduled_date: scheduledDate, status: "rescheduled" } : session) });
  },
  skipSession: async (id) => {
    const state = readState();
    return writeState({ ...state, sessions: state.sessions.map((session) => session.id === id ? { ...session, status: "skipped" } : session) });
  },
  logRun: async (input: RunInput) => {
    if (!(input.distanceKm > 0) || !(input.durationSeconds > 0)) throw new Error("Distance and duration must be greater than zero.");
    const state = readState();
    const run: Run = { id: nextId(state.runs), session_id: input.sessionId || null, completed_date: input.completedDate, distance_km: input.distanceKm, duration_seconds: input.durationSeconds, rpe: input.rpe || null, avg_heart_rate: input.avgHeartRate || null, max_heart_rate: input.maxHeartRate || null, elevation_m: input.elevationM || null, notes: input.notes?.trim() || null, is_unplanned: input.sessionId ? 0 : 1 };
    return writeState({ ...state, runs: [...state.runs, run], sessions: state.sessions.map((session) => session.id === input.sessionId ? { ...session, status: "completed" } : session) });
  },
  setTheme: async (theme: Theme) => writeState({ ...readState(), theme }),
  cancelPlan: async () => {
    const state = readState();
    if (!state.activeGoal) throw new Error("No active plan to cancel.");
    const goalId = state.activeGoal.id;
    const sessionIds = new Set(state.sessions.filter((s) => s.goal_id === goalId).map((s) => s.id));
    return writeState({
      ...state,
      goals: state.goals.filter((g) => g.id !== goalId),
      activeGoal: null,
      sessions: state.sessions.filter((s) => s.goal_id !== goalId),
      runs: state.runs.filter((r) => !r.session_id || !sessionIds.has(r.session_id)),
    });
  },
  editPlan: async (input: EditPlanInput) => {
    if (!input.name.trim() || !input.raceDate || !(input.distanceKm > 0)) throw new Error("Goal name, race date, and distance are required.");
    const state = readState();
    const existing = state.goals.find((g) => g.id === input.id);
    if (!existing) throw new Error("Goal not found.");
    const updated: Goal = { ...existing, name: input.name.trim(), race_date: input.raceDate, plan_start_date: input.planStartDate || null, distance_km: input.distanceKm, target_time: input.targetTime?.trim() || null };
    const outsideIds = new Set(
      state.sessions
        .filter((s) => s.goal_id === input.id && ((updated.plan_start_date && s.scheduled_date < updated.plan_start_date) || s.scheduled_date > updated.race_date))
        .map((s) => s.id)
    );
    return writeState({
      ...state,
      goals: state.goals.map((g) => g.id === input.id ? updated : g),
      activeGoal: updated,
      sessions: state.sessions.filter((s) => !outsideIds.has(s.id)),
      runs: state.runs.filter((r) => !r.session_id || !outsideIds.has(r.session_id)),
    });
  },
};