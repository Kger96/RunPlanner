import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, formatDuration, isoDate, weekStart } from "./domain";
import type { PlannerState, Run, Session, SessionTemplate } from "./types";
import { SegmentBreakdown, SessionPanelWithTemplates } from "./session-builder";
import { RunEntryPanel } from "./views";

type Mode = "week" | "month";
type Activity = { key: string; kind: "session"; session: Session; run?: Run } | { key: string; kind: "run"; run: Run };

const BUILT_IN_TYPES = ["easy", "long", "tempo", "interval", "race"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseIso(iso: string) { return new Date(`${iso}T12:00:00`); }
function addDays(date: Date, days: number) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days); }
function clamp(iso: string, min: string, max: string) { return iso < min ? min : iso > max ? max : iso; }
function monthIndex(date: Date) { return date.getFullYear() * 12 + date.getMonth(); }

function typeKey(session: Session) {
  const key = session.run_type.toLowerCase();
  return !session.template_id && BUILT_IN_TYPES.includes(key) ? key : "custom";
}

function dotState(activity: Activity) {
  if (activity.kind === "run") return "done";
  return activity.session.status === "completed" ? "done" : activity.session.status === "skipped" ? "skipped" : "planned";
}

function activityType(activity: Activity) { return activity.kind === "run" ? "unplanned" : typeKey(activity.session); }

export function PlannerView({ state, onState, onError }: { state: PlannerState; onState: (state: PlannerState) => void; onError: (message: string) => void }) {
  const goal = state.activeGoal;
  const todayIso = isoDate(new Date());
  const planFirst = goal ? goal.plan_start_date || goal.race_date : todayIso;
  const planLast = goal ? goal.race_date : todayIso;
  const startDate = clamp(todayIso, planFirst, planLast);

  const [mode, setMode] = useState<Mode>("week");
  const [selectedIso, setSelectedIso] = useState(startDate);
  const [addSessionDate, setAddSessionDate] = useState<string | null>(null);
  const [runEntry, setRunEntry] = useState<{ session?: Session; date?: string } | null>(null);

  if (!goal) return <section className="empty-state"><h2>Create a goal first</h2><p>Your plan will appear after you set a race goal.</p></section>;

  const selected = parseIso(selectedIso);

  let cells: (Date | null)[];
  let label: string;
  if (mode === "week") {
    const monday = weekStart(selected);
    cells = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
    label = `${formatDate(cells[0]!, "short")} - ${formatDate(cells[6]!, "short")} ${cells[6]!.getFullYear()}`;
  } else {
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const daysInMonth = new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
    const leading = (first.getDay() || 7) - 1;
    cells = Array.from({ length: Math.ceil((leading + daysInMonth) / 7) * 7 }, (_, index) => {
      const day = index - leading + 1;
      return day >= 1 && day <= daysInMonth ? new Date(selected.getFullYear(), selected.getMonth(), day) : null;
    });
    label = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }

  const firstPlan = parseIso(planFirst);
  const lastPlan = parseIso(planLast);
  const prevDisabled = mode === "week" ? isoDate(weekStart(selected)) <= isoDate(weekStart(firstPlan)) : monthIndex(selected) <= monthIndex(firstPlan);
  const nextDisabled = mode === "week" ? isoDate(weekStart(selected)) >= isoDate(weekStart(lastPlan)) : monthIndex(selected) >= monthIndex(lastPlan);

  function step(direction: -1 | 1) {
    if (mode === "week") { setSelectedIso(isoDate(addDays(selected, direction * 7))); return; }
    const target = new Date(selected.getFullYear(), selected.getMonth() + direction, 1);
    setSelectedIso(todayIso.startsWith(isoDate(target).slice(0, 7)) ? todayIso : isoDate(target));
  }

  function activitiesFor(iso: string): Activity[] {
    const sessions: Activity[] = state.sessions.filter((session) => session.scheduled_date === iso).map((session) => ({ key: `s${session.id}`, kind: "session", session, run: state.runs.find((run) => run.session_id === session.id) }));
    const runs: Activity[] = state.runs.filter((run) => run.is_unplanned && run.completed_date === iso).map((run) => ({ key: `r${run.id}`, kind: "run", run }));
    return [...sessions, ...runs];
  }

  const selectedActivities = activitiesFor(selectedIso);
  const selectedInPlan = selectedIso >= planFirst && selectedIso <= planLast;
  const heading = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(selected);

  return <section className="planner">
    <div className="planner-header"><div><p className="eyebrow">ACTIVE PLAN</p><h2>{goal.name}</h2></div></div>
    <div className="cal-toolbar">
      <div className="mode-toggle" role="group" aria-label="Calendar mode"><button type="button" aria-pressed={mode === "week"} onClick={() => setMode("week")}>Week</button><button type="button" aria-pressed={mode === "month"} onClick={() => setMode("month")}>Month</button></div>
      <div className="week-controls"><button type="button" aria-label={`Previous ${mode}`} disabled={prevDisabled} onClick={() => step(-1)}><ChevronLeft /></button><strong className="month-label">{label}</strong><button type="button" aria-label={`Next ${mode}`} disabled={nextDisabled} onClick={() => step(1)}><ChevronRight /></button><button type="button" className="chip-button" onClick={() => setSelectedIso(startDate)}>Today</button></div>
    </div>
    <div className={`calendar ${mode}`}>
      <div className="cal-grid">
        {DAY_NAMES.map((name) => <div key={name} className="cal-dayname">{name}</div>)}
        {cells.map((day, index) => {
          if (!day) return <div key={`pad-${index}`} />;
          const iso = isoDate(day);
          const activities = activitiesFor(iso);
          const inPlan = iso >= planFirst && iso <= planLast;
          const count = activities.length;
          return <button key={iso} type="button" aria-pressed={iso === selectedIso} aria-label={`${formatDate(day, "long")}, ${count} ${count === 1 ? "activity" : "activities"}`} className={`cal-day${iso === todayIso ? " today" : ""}${iso === selectedIso ? " selected" : ""}${inPlan ? "" : " out"}`} onClick={() => setSelectedIso(iso)}>
            <span className="cal-num">{day.getDate()}</span>
            <span className="cal-dots">{activities.map((activity) => <i key={activity.key} className={`cal-dot ${dotState(activity)} act-${activityType(activity)}`} />)}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="cal-detail">
      <h3>{heading}</h3>
      {!selectedInPlan && <p className="muted">This date is outside the active plan, so sessions cannot be added.</p>}
      {selectedActivities.map((activity) => <ActivityCard key={activity.key} activity={activity} templates={state.templates} onLog={(session) => setRunEntry({ session })} onState={onState} onError={onError} />)}
      <div className="cal-actions"><button type="button" className="secondary-action" onClick={() => setRunEntry({ date: selectedIso })}>Log a Run</button><button type="button" className="primary-action" disabled={!selectedInPlan} onClick={() => setAddSessionDate(selectedIso)}>Add Session</button></div>
    </div>
    {addSessionDate && <SessionPanelWithTemplates date={addSessionDate} goalId={goal.id} templates={state.templates} onClose={() => setAddSessionDate(null)} onState={onState} onError={onError} onLog={() => undefined} />}
    {runEntry && <RunEntryPanel session={runEntry.session} defaultDate={runEntry.date} onClose={() => setRunEntry(null)} onState={onState} onError={onError} />}
  </section>;
}

function ActivityCard({ activity, templates, onLog, onState, onError }: { activity: Activity; templates: SessionTemplate[]; onLog: (session: Session) => void; onState: (state: PlannerState) => void; onError: (message: string) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [moving, setMoving] = useState(false);
  const [newDate, setNewDate] = useState(activity.kind === "session" ? activity.session.scheduled_date : "");

  if (activity.kind === "run") {
    const run = activity.run;
    return <article className="activity-card act-unplanned"><h4>Unplanned run</h4><dl className="activity-meta"><div><dt>Type</dt><dd>Unplanned</dd></div><div><dt>Distance</dt><dd>{run.distance_km.toFixed(1)} km</dd></div><div><dt>Duration</dt><dd>{formatDuration(run.duration_seconds)}</dd></div><div><dt>Status</dt><dd>Completed</dd></div></dl></article>;
  }

  const { session, run } = activity;
  const template = session.template_id ? templates.find((candidate) => candidate.id === session.template_id) : undefined;
  const key = typeKey(session);
  const title = key === "custom" ? session.run_type : key === "race" ? "Race" : `${session.run_type} run`;
  const distance = run ? `${run.distance_km.toFixed(1)} km` : session.target_distance_km ? `${session.target_distance_km} km` : session.target_duration_seconds ? formatDuration(session.target_duration_seconds) : "Not set";
  const actionable = session.status === "scheduled" || session.status === "rescheduled";
  const hasDetails = Boolean(template) || Boolean(session.notes);

  async function skip() {
    if (!window.confirm(`Mark ${session.run_type} as skipped?`)) return;
    try { onState(await window.trainingPlanner.skipSession(session.id)); } catch (error) { onError(error instanceof Error ? error.message : "Session could not be updated."); }
  }

  async function reschedule() {
    try { onState(await window.trainingPlanner.rescheduleSession({ id: session.id, scheduledDate: newDate })); setMoving(false); }
    catch (error) { onError(error instanceof Error ? error.message : "Session could not be rescheduled."); }
  }

  return <article className={`activity-card act-${key}`}>
    <h4>{title}</h4>
    <dl className="activity-meta"><div><dt>Type</dt><dd>{key === "custom" ? "Custom session" : session.run_type}</dd></div><div><dt>{run ? "Distance" : "Target"}</dt><dd>{distance}</dd></div><div><dt>Status</dt><dd className="capitalize">{session.status}</dd></div></dl>
    {showDetails && <>{template && <SegmentBreakdown segments={template.segments} />}{session.notes && <p className="notes">{session.notes}</p>}</>}
    {moving && <div className="activity-actions"><input type="date" aria-label="New date" value={newDate} onChange={(event) => setNewDate(event.target.value)} /><button type="button" className="chip-button" onClick={reschedule}>Save date</button><button type="button" className="chip-button" onClick={() => setMoving(false)}>Cancel</button></div>}
    <div className="activity-actions">
      {actionable && <button type="button" className="chip-button" onClick={() => onLog(session)}>Log result</button>}
      {actionable && <button type="button" className="chip-button" onClick={() => setMoving(true)}>Reschedule</button>}
      {actionable && <button type="button" className="chip-button danger" onClick={skip}>Skip</button>}
      {hasDetails && <button type="button" className="chip-button" aria-expanded={showDetails} onClick={() => setShowDetails(!showDetails)}>{showDetails ? "Hide details" : "Details"}</button>}
    </div>
  </article>;
}
