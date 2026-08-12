import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Footprints, Pencil, Plus, SkipForward, Trophy, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateDashboard, daysUntilRace, formatDate, formatDuration, formatPace, getPlanWeekRange, isoDate, weekStart } from "./domain";
import type { GoalInput, PlannerState, RunInput, Session, SessionInput } from "./types";
import { SessionPanelWithTemplates } from "./session-builder";

export function DashboardView({ state, onState, onPlanner }: { state: PlannerState; onState: (state: PlannerState) => void; onPlanner: () => void }) {
  if (!state.activeGoal) return <GoalSetup onState={onState} />;
  const metrics = calculateDashboard(state);
  const daysRemaining = daysUntilRace(state.activeGoal.race_date);
  return <section className="dashboard">
    <div className="goal-banner">
      <div>
        <p className="eyebrow">ACTIVE GOAL</p>
        <h2>{state.activeGoal.name}</h2>
        <p>{state.activeGoal.distance_km} km</p>
        {state.activeGoal.target_time && <p className="target-time">Target: {state.activeGoal.target_time}</p>}
        <button onClick={onPlanner}>Open planner</button>
      </div>
      <div className="goal-number"><strong>{daysRemaining}</strong><small>{daysRemaining === 1 ? "day to go" : "days to go"}</small></div>
    </div>
    <div className="metric-grid">
      <article><span>This week</span><strong>{metrics.thisWeek.completedKm.toFixed(1)} <small>km</small></strong><p>{metrics.thisWeek.plannedKm.toFixed(1)} km planned</p><Progress value={metrics.thisWeek.percent} label={`${metrics.thisWeek.completedKm.toFixed(1)} of ${metrics.thisWeek.plannedKm.toFixed(1)} kilometres complete`} /></article>
      <article><span>Plan Status</span><strong>{metrics.planStatus.percent}%</strong><p>{metrics.planStatus.completedRuns} completed · {metrics.planStatus.remainingRuns} to do</p><Progress value={metrics.planStatus.percent} label={`${metrics.planStatus.completedRuns} completed runs and ${metrics.planStatus.remainingRuns} runs still to do`} /></article>
      <article><span>Personal best</span><strong>{metrics.longestRun.toFixed(1)} <small>km</small></strong><p>Longest single run</p><div className="record-line"><Trophy size={15} aria-hidden="true" />Highest week: {metrics.highestWeek.toFixed(1)} km</div></article>
    </div>
    <section className="dashboard-grid">
      <article className="chart-card">
        <div className="section-heading"><div><h2>Plan distance</h2><p>Plan vs Completed</p></div><span className="legend"><i />Completed <b />Planned</span></div>
        <div className="chart-wrap" role="img" aria-label={metrics.chartSummary}>
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={metrics.weeklySeries} margin={{ top: 10, right: 6, bottom: 0, left: -24 }}><defs><linearGradient id="actualFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#fc4c02" stopOpacity={0.3} /><stop offset="100%" stopColor="#fc4c02" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e5e1da" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#79756e", fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#79756e", fontSize: 12 }} /><Tooltip /><Area type="monotone" dataKey="planned" stroke="#a49f95" strokeDasharray="4 4" fill="transparent" strokeWidth={2} /><Area type="monotone" dataKey="completed" stroke="#fc4c02" fill="url(#actualFill)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer>
        </div>
        <p className="sr-only">{metrics.chartSummary}</p>
      </article>
      <article className="next-session">
        <div className="section-heading"><div><h2>Next session</h2><p>Keep the rhythm</p></div>{metrics.nextSession && <span className="date-chip">{formatDate(metrics.nextSession.scheduled_date, "short")}</span>}</div>
        {metrics.nextSession ? <div className="run-type"><Footprints size={22} aria-hidden="true" /><div><strong>{metrics.nextSession.run_type}</strong><span>{metrics.nextSession.target_distance_km} km {metrics.nextSession.pace_low && `at ${metrics.nextSession.pace_low}-${metrics.nextSession.pace_high}/km`}</span></div></div> : <p className="muted">Your next workout will appear here once you add a session.</p>}
        <button className="secondary-action" onClick={onPlanner}>{metrics.nextSession ? "View plan" : "Add a session"}</button>
      </article>
    </section>
    <section className="recent">
      <div className="section-heading"><div><h2>Recent activity</h2><p>Latest completed and unplanned runs</p></div></div>
      {metrics.recentRuns.length ? <ul className="activity-list">{metrics.recentRuns.map((run) => <li key={run.id}><span className="activity-icon"><Footprints size={17} /></span><div><strong>{run.is_unplanned ? "Unplanned run" : "Completed workout"}</strong><span>{formatDate(run.completed_date, "short")} · {run.distance_km.toFixed(1)} km · {formatDuration(run.duration_seconds)} · {formatPace(run.distance_km, run.duration_seconds)}/km</span></div><em>{run.elevation_m ? `+${run.elevation_m} m` : ""}</em></li>)}</ul> : <div className="empty-inline">No runs recorded yet. When you log one, it will appear here.</div>}
    </section>
  </section>;
}

export function PlannerView({ state, onState, onError }: { state: PlannerState; onState: (state: PlannerState) => void; onError: (message: string) => void }) {
  const [weekOffset, setWeekOffset] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ session?: Session; date: string } | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [runSession, setRunSession] = useState<Session | null>(null);

  if (!state.activeGoal) return <EmptyState title="Create a goal first" body="Your weekly plan will appear after you set a race goal." />;
  const goal = state.activeGoal;
  const { first, last } = getPlanWeekRange(goal.plan_start_date, goal.race_date);
  const currentWeek = weekStart(new Date());
  const defaultWeek = currentWeek < first ? first : currentWeek > last ? last : currentWeek;
  const defaultOffset = Math.round((defaultWeek.getTime() - first.getTime()) / (7 * 86_400_000));
  const activeOffset = weekOffset ?? defaultOffset;
  const selectedWeekStart = new Date(first.getFullYear(), first.getMonth(), first.getDate() + activeOffset * 7);
  const days = Array.from({ length: 7 }, (_, index) => new Date(selectedWeekStart.getFullYear(), selectedWeekStart.getMonth(), selectedWeekStart.getDate() + index));
  const canGoPrevious = activeOffset > 0;
  const canGoNext = selectedWeekStart < last;
  async function reschedule(id: number, scheduledDate: string) {
    try { onState(await window.trainingPlanner.rescheduleSession({ id, scheduledDate })); setSelected(null); }
    catch (error) { onError(error instanceof Error ? error.message : "Session could not be rescheduled."); }
  }
  return <section className="planner">
    <div className="planner-header"><div><p className="eyebrow">ACTIVE PLAN</p><h2>{goal.name}</h2></div><div className="week-controls"><button aria-label="Previous week" disabled={!canGoPrevious} onClick={() => setWeekOffset(activeOffset - 1)}><ChevronLeft /></button><strong>{formatDate(days[0], "range")} - {formatDate(days[6], "range")}</strong><button aria-label="Next week" disabled={!canGoNext} onClick={() => setWeekOffset(activeOffset + 1)}><ChevronRight /></button></div></div>
    <div className="week-grid">{days.map((day) => { const date = isoDate(day); const inPlan = date >= (goal.plan_start_date || date) && date <= goal.race_date; const sessions = state.sessions.filter((session) => session.scheduled_date === date); return <section key={date} className={inPlan ? "day-column" : "day-column out-of-plan"} onDragOver={(event) => { if (inPlan) event.preventDefault(); }} onDrop={() => { if (inPlan && draggedId) reschedule(draggedId, date); setDraggedId(null); }}><header><span>{formatDate(day, "weekday")}</span><strong>{day.getDate()}</strong></header><div className="day-sessions">{sessions.map((session) => <button key={session.id} draggable={inPlan} onDragStart={() => setDraggedId(session.id)} className={`session-card ${session.status}`} onClick={() => setSelected({ session, date })}><span>{session.status === "completed" ? "Completed" : session.status === "skipped" ? "Skipped" : session.run_type}</span><strong>{session.target_distance_km ? `${session.target_distance_km} km` : session.target_duration_seconds ? formatDuration(session.target_duration_seconds) : "Structured"}</strong>{session.pace_low && <small>{session.pace_low}-{session.pace_high}/km</small>}</button>)}</div><button className="add-session" disabled={!inPlan} onClick={() => setSelected({ date })}><Plus size={15} aria-hidden="true" />Add</button></section>; })}</div>
    <p className="planner-help">Weeks and dates outside the active plan are unavailable. Drag a session to another available plan day, or use the reschedule date in its detail panel.</p>
    {selected && <SessionPanelWithTemplates session={selected.session} date={selected.date} goalId={goal.id} templates={state.templates} onClose={() => setSelected(null)} onState={onState} onError={onError} onLog={(session) => { setSelected(null); setRunSession(session); }} />}
    {runSession && <RunEntryPanel session={runSession} onClose={() => setRunSession(null)} onState={onState} onError={onError} />}
  </section>;
}

export function RunLogView({ state, onState, onError, openEntry, onEntryOpened }: { state: PlannerState; onState: (state: PlannerState) => void; onError: (message: string) => void; openEntry?: boolean; onEntryOpened?: () => void }) {
  const [entryOpen, setEntryOpen] = useState(false);
  useEffect(() => { if (openEntry) { setEntryOpen(true); onEntryOpened?.(); } }, [openEntry, onEntryOpened]);
  return <section className="run-log"><div className="list-header"><div><p className="eyebrow">ACTIVITY HISTORY</p><h2>Every effort counts.</h2></div><button onClick={() => setEntryOpen(true)}><Plus size={17} />Log a run</button></div>{state.runs.length ? <ul className="run-list">{state.runs.map((run) => <li key={run.id}><div className="activity-icon"><Footprints size={18} /></div><div><strong>{run.is_unplanned ? "Unplanned run" : "Planned workout"}</strong><span>{formatDate(run.completed_date, "long")} · {run.distance_km.toFixed(1)} km · {formatDuration(run.duration_seconds)}</span>{run.notes && <p>{run.notes}</p>}</div><div className="run-stat"><strong>{formatPace(run.distance_km, run.duration_seconds)}</strong><span>/km</span></div></li>)}</ul> : <EmptyState title="No runs logged" body="Use Log a run to record a planned or unplanned activity." action={() => setEntryOpen(true)} actionLabel="Log a run" />}{entryOpen && <RunEntryPanel onClose={() => setEntryOpen(false)} onState={onState} onError={onError} />}</section>;
}

export function GoalHistoryView({ state, onCreate, onState, onError }: { state: PlannerState; onCreate: () => void; onState: (state: PlannerState) => void; onError: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPlanStartDate, setEditPlanStartDate] = useState("");
  const [editRaceDate, setEditRaceDate] = useState("");
  const [editDistanceKm, setEditDistanceKm] = useState("");
  const [editTargetTime, setEditTargetTime] = useState("");
  const [editError, setEditError] = useState("");

  function startEdit() {
    const goal = state.activeGoal!;
    setEditName(goal.name);
    setEditPlanStartDate(goal.plan_start_date || "");
    setEditRaceDate(goal.race_date);
    setEditDistanceKm(String(goal.distance_km));
    setEditTargetTime(goal.target_time || "");
    setEditError("");
    setEditing(true);
  }

  async function cancelPlan() {
    if (!window.confirm("Permanently delete the active plan and all associated sessions and runs? This cannot be undone.")) return;
    try { onState(await window.trainingPlanner.cancelPlan()); }
    catch (error) { onError(error instanceof Error ? error.message : "The plan could not be cancelled."); }
  }

  async function savePlan(event: React.FormEvent) {
    event.preventDefault();
    const goal = state.activeGoal!;
    const startChanged = editPlanStartDate !== (goal.plan_start_date || "");
    const endChanged = editRaceDate !== goal.race_date;
    if (startChanged || endChanged) {
      const outsideSessions = state.sessions.filter((s) =>
        s.goal_id === goal.id && ((editPlanStartDate && s.scheduled_date < editPlanStartDate) || s.scheduled_date > editRaceDate)
      );
      if (outsideSessions.length > 0 && !window.confirm("Some planned sessions and logged activities fall outside the new date range and will be permanently deleted. Continue?")) return;
    }
    try {
      onState(await window.trainingPlanner.editPlan({ id: goal.id, name: editName, raceDate: editRaceDate, planStartDate: editPlanStartDate || undefined, distanceKm: Number(editDistanceKm), targetTime: editTargetTime || undefined }));
      setEditing(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "The plan could not be updated.";
      setEditError(msg);
      onError(msg);
    }
  }

  return <section className="history">
    <div className="list-header"><div><p className="eyebrow">GOALS</p><h2>Goal and plan history</h2></div>{!state.activeGoal && <button onClick={onCreate}>Create goal</button>}</div>
    {state.goals.length
      ? <ul className="goal-list">{state.goals.map((goal) =>
          <li key={goal.id} className={goal.active && editing ? "editing" : ""}>
            {goal.active && editing
              ? <form className="edit-plan-form" onSubmit={savePlan}>
                  <label>Goal name<input value={editName} onChange={(e) => setEditName(e.target.value)} required /></label>
                  <div className="field-row">
                    <label>Plan start date<input type="date" value={editPlanStartDate} onChange={(e) => setEditPlanStartDate(e.target.value)} /></label>
                    <label>Race date<input type="date" value={editRaceDate} onChange={(e) => setEditRaceDate(e.target.value)} required /></label>
                  </div>
                  <div className="field-row">
                    <label>Distance (km)<input type="number" min="0.1" step="0.1" value={editDistanceKm} onChange={(e) => setEditDistanceKm(e.target.value)} required /></label>
                    <label>Target time <span className="optional">Optional</span><input value={editTargetTime} onChange={(e) => setEditTargetTime(e.target.value)} placeholder="00:50:00" /></label>
                  </div>
                  {editError && <p className="form-error" role="alert">{editError}</p>}
                  <div className="goal-form-actions">
                    <button type="submit" className="primary-action">Save changes</button>
                    <button type="button" className="secondary-action" onClick={() => setEditing(false)}>Discard</button>
                  </div>
                </form>
              : <><div>
                  <span className={goal.active ? "pill active-pill" : "pill"}>{goal.active ? "Active" : "Archived"}</span>
                  <h3>{goal.name}</h3>
                  <p>{goal.distance_km} km · {formatDate(goal.race_date, "long")}{goal.target_time && ` · Target ${goal.target_time}`}</p>
                  {goal.active && <div className="goal-actions">
                    <button type="button" className="secondary-action" onClick={startEdit}><Pencil size={14} aria-hidden="true" />Edit plan</button>
                    <button type="button" className="cancel-plan-action" onClick={cancelPlan}><X size={14} aria-hidden="true" />Cancel plan</button>
                  </div>}
                </div><Trophy size={24} aria-hidden="true" /></>}
          </li>
        )}</ul>
      : <EmptyState title="No goals yet" body="Your first race goal will anchor your training plan." action={onCreate} actionLabel="Create goal" />}
  </section>;
}

function GoalSetup({ onState }: { onState: (state: PlannerState) => void }) {
  const [name, setName] = useState(""); const [date, setDate] = useState(""); const [planStartDate, setPlanStartDate] = useState(isoDate(new Date())); const [distance, setDistance] = useState("10"); const [targetTime, setTargetTime] = useState(""); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); try { onState(await window.trainingPlanner.createGoal({ name, raceDate: date, planStartDate, distanceKm: Number(distance), targetTime })); } catch (reason) { setError(reason instanceof Error ? reason.message : "Goal could not be saved."); } }
  return <section className="goal-setup"><div><p className="eyebrow">YOUR FIRST PLAN</p><h2>Set the finish line.</h2><p>Start with the race you are training for. Build every session around it, then measure each effort against your target.</p></div><form onSubmit={submit}><label>Goal name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Autumn 10K" required /></label><label>Plan start date<input type="date" value={planStartDate} onChange={(event) => setPlanStartDate(event.target.value)} required /></label><label>Race date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label>Distance (km)<input type="number" min="0.1" step="0.1" value={distance} onChange={(event) => setDistance(event.target.value)} required /></label><label>Target finish time <span className="optional">Optional</span><input value={targetTime} onChange={(event) => setTargetTime(event.target.value)} placeholder="00:50:00" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit">Create goal</button></form></section>;
}

function SessionPanel({ session, date, goalId, onClose, onState, onError, onLog }: { session?: Session; date: string; goalId: number; onClose: () => void; onState: (state: PlannerState) => void; onError: (message: string) => void; onLog: (session: Session) => void }) {
  const [runType, setRunType] = useState(session?.run_type || "Easy run"); const [distance, setDistance] = useState(String(session?.target_distance_km || "5")); const [paceLow, setPaceLow] = useState(session?.pace_low || ""); const [paceHigh, setPaceHigh] = useState(session?.pace_high || ""); const [notes, setNotes] = useState(session?.notes || ""); const [scheduledDate, setScheduledDate] = useState(session?.scheduled_date || date);
  async function create(event: React.FormEvent) { event.preventDefault(); try { const input: SessionInput = { goalId, scheduledDate, runType, targetDistanceKm: Number(distance), paceLow, paceHigh, notes }; onState(await window.trainingPlanner.createSession(input)); onClose(); } catch (error) { onError(error instanceof Error ? error.message : "Session could not be saved."); } }
  async function reschedule() { if (!session) return; try { onState(await window.trainingPlanner.rescheduleSession({ id: session.id, scheduledDate })); onClose(); } catch (error) { onError(error instanceof Error ? error.message : "Session could not be rescheduled."); } }
  async function skip() { if (!session || !window.confirm(`Mark ${session.run_type} as skipped?`)) return; try { onState(await window.trainingPlanner.skipSession(session.id)); onClose(); } catch (error) { onError(error instanceof Error ? error.message : "Session could not be updated."); } }
  return <aside className="side-panel" aria-label={session ? "Session details" : "Add a session"}><header><div><p className="eyebrow">{session ? "SESSION DETAIL" : "NEW SESSION"}</p><h2>{session ? session.run_type : "Add a session"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close panel"><X /></button></header>{session ? <div className="session-detail"><dl><div><dt>Target distance</dt><dd>{session.target_distance_km} km</dd></div><div><dt>Pace range</dt><dd>{session.pace_low ? `${session.pace_low} - ${session.pace_high}/km` : "Not set"}</dd></div><div><dt>Status</dt><dd className="capitalize">{session.status}</dd></div></dl>{session.notes && <p className="notes">{session.notes}</p>}<label>Reschedule date<input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></label><button className="secondary-action" onClick={reschedule}>Reschedule</button>{session.status !== "completed" && session.status !== "skipped" && <><button className="primary-action" onClick={() => onLog(session)}>Log result</button><button className="skip-action" onClick={skip}><SkipForward size={16} />Mark skipped</button></>}</div> : <form onSubmit={create} className="session-form"><label>Session date<input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} required /></label><label>Run type<input value={runType} onChange={(event) => setRunType(event.target.value)} required /></label><label>Target distance (km)<input type="number" min="0.1" step="0.1" value={distance} onChange={(event) => setDistance(event.target.value)} required /></label><div className="field-row"><label>Fast pace<input placeholder="5:00" value={paceLow} onChange={(event) => setPaceLow(event.target.value)} /></label><label>Easy pace<input placeholder="5:30" value={paceHigh} onChange={(event) => setPaceHigh(event.target.value)} /></label></div><label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Workout details or interval structure" /></label><button className="primary-action" type="submit">Add session</button></form>}</aside>;
}

function RunEntryPanel({ session, onClose, onState, onError }: { session?: Session; onClose: () => void; onState: (state: PlannerState) => void; onError: (message: string) => void }) {
  const [date, setDate] = useState(isoDate(new Date())); const [distance, setDistance] = useState(String(session?.target_distance_km || "")); const [duration, setDuration] = useState(""); const [rpe, setRpe] = useState(""); const [avgHr, setAvgHr] = useState(""); const [maxHr, setMaxHr] = useState(""); const [elevation, setElevation] = useState(""); const [notes, setNotes] = useState(""); const [error, setError] = useState("");
  async function save(event: React.FormEvent) { event.preventDefault(); const [minutes, seconds = "0"] = duration.split(":"); const durationSeconds = Number(minutes) * 60 + Number(seconds); if (!(durationSeconds > 0)) { setError("Enter duration as minutes or minutes:seconds."); return; } try { const input: RunInput = { sessionId: session?.id, completedDate: date, distanceKm: Number(distance), durationSeconds, rpe: rpe ? Number(rpe) : undefined, avgHeartRate: avgHr ? Number(avgHr) : undefined, maxHeartRate: maxHr ? Number(maxHr) : undefined, elevationM: elevation ? Number(elevation) : undefined, notes }; onState(await window.trainingPlanner.logRun(input)); onClose(); } catch (reason) { onError(reason instanceof Error ? reason.message : "Run could not be saved."); } }
  return <aside className="side-panel run-panel" aria-label="Log a run"><header><div><p className="eyebrow">{session ? "COMPLETE SESSION" : "UNPLANNED RUN"}</p><h2>{session ? session.run_type : "Log a run"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close panel"><X /></button></header>{session && <div className="planned-context">Planned: {session.target_distance_km} km {session.pace_low && `at ${session.pace_low}-${session.pace_high}/km`}</div>}<form onSubmit={save} className="session-form"><label>Completed date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><div className="field-row"><label>Actual distance (km)<input type="number" min="0.1" step="0.1" value={distance} onChange={(event) => setDistance(event.target.value)} required /></label><label>Duration (mm:ss)<input placeholder="42:30" value={duration} onChange={(event) => setDuration(event.target.value)} required /></label></div><div className="field-row"><label>Perceived effort (1-10)<input type="number" min="1" max="10" value={rpe} onChange={(event) => setRpe(event.target.value)} /></label><label>Elevation gain (m)<input type="number" min="0" value={elevation} onChange={(event) => setElevation(event.target.value)} /></label></div><div className="field-row"><label>Average HR<input type="number" min="1" value={avgHr} onChange={(event) => setAvgHr(event.target.value)} /></label><label>Maximum HR<input type="number" min="1" value={maxHr} onChange={(event) => setMaxHr(event.target.value)} /></label></div><label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="How did it feel?" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-action" type="submit">Save run</button></form></aside>;
}

function Progress({ value, label }: { value: number; label: string }) { return <div className="progress" aria-label={label}><i style={{ width: `${value}%` }} /></div>; }
function EmptyState({ title, body, action, actionLabel }: { title: string; body: string; action?: () => void; actionLabel?: string }) { return <section className="empty-state"><Footprints size={28} aria-hidden="true" /><h2>{title}</h2><p>{body}</p>{action && <button className="primary-action" onClick={action}>{actionLabel}</button>}</section>; }