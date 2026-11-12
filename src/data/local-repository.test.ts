import { beforeEach, describe, expect, it } from "vitest";
import { createLocalRepository } from "./local-repository";
import type { PlannerRepository } from "./repository";
import type { SessionTemplateSegment } from "../types";

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

const warmup: SessionTemplateSegment = { position: 0, segment_type: "warmup", distance_km: 2, duration_seconds: null, target_pace: null, repeat_count: null, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null };

let repo: PlannerRepository;
beforeEach(() => { repo = createLocalRepository(memoryStorage()); });

async function withGoal() {
  const state = await repo.createGoal({ name: "Autumn 10K", raceDate: "2026-09-06", planStartDate: "2026-08-03", distanceKm: 10 });
  return state.activeGoal!;
}

describe("ids", () => {
  it("creates unique UUID strings", async () => {
    const goal = await withGoal();
    const a = (await repo.createSession({ goalId: goal.id, scheduledDate: "2026-08-04", runType: "Easy", targetDistanceKm: 5 })).sessions[0];
    const b = (await repo.createSession({ goalId: goal.id, scheduledDate: "2026-08-05", runType: "Easy", targetDistanceKm: 5 })).sessions[1];
    expect(goal.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(a.id).not.toBe(b.id);
  });
});

describe("persistence", () => {
  it("starts empty and restores saved state from the same storage", async () => {
    const storage = memoryStorage();
    expect((await createLocalRepository(storage).getState()).goals).toEqual([]);
    await createLocalRepository(storage).createGoal({ name: "Race", raceDate: "2026-09-06", distanceKm: 10 });
    expect((await createLocalRepository(storage).getState()).activeGoal?.name).toBe("Race");
  });

  it("surfaces a read failure instead of starting empty", async () => {
    const broken = createLocalRepository({ getItem: () => { throw new Error("denied"); }, setItem: () => undefined });
    await expect(broken.getState()).rejects.toThrow("could not be read");
  });

  it("surfaces a write failure", async () => {
    const full = createLocalRepository({ getItem: () => null, setItem: () => { throw new Error("quota"); } });
    await expect(full.createGoal({ name: "Race", raceDate: "2026-09-06", distanceKm: 10 })).rejects.toThrow("could not be updated");
  });
});

describe("goals and sessions", () => {
  it("rejects an invalid goal", async () => {
    await expect(repo.createGoal({ name: " ", raceDate: "2026-09-06", distanceKm: 10 })).rejects.toThrow("required");
  });

  it("rejects sessions outside the plan dates", async () => {
    const goal = await withGoal();
    await expect(repo.createSession({ goalId: goal.id, scheduledDate: "2026-07-01", runType: "Easy", targetDistanceKm: 5 })).rejects.toThrow("within the active plan");
    await expect(repo.createSession({ goalId: goal.id, scheduledDate: "2026-09-07", runType: "Easy", targetDistanceKm: 5 })).rejects.toThrow("within the active plan");
  });

  it("marks a rescheduled session and remembers its original date", async () => {
    const goal = await withGoal();
    const session = (await repo.createSession({ goalId: goal.id, scheduledDate: "2026-08-04", runType: "Easy", targetDistanceKm: 5 })).sessions[0];
    const moved = (await repo.rescheduleSession({ id: session.id, scheduledDate: "2026-08-06" })).sessions[0];
    expect(moved).toMatchObject({ status: "rescheduled", scheduled_date: "2026-08-06", original_date: "2026-08-04" });
  });

  it("retains skipped sessions in the plan", async () => {
    const goal = await withGoal();
    const session = (await repo.createSession({ goalId: goal.id, scheduledDate: "2026-08-04", runType: "Easy", targetDistanceKm: 5 })).sessions[0];
    expect((await repo.skipSession(session.id)).sessions[0].status).toBe("skipped");
  });

  it("removes sessions and their runs when an edit shortens the plan", async () => {
    const goal = await withGoal();
    const state = await repo.createSession({ goalId: goal.id, scheduledDate: "2026-09-01", runType: "Easy", targetDistanceKm: 5 });
    await repo.logRun({ sessionId: state.sessions[0].id, completedDate: "2026-09-01", distanceKm: 5, durationSeconds: 1500 });
    const edited = await repo.editPlan({ id: goal.id, name: "Autumn 10K", raceDate: "2026-08-20", planStartDate: "2026-08-03", distanceKm: 10 });
    expect(edited.sessions).toHaveLength(0);
    expect(edited.runs).toHaveLength(0);
  });

  it("deletes a cancelled plan with its sessions and runs", async () => {
    const goal = await withGoal();
    const state = await repo.createSession({ goalId: goal.id, scheduledDate: "2026-08-04", runType: "Easy", targetDistanceKm: 5 });
    await repo.logRun({ sessionId: state.sessions[0].id, completedDate: "2026-08-04", distanceKm: 5, durationSeconds: 1500 });
    const cancelled = await repo.cancelPlan();
    expect(cancelled).toMatchObject({ activeGoal: null, goals: [], sessions: [], runs: [] });
  });
});

describe("runs", () => {
  it("completes the linked session and flags unlinked runs as unplanned", async () => {
    const goal = await withGoal();
    const session = (await repo.createSession({ goalId: goal.id, scheduledDate: "2026-08-04", runType: "Easy", targetDistanceKm: 5 })).sessions[0];
    await repo.logRun({ sessionId: session.id, completedDate: "2026-08-04", distanceKm: 5, durationSeconds: 1500 });
    const state = await repo.logRun({ completedDate: "2026-08-05", distanceKm: 3, durationSeconds: 900 });
    expect(state.sessions[0].status).toBe("completed");
    expect(state.runs.map((run) => run.is_unplanned)).toEqual([0, 1]);
  });

  it("rejects zero distance or duration", async () => {
    await expect(repo.logRun({ completedDate: "2026-08-05", distanceKm: 0, durationSeconds: 900 })).rejects.toThrow("greater than zero");
    await expect(repo.logRun({ completedDate: "2026-08-05", distanceKm: 3, durationSeconds: 0 })).rejects.toThrow("greater than zero");
  });

  it("updates a run in place", async () => {
    const run = (await repo.logRun({ completedDate: "2026-08-05", distanceKm: 3, durationSeconds: 900 })).runs[0];
    const updated = (await repo.updateRun({ id: run.id, completedDate: "2026-08-06", distanceKm: 4, durationSeconds: 1200 })).runs[0];
    expect(updated).toMatchObject({ id: run.id, completed_date: "2026-08-06", distance_km: 4 });
  });

  it("reopens a session when its only run is deleted, keeping a rescheduled status", async () => {
    const goal = await withGoal();
    const session = (await repo.createSession({ goalId: goal.id, scheduledDate: "2026-08-04", runType: "Easy", targetDistanceKm: 5 })).sessions[0];
    await repo.rescheduleSession({ id: session.id, scheduledDate: "2026-08-06" });
    const run = (await repo.logRun({ sessionId: session.id, completedDate: "2026-08-06", distanceKm: 5, durationSeconds: 1500 })).runs[0];
    const state = await repo.deleteRun(run.id);
    expect(state.runs).toHaveLength(0);
    expect(state.sessions[0].status).toBe("rescheduled");
  });

  it("throws when the run does not exist", async () => {
    await expect(repo.deleteRun("missing")).rejects.toThrow("not found");
  });
});

describe("templates", () => {
  it("rejects duplicate names case-insensitively but allows renaming itself", async () => {
    const created = (await repo.createSessionTemplate({ name: "Hills", segments: [warmup] })).templates[0];
    await expect(repo.createSessionTemplate({ name: "hills", segments: [warmup] })).rejects.toThrow("already exists");
    const renamed = await repo.updateSessionTemplate({ id: created.id, name: "HILLS", segments: [warmup] });
    expect(renamed.templates[0].name).toBe("HILLS");
  });

  it("rejects segments without a distance or duration", async () => {
    await expect(repo.createSessionTemplate({ name: "Empty", segments: [{ ...warmup, distance_km: null }] })).rejects.toThrow("distance or duration");
  });

  it("unlinks sessions but keeps their targets when a template is deleted", async () => {
    const goal = await withGoal();
    const template = (await repo.createSessionTemplate({ name: "Hills", segments: [warmup] })).templates[0];
    await repo.createSession({ goalId: goal.id, scheduledDate: "2026-08-04", runType: "Hills", targetDistanceKm: 2, templateId: template.id });
    const state = await repo.deleteSessionTemplate(template.id);
    expect(state.templates).toHaveLength(0);
    expect(state.sessions[0]).toMatchObject({ template_id: null, target_distance_km: 2 });
  });
});

describe("settings", () => {
  it("persists theme and calendar format", async () => {
    await repo.setTheme("dark");
    const state = await repo.setCalendarFormat("month");
    expect(state).toMatchObject({ theme: "dark", calendarFormat: "month" });
  });
});
