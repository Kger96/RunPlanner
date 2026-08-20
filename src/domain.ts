import type { PlannerState, Run, SessionTemplateSegment } from "./types";

const DAY_MS = 86_400_000;

export function isoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekDays(offset = 0): Date[] {
  const now = new Date();
  const weekday = now.getDay() || 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekday + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index));
}

export function weekStart(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : value;
  const weekday = date.getDay() || 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekday + 1);
}

export function getPlanWeekRange(planStartDate: string | null, raceDate: string): { first: Date; last: Date } {
  return {
    first: weekStart(planStartDate || raceDate),
    last: weekStart(raceDate),
  };
}

export function daysUntilRace(raceDate: string, today = new Date()): number {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const raceDay = new Date(`${raceDate}T00:00:00`);
  return Math.max(0, Math.round((raceDay.getTime() - startOfToday.getTime()) / DAY_MS));
}

export function formatDate(value: Date | string, format: "short" | "long" | "weekday" | "range"): string {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : value;
  const options: Record<typeof format, Intl.DateTimeFormatOptions> = {
    short: { day: "numeric", month: "short" },
    long: { day: "numeric", month: "long", year: "numeric" },
    weekday: { weekday: "short" },
    range: { day: "numeric", month: "short" },
  };
  return new Intl.DateTimeFormat("en-GB", options[format]).format(date);
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatPace(distanceKm: number, durationSeconds: number): string {
  return formatDuration(Math.round(durationSeconds / distanceKm));
}

export function calculateTemplateTargets(segments: SessionTemplateSegment[]): { distanceKm: number; durationSeconds: number } {
  return segments.reduce((totals, segment) => {
    if (segment.segment_type === "repeat" && segment.children?.length) {
      const repeatCount = Number(segment.repeat_count || 1);
      segment.children.forEach((child) => {
        totals.distanceKm += Number(child.distance_km || 0) * repeatCount;
        totals.durationSeconds += Number(child.duration_seconds || 0) * repeatCount;
        if (child.include_recovery !== 0) {
          totals.distanceKm += Number(child.rest_distance_km || 0) * repeatCount;
          totals.durationSeconds += Number(child.rest_duration_seconds || 0) * repeatCount;
        }
      });
      return totals;
    }
    const multiplier = segment.segment_type === "repeat" ? Number(segment.repeat_count || 1) : 1;
    totals.distanceKm += Number(segment.distance_km || 0) * multiplier;
    totals.durationSeconds += Number(segment.duration_seconds || 0) * multiplier;
    if (segment.segment_type === "repeat" && segment.include_recovery !== 0) {
      totals.distanceKm += Number(segment.rest_distance_km || 0) * multiplier;
      totals.durationSeconds += Number(segment.rest_duration_seconds || 0) * multiplier;
    }
    return totals;
  }, { distanceKm: 0, durationSeconds: 0 });
}

function sumDistance<T extends object>(items: T[], field: keyof T): number {
  return items.reduce((total, item) => total + Number(item[field] || 0), 0);
}

function inWeek(date: string, weekStart: Date): boolean {
  const value = new Date(`${date}T12:00:00`).getTime();
  const start = weekStart.getTime();
  return value >= start && value < start + 7 * DAY_MS;
}

export function calculateDashboard(state: PlannerState) {
  const { first, last } = state.activeGoal
    ? getPlanWeekRange(state.activeGoal.plan_start_date, state.activeGoal.race_date)
    : { first: getWeekDays()[0], last: getWeekDays()[0] };
  const weekStarts: Date[] = [];
  for (let week = first; week <= last; week = new Date(week.getFullYear(), week.getMonth(), week.getDate() + 7)) {
    weekStarts.push(week);
  }
  const weeklySeries = weekStarts.map((weekStart) => ({
    label: formatDate(weekStart, "short"),
    planned: sumDistance(state.sessions.filter((session) => inWeek(session.scheduled_date, weekStart) && session.status !== "skipped"), "target_distance_km"),
    completed: sumDistance(state.runs.filter((run) => inWeek(run.completed_date, weekStart)), "distance_km"),
  }));
  const currentWeek = weekStart(new Date());
  const current = weeklySeries.find((series) => series.label === formatDate(currentWeek, "short")) || { planned: 0, completed: 0 };
  const completedPlanRuns = state.sessions.filter((session) => session.status === "completed").length;
  const remainingPlanRuns = state.sessions.filter((session) => session.status === "scheduled" || session.status === "rescheduled").length;
  const planRunCount = completedPlanRuns + remainingPlanRuns;
  const completedByWeek = weeklySeries.map((series) => series.completed);

  return {
    thisWeek: {
      plannedKm: current.planned,
      completedKm: current.completed,
      percent: current.planned ? Math.min(100, Math.round((current.completed / current.planned) * 100)) : 0,
    },
    planStatus: {
      percent: planRunCount ? Math.round((completedPlanRuns / planRunCount) * 100) : 0,
      completedRuns: completedPlanRuns,
      remainingRuns: remainingPlanRuns,
    },
    nextSession: state.sessions.find((session) => session.status === "scheduled" || session.status === "rescheduled") || null,
    longestRun: state.runs.length ? Math.max(...state.runs.map((run) => run.distance_km)) : 0,
    highestWeek: completedByWeek.length ? Math.max(...completedByWeek) : 0,
    recentRuns: [...state.runs].sort((first, second) => second.completed_date.localeCompare(first.completed_date) || second.id - first.id).slice(0, 5) as Run[],
    weeklySeries,
    chartSummary: `Across the active plan from ${formatDate(first, "short")} to ${state.activeGoal ? formatDate(state.activeGoal.race_date, "short") : formatDate(last, "short")}, completed distance ranges from ${Math.min(...completedByWeek).toFixed(1)} to ${Math.max(...completedByWeek).toFixed(1)} kilometres per week.`,
  };
}