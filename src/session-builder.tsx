import React, { useState } from "react";
import { ArrowDown, ArrowUp, CopyPlus, Footprints, Pause, Plus, SkipForward, Timer, Trash2, Wind, X } from "lucide-react";
import { calculateTemplateTargets, formatDuration } from "./domain";
import type { PlannerState, SegmentType, Session, SessionInput, SessionTemplate, SessionTemplateInput, SessionTemplateSegment } from "./types";

const predefinedRunTypes = ["Easy", "Long", "Tempo", "Interval", "Race"];
const segmentLabels: Record<SegmentType, string> = { warmup: "Warm up", repeat: "Run", rest: "Rest", cooldown: "Cool down" };
const segmentIcons: Record<SegmentType, React.ReactNode> = { warmup: <Timer size={13} aria-hidden="true" />, repeat: <Footprints size={13} aria-hidden="true" />, rest: <Pause size={13} aria-hidden="true" />, cooldown: <Wind size={13} aria-hidden="true" /> };

function parseDuration(value: string): number | null {
  if (!value.trim()) return null;
  const [minutes, seconds = "0"] = value.split(":");
  const result = Number(minutes) * 60 + Number(seconds);
  return Number.isFinite(result) && result > 0 ? result : null;
}

function formatDurationInput(seconds: number | null): string {
  return seconds ? formatDuration(seconds) : "";
}

function newSegment(segmentType: SegmentType, position: number): SessionTemplateSegment {
  const defaults: Record<SegmentType, Partial<SessionTemplateSegment>> = {
    warmup: { distance_km: 1, target_pace: "6:00" },
    repeat: { distance_km: 0.4, target_pace: "4:30", repeat_count: 4, rest_distance_km: 0.2, rest_pace: "7:00", include_recovery: 1 },
    rest: { distance_km: 0.2, target_pace: "7:00" },
    cooldown: { distance_km: 1, target_pace: "6:15" },
  };
  return { id: position + 1, position, segment_type: segmentType, distance_km: null, duration_seconds: null, target_pace: null, repeat_count: null, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null, ...defaults[segmentType] };
}

function segmentDescription(segment: SessionTemplateSegment): string {
  const target = segment.distance_km ? `${segment.distance_km} km` : formatDurationInput(segment.duration_seconds);
  if (segment.segment_type !== "repeat") return target || "No target";
  if (segment.include_recovery === 0) return `${segment.repeat_count || 1} x ${target}`;
  const rest = segment.rest_distance_km ? `${segment.rest_distance_km} km rest` : formatDurationInput(segment.rest_duration_seconds) ? `${formatDurationInput(segment.rest_duration_seconds)} rest` : "no rest target";
  return `${segment.repeat_count || 1} x ${target} with ${rest}`;
}

export function SessionBuilderView({ state, onState, onError }: { state: PlannerState; onState: (state: PlannerState) => void; onError: (message: string) => void }) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [segments, setSegments] = useState<SessionTemplateSegment[]>([newSegment("warmup", 0), newSegment("repeat", 1), newSegment("cooldown", 2)]);
  const [formError, setFormError] = useState("");

  function updateSegment(index: number, changes: Partial<SessionTemplateSegment>) {
    setSegments((current) => current.map((segment, segmentIndex) => segmentIndex === index ? { ...segment, ...changes } : segment));
  }

  function moveSegment(index: number, direction: -1 | 1) {
    setSegments((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next.map((segment, position) => ({ ...segment, position }));
    });
  }

  async function saveTemplate(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    const input: SessionTemplateInput = { name, notes, segments: segments.map((segment, position) => ({ ...segment, position })) };
    try {
      onState(await window.trainingPlanner.createSessionTemplate(input));
      setName("");
      setNotes("");
      setSegments([newSegment("warmup", 0), newSegment("repeat", 1), newSegment("cooldown", 2)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The session template could not be saved.";
      setFormError(message);
      onError(message);
    }
  }

  const targets = calculateTemplateTargets(segments);
  const distanceExclRecovery = segments.reduce((total, seg) => {
    const multiplier = seg.segment_type === "repeat" ? Number(seg.repeat_count || 1) : 1;
    return total + Number(seg.distance_km || 0) * multiplier;
  }, 0);

  return <section className="session-builder">
    <div className="list-header"><div><p className="eyebrow">REUSABLE WORKOUTS</p><h2>Session Builder</h2><p>Build a structured session once, then schedule it whenever you need it.</p></div></div>
    <div className="builder-layout">
      <form className="builder-form" onSubmit={saveTemplate}>
        <div className="field-row"><label>Session name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="6 x 400 m intervals" required /></label><label>Notes <span className="optional">Optional</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Hard but controlled" /></label></div>
        <div className="builder-heading"><div><h3>Workout segments</h3><p>Repeat segments include their configured recovery on every repetition.</p></div><div className="segment-actions">{(["warmup", "repeat", "rest", "cooldown"] as SegmentType[]).map((type) => <button key={type} type="button" className="add-segment" onClick={() => setSegments((current) => [...current, newSegment(type, current.length)])}><Plus size={14} />{segmentLabels[type]}</button>)}</div></div>
        <ol className="segment-list">{segments.map((segment, index) => <SegmentEditor key={`${segment.id}-${index}`} segment={segment} onChange={(changes) => updateSegment(index, changes)} onMove={(direction) => moveSegment(index, direction)} onRemove={() => setSegments((current) => current.filter((_, segmentIndex) => segmentIndex !== index).map((item, position) => ({ ...item, position })))} canMoveUp={index > 0} canMoveDown={index < segments.length - 1} canRemove={segments.length > 1} />)}</ol>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <button className="primary-action" type="submit"><CopyPlus size={17} />Save reusable session</button>
      </form>
      <aside className="template-library" aria-label="Saved session templates"><h3>Saved sessions</h3>{state.templates.length ? <ul>{state.templates.map((template) => <li key={template.id}><strong>{template.name}</strong><span>{template.segments.map(segmentDescription).join(" · ")}</span></li>)}</ul> : <p>No reusable sessions yet.</p>}</aside>
    </div>
    <div className="builder-footer">
      <p>Total distance: {distanceExclRecovery.toFixed(2)} km (excluding recoveries){targets.durationSeconds ? ` · Total time: ~${formatDuration(targets.durationSeconds)}` : ""}</p>
    </div>
  </section>;
}

function SegmentEditor({ segment, onChange, onMove, onRemove, canMoveUp, canMoveDown, canRemove }: { segment: SessionTemplateSegment; onChange: (changes: Partial<SessionTemplateSegment>) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void; canMoveUp: boolean; canMoveDown: boolean; canRemove: boolean }) {
  const [targetMode, setTargetMode] = useState<"distance" | "duration">(segment.duration_seconds && !segment.distance_km ? "duration" : "distance");
  const [recoveryMode, setRecoveryMode] = useState<"distance" | "duration">(segment.rest_duration_seconds && !segment.rest_distance_km ? "duration" : "distance");
  const includesRecovery = segment.include_recovery !== 0;

  function changeTargetMode(mode: "distance" | "duration") {
    setTargetMode(mode);
    onChange(mode === "distance" ? { duration_seconds: null } : { distance_km: null });
  }

  function changeRecoveryMode(mode: "distance" | "duration") {
    setRecoveryMode(mode);
    onChange(mode === "distance" ? { rest_duration_seconds: null } : { rest_distance_km: null });
  }

  return <li className={`segment-editor ${segment.segment_type}`}>
    <div className="segment-toolbar"><span className={`segment-kind ${segment.segment_type}`}>{segmentIcons[segment.segment_type]}{segmentLabels[segment.segment_type]}</span><div><button type="button" onClick={() => onMove(-1)} disabled={!canMoveUp} aria-label="Move segment up"><ArrowUp size={15} /></button><button type="button" onClick={() => onMove(1)} disabled={!canMoveDown} aria-label="Move segment down"><ArrowDown size={15} /></button><button type="button" onClick={onRemove} disabled={!canRemove} aria-label="Remove segment"><Trash2 size={15} /></button></div></div>
    <div className="segment-fields">
      <label>Target type<select value={targetMode} onChange={(event) => changeTargetMode(event.target.value as "distance" | "duration")}><option value="distance">Distance</option><option value="duration">Duration</option></select></label>
      {targetMode === "distance" ? <label>Distance<div className="input-with-unit"><input type="number" min="0" step="0.1" value={segment.distance_km || ""} onChange={(event) => onChange({ distance_km: event.target.value ? Number(event.target.value) : null })} /><span className="input-unit">km</span></div></label> : <label>Duration<div className="input-with-unit"><input value={formatDurationInput(segment.duration_seconds)} placeholder="05:00" onChange={(event) => onChange({ duration_seconds: parseDuration(event.target.value) })} /><span className="input-unit">mm:ss</span></div></label>}
      <label>Target pace<div className="input-with-unit"><input value={segment.target_pace || ""} placeholder="5:30" onChange={(event) => onChange({ target_pace: event.target.value || null })} /><span className="input-unit">/km</span></div></label>
      {segment.segment_type === "repeat" && <label>Run count<input type="number" min="1" value={segment.repeat_count || ""} onChange={(event) => onChange({ repeat_count: event.target.value ? Number(event.target.value) : null })} /></label>}
    </div>
    {segment.segment_type === "repeat" && <><label className="recovery-toggle"><input type="checkbox" checked={includesRecovery} onChange={(event) => onChange(event.target.checked ? { include_recovery: 1 } : { include_recovery: 0, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null })} />Include recovery after every run</label>{includesRecovery && <div className="recovery-fields recovery-fields--block"><label>Target type<select value={recoveryMode} onChange={(event) => changeRecoveryMode(event.target.value as "distance" | "duration")}><option value="distance">Distance</option><option value="duration">Duration</option></select></label>{recoveryMode === "distance" ? <label>Distance<div className="input-with-unit"><input type="number" min="0" step="0.1" value={segment.rest_distance_km || ""} onChange={(event) => onChange({ rest_distance_km: event.target.value ? Number(event.target.value) : null })} /><span className="input-unit">km</span></div></label> : <label>Duration<div className="input-with-unit"><input value={formatDurationInput(segment.rest_duration_seconds)} placeholder="01:00" onChange={(event) => onChange({ rest_duration_seconds: parseDuration(event.target.value) })} /><span className="input-unit">mm:ss</span></div></label>}<label>Target pace<div className="input-with-unit"><input value={segment.rest_pace || ""} placeholder="7:00" onChange={(event) => onChange({ rest_pace: event.target.value || null })} /><span className="input-unit">/km</span></div></label></div>}</>}
  </li>;
}

export function SessionPanelWithTemplates({ session, date, goalId, templates, onClose, onState, onError, onLog }: { session?: Session; date: string; goalId: number; templates: SessionTemplate[]; onClose: () => void; onState: (state: PlannerState) => void; onError: (message: string) => void; onLog: (session: Session) => void }) {
  const [runType, setRunType] = useState(session?.run_type || "Easy");
  const [templateId, setTemplateId] = useState<number | null>(session?.template_id || null);
  const [distance, setDistance] = useState(String(session?.target_distance_km || ""));
  const [duration, setDuration] = useState(formatDurationInput(session?.target_duration_seconds || null));
  const [paceLow, setPaceLow] = useState(session?.pace_low || "");
  const [paceHigh, setPaceHigh] = useState(session?.pace_high || "");
  const [notes, setNotes] = useState(session?.notes || "");
  const [scheduledDate, setScheduledDate] = useState(session?.scheduled_date || date);

  function selectRunType(value: string) {
    const template = templates.find((candidate) => `template-${candidate.id}` === value);
    if (!template) { setTemplateId(null); setRunType(value); return; }
    const targets = calculateTemplateTargets(template.segments);
    setTemplateId(template.id);
    setRunType(template.name);
    setDistance(targets.distanceKm ? String(targets.distanceKm) : "");
    setDuration(formatDurationInput(targets.durationSeconds || null));
    setNotes(template.notes || "");
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    try {
      const input: SessionInput = { goalId, scheduledDate, runType, targetDistanceKm: Number(distance || 0), targetDurationSeconds: parseDuration(duration) || undefined, paceLow, paceHigh, notes, templateId: templateId || undefined };
      onState(await window.trainingPlanner.createSession(input));
      onClose();
    } catch (error) { onError(error instanceof Error ? error.message : "Session could not be saved."); }
  }

  async function reschedule() {
    if (!session) return;
    try { onState(await window.trainingPlanner.rescheduleSession({ id: session.id, scheduledDate })); onClose(); }
    catch (error) { onError(error instanceof Error ? error.message : "Session could not be rescheduled."); }
  }

  async function skip() {
    if (!session || !window.confirm(`Mark ${session.run_type} as skipped?`)) return;
    try { onState(await window.trainingPlanner.skipSession(session.id)); onClose(); }
    catch (error) { onError(error instanceof Error ? error.message : "Session could not be updated."); }
  }

  if (session) return <aside className="side-panel" aria-label="Session details"><header><div><p className="eyebrow">SESSION DETAIL</p><h2>{session.run_type}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close panel"><X /></button></header><div className="session-detail"><dl><div><dt>Target distance</dt><dd>{session.target_distance_km ? `${session.target_distance_km} km` : "Not set"}</dd></div><div><dt>Target duration</dt><dd>{formatDurationInput(session.target_duration_seconds)}</dd></div><div><dt>Pace range</dt><dd>{session.pace_low ? `${session.pace_low} - ${session.pace_high}/km` : "Not set"}</dd></div><div><dt>Status</dt><dd className="capitalize">{session.status}</dd></div></dl>{session.notes && <p className="notes">{session.notes}</p>}<label>Reschedule date<input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></label><button className="secondary-action" onClick={reschedule}>Reschedule</button>{session.status !== "completed" && session.status !== "skipped" && <><button className="primary-action" onClick={() => onLog(session)}>Log result</button><button className="skip-action" onClick={skip}><SkipForward size={16} />Mark skipped</button></>}</div></aside>;

  return <aside className="side-panel" aria-label="Add a session"><header><div><p className="eyebrow">NEW SESSION</p><h2>Add a session</h2></div><button className="icon-button" onClick={onClose} aria-label="Close panel"><X /></button></header><form onSubmit={create} className="session-form"><label>Session date<input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} required /></label><label>Run type<select value={templateId ? `template-${templateId}` : runType} onChange={(event) => selectRunType(event.target.value)}>{predefinedRunTypes.map((type) => <option key={type} value={type}>{type}</option>)}{templates.length > 0 && <optgroup label="Custom sessions">{templates.map((template) => <option key={template.id} value={`template-${template.id}`}>{template.name}</option>)}</optgroup>}</select></label><div className="field-row"><label>Target distance (km)<input type="number" min="0" step="0.1" value={distance} onChange={(event) => setDistance(event.target.value)} /></label><label>Target duration (mm:ss)<input value={duration} placeholder="45:00" onChange={(event) => setDuration(event.target.value)} /></label></div><div className="field-row"><label>Fast pace<input placeholder="5:00" value={paceLow} onChange={(event) => setPaceLow(event.target.value)} /></label><label>Easy pace<input placeholder="5:30" value={paceHigh} onChange={(event) => setPaceHigh(event.target.value)} /></label></div><label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Workout details or interval structure" /></label><button className="primary-action" type="submit">Add session</button></form></aside>;
}
