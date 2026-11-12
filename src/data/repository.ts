import type { CalendarFormat, EditPlanInput, GoalInput, PlannerState, RunInput, SessionInput, SessionTemplateInput, Theme, UpdateRunInput, UpdateSessionTemplateInput } from "../types";

// Every command resolves to the complete next state so views never merge partial results.
export interface PlannerRepository {
  getState: () => Promise<PlannerState>;
  createGoal: (input: GoalInput) => Promise<PlannerState>;
  createSession: (input: SessionInput) => Promise<PlannerState>;
  createSessionTemplate: (input: SessionTemplateInput) => Promise<PlannerState>;
  updateSessionTemplate: (input: UpdateSessionTemplateInput) => Promise<PlannerState>;
  deleteSessionTemplate: (id: string) => Promise<PlannerState>;
  rescheduleSession: (input: { id: string; scheduledDate: string }) => Promise<PlannerState>;
  skipSession: (id: string) => Promise<PlannerState>;
  logRun: (input: RunInput) => Promise<PlannerState>;
  updateRun: (input: UpdateRunInput) => Promise<PlannerState>;
  deleteRun: (id: string) => Promise<PlannerState>;
  setTheme: (theme: Theme) => Promise<PlannerState>;
  setCalendarFormat: (format: CalendarFormat) => Promise<PlannerState>;
  cancelPlan: () => Promise<PlannerState>;
  editPlan: (input: EditPlanInput) => Promise<PlannerState>;
}
