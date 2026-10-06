import { describe, expect, it } from "vitest";
import { calculateDashboard, calculateTemplateTargets, daysUntilRace, formatDuration, formatPace, getPlanWeekRange, isoDate, parseRunDuration } from "./domain";
import type { PlannerState } from "./types";

describe("run metrics", () => {
  it("formats a duration with seconds padded", () => {
    expect(formatDuration(2525)).toBe("42:05");
  });

  it("parses run durations of an hour or more", () => {
    expect(parseRunDuration("1:05:30")).toBe(3930);
    expect(parseRunDuration("01:05:30")).toBe(3930);
    expect(parseRunDuration("10:10:10")).toBe(36610);
    expect(parseRunDuration("42:30")).toBe(2550);
    expect(parseRunDuration("45")).toBe(2700);
    expect(parseRunDuration("1:60:00")).toBeNull();
    expect(parseRunDuration("abc")).toBeNull();
  });

  it("calculates metric pace from distance and duration", () => {
    expect(formatPace(10, 3000)).toBe("5:00");
  });

  it("keeps a local calendar day when serializing a planner date", () => {
    expect(isoDate(new Date(2026, 7, 3))).toBe("2026-08-03");
  });

  it("bounds planner weeks to the active plan range", () => {
    const range = getPlanWeekRange("2026-08-05", "2026-09-06");
    expect(isoDate(range.first)).toBe("2026-08-03");
    expect(isoDate(range.last)).toBe("2026-08-31");
  });

  it("calculates non-negative calendar days remaining until race day", () => {
    expect(daysUntilRace("2026-08-10", new Date(2026, 7, 7, 23, 59))).toBe(3);
    expect(daysUntilRace("2026-08-07", new Date(2026, 7, 7))).toBe(0);
    expect(daysUntilRace("2026-08-06", new Date(2026, 7, 7))).toBe(0);
  });

  it("builds chart data and plan status across the entire active plan", () => {
    const state: PlannerState = {
      activeGoal: { id: 1, name: "Autumn race", plan_start_date: "2026-08-03", race_date: "2026-09-06", distance_km: 10, target_time: null, active: 1 },
      goals: [],
      sessions: [
        { id: 1, goal_id: 1, scheduled_date: "2026-08-04", run_type: "Easy", target_distance_km: 5, target_duration_seconds: null, pace_low: null, pace_high: null, notes: null, status: "completed", original_date: null, template_id: null },
        { id: 2, goal_id: 1, scheduled_date: "2026-08-11", run_type: "Tempo", target_distance_km: 8, target_duration_seconds: null, pace_low: null, pace_high: null, notes: null, status: "scheduled", original_date: null, template_id: null },
      ],
      templates: [],
      runs: [{ id: 1, session_id: 1, completed_date: "2026-08-04", distance_km: 5, duration_seconds: 1500, rpe: null, avg_heart_rate: null, max_heart_rate: null, elevation_m: null, notes: null, is_unplanned: 0 }],
      theme: "system",
    };
    const metrics = calculateDashboard(state);
    expect(metrics.weeklySeries).toHaveLength(5);
    expect(metrics.planStatus).toEqual({ percent: 50, completedRuns: 1, remainingRuns: 1 });
  });

  it("includes the rest target in every structured repeat", () => {
    const targets = calculateTemplateTargets([
      { position: 0, segment_type: "warmup", distance_km: 2, duration_seconds: null, target_pace: "6:00", repeat_count: null, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null },
      { position: 1, segment_type: "repeat", distance_km: 0.4, duration_seconds: null, target_pace: "4:30", repeat_count: 6, rest_distance_km: 0.2, rest_duration_seconds: null, rest_pace: "7:00" },
      { position: 2, segment_type: "cooldown", distance_km: 1, duration_seconds: null, target_pace: "6:15", repeat_count: null, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null },
    ]);
    expect(targets.distanceKm).toBeCloseTo(6.6);
  });

  it("excludes recovery targets when a structured run disables recovery", () => {
    const targets = calculateTemplateTargets([
      { position: 0, segment_type: "repeat", distance_km: 0.4, duration_seconds: null, target_pace: "4:30", repeat_count: 6, rest_distance_km: 0.2, rest_duration_seconds: null, rest_pace: "7:00", include_recovery: 0 },
    ]);
    expect(targets.distanceKm).toBeCloseTo(2.4);
  });

  it("rounds the template total distance to 2 decimal places", () => {
    const targets = calculateTemplateTargets([
      { position: 0, segment_type: "warmup", distance_km: 0.1, duration_seconds: null, target_pace: null, repeat_count: null, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null },
      { position: 1, segment_type: "cooldown", distance_km: 0.2, duration_seconds: null, target_pace: null, repeat_count: null, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null },
      { position: 2, segment_type: "repeat", distance_km: 0.333, duration_seconds: null, target_pace: null, repeat_count: 3, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null, include_recovery: 0 },
    ]);
    expect(targets.distanceKm).toBe(1.3);
  });
});