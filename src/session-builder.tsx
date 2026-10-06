import React, { useState } from "react";
import { CopyPlus, Footprints, GripVertical, Pause, Pencil, Plus, SkipForward, Timer, Trash2, Wind, X } from "lucide-react";
import { calculateTemplateTargets, formatDuration } from "./domain";
import type { PlannerState, RepeatSubSegment, SegmentType, Session, SessionInput, SessionTemplate, SessionTemplateInput, SessionTemplateSegment } from "./types";

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
    repeat: { repeat_count: 4, children: [{ id: 1, position: 0, distance_km: 0.4, duration_seconds: null, target_pace: "4:30", rest_distance_km: 0.2, rest_duration_seconds: null, rest_pace: "7:00", include_recovery: 1 }] },
    rest: { distance_km: 0.2, target_pace: "7:00" },
    cooldown: { distance_km: 1, target_pace: "6:15" },
  };
  return { id: position + 1, position, segment_type: segmentType, distance_km: null, duration_seconds: null, target_pace: null, repeat_count: null, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null, ...defaults[segmentType] };
}

function segmentDescription(segment: SessionTemplateSegment): string {
  if (segment.segment_type === "repeat" && segment.children?.length) {
    const runs = segment.children.map((child) => child.distance_km ? `${child.distance_km} km` : formatDurationInput(child.duration_seconds) || "?").join(" + ");
    return `${segment.repeat_count || 1} × (${runs})`;
  }
  const target = segment.distance_km ? `${segment.distance_km} km` : formatDurationInput(segment.duration_seconds);
  if (segment.segment_type !== "repeat") return target || "No target";
  if (segment.include_recovery === 0) return `${segment.repeat_count || 1} x ${target}`;
  const rest = segment.rest_distance_km ? `${segment.rest_distance_km} km rest` : formatDurationInput(segment.rest_duration_seconds) ? `${formatDurationInput(segment.rest_duration_seconds)} rest` : "no rest target";
  return `${segment.repeat_count || 1} x ${target} with ${rest}`;
}

function targetText(distanceKm: number | null, durationSeconds: number | null, pace: string | null): string {
  const target = distanceKm ? `${distanceKm} km` : formatDurationInput(durationSeconds) || "No target";
  return pace ? `${target} @ ${pace}/km` : target;
}

function restText(item: { rest_distance_km: number | null; rest_duration_seconds: number | null; rest_pace: string | null; include_recovery?: number }): string | null {
  if (item.include_recovery === 0) return null;
  if (!item.rest_distance_km && !item.rest_duration_seconds) return null;
  return `${targetText(item.rest_distance_km, item.rest_duration_seconds, item.rest_pace)} recovery`;
}

export function SegmentBreakdown({ segments }: { segments: SessionTemplateSegment[] }) {
  return <div className="segment-breakdown"><h3>Workout structure</h3><ol>{segments.map((segment, index) => {
    if (segment.segment_type === "repeat") {
      const items = segment.children?.length ? segment.children : [segment];
      return <li key={index} className={segment.segment_type}><strong>{segmentLabels.repeat} × {segment.repeat_count || 1}</strong><ul>{items.map((item, itemIndex) => <li key={itemIndex}>{targetText(item.distance_km, item.duration_seconds, item.target_pace)}{restText(item) && <span>{restText(item)}</span>}</li>)}</ul></li>;
    }
    return <li key={index} className={segment.segment_type}><strong>{segmentLabels[segment.segment_type]}</strong><span>{targetText(segment.distance_km, segment.duration_seconds, segment.target_pace)}</span></li>;
  })}</ol></div>;
}

export function SessionBuilderView({ state, onState, onError }: { state: PlannerState; onState: (state: PlannerState) => void; onError: (message: string) => void }) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [segments, setSegments] = useState<SessionTemplateSegment[]>([newSegment("warmup", 0), newSegment("repeat", 1), newSegment("cooldown", 2)]);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  // Changing this remounts the segment editors so their local target-mode state matches the loaded data.
  const [formVersion, setFormVersion] = useState(0);

  function resetForm() {
    setEditingId(null);
    setName("");
    setNotes("");
    setSegments([newSegment("warmup", 0), newSegment("repeat", 1), newSegment("cooldown", 2)]);
    setFormVersion((version) => version + 1);
  }

  function startEditTemplate(template: SessionTemplate) {
    setFormError("");
    setEditingId(template.id);
    setName(template.name);
    setNotes(template.notes || "");
    setSegments(template.segments.map((segment) => ({ ...segment, children: segment.children?.map((child) => ({ ...child })) })));
    setFormVersion((version) => version + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteTemplate(template: SessionTemplate) {
    if (!window.confirm(`Delete the saved session "${template.name}"? Sessions already added to the planner are not affected.`)) return;
    try {
      onState(await window.trainingPlanner.deleteSessionTemplate(template.id));
      if (editingId === template.id) resetForm();
    } catch (error) {
      onError(error instanceof Error ? error.message : "The session template could not be deleted.");
    }
  }

  function updateSegment(index: number, changes: Partial<SessionTemplateSegment>) {
    setSegments((current) => current.map((segment, segmentIndex) => segmentIndex === index ? { ...segment, ...changes } : segment));
  }

  function moveSegment(fromIndex: number, toIndex: number) {
    setSegments((current) => {
      if (toIndex < 0 || toIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((segment, position) => ({ ...segment, position }));
    });
  }

  async function saveTemplate(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    const input: SessionTemplateInput = { name, notes, segments: segments.map((segment, position) => ({ ...segment, position })) };
    try {
      onState(editingId === null ? await window.trainingPlanner.createSessionTemplate(input) : await window.trainingPlanner.updateSessionTemplate({ ...input, id: editingId }));
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The session template could not be saved.";
      setFormError(message);
      onError(message);
    }
  }

  const targets = calculateTemplateTargets(segments);
  const distanceExclRecovery = segments.reduce((total, seg) => {
    if (seg.segment_type === "repeat" && seg.children?.length) {
      const repeatCount = Number(seg.repeat_count || 1);
      return total + seg.children.reduce((sum, child) => sum + Number(child.distance_km || 0), 0) * repeatCount;
    }
    const multiplier = seg.segment_type === "repeat" ? Number(seg.repeat_count || 1) : 1;
    return total + Number(seg.distance_km || 0) * multiplier;
  }, 0);

  return <section className="session-builder">
    <div className="list-header"><div><p className="eyebrow">REUSABLE WORKOUTS</p><h2>Session Builder</h2><p>Build a custom structured session and reuse throughout your plans.</p></div></div>
    <div className="builder-layout">
      <form className="builder-form" onSubmit={saveTemplate}>
        <div className="field-row"><label>Session name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="6 x 400 m intervals" required /></label><label><span>Notes <span className="optional">Optional</span></span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Hard but controlled" /></label></div>
        <div className="builder-heading"><div><h3>Workout segments</h3><p>Repeat segments include their configured recovery on every repetition.</p></div><div className="segment-actions">{(["warmup", "repeat", "rest", "cooldown"] as SegmentType[]).map((type) => <button key={type} type="button" className="add-segment" onClick={() => setSegments((current) => [...current, newSegment(type, current.length)])}><Plus size={14} />{segmentLabels[type]}</button>)}</div></div>
        <ol className="segment-list">{segments.map((segment, index) => <SegmentEditor key={`${formVersion}-${segment.id}-${index}`} index={index} segment={segment} onChange={(changes) => updateSegment(index, changes)} onDrop={(fromIndex) => moveSegment(fromIndex, index)} onRemove={() => setSegments((current) => current.filter((_, segmentIndex) => segmentIndex !== index).map((item, position) => ({ ...item, position })))} canRemove={segments.length > 1} />)}</ol>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <button className="primary-action" type="submit"><CopyPlus size={17} />{editingId === null ? "Save reusable session" : "Update reusable session"}</button>
        {editingId !== null && <button className="secondary-action" type="button" onClick={resetForm}>Cancel editing</button>}
      </form>
      <aside className="template-library" aria-label="Saved session templates"><h3>Saved sessions</h3>{state.templates.length ? <ul>{state.templates.map((template) => <li key={template.id} className="template-item"><div><strong>{template.name}</strong><span>{template.segments.map(segmentDescription).join(" · ")}</span></div><div className="run-actions"><button type="button" className="icon-button" onClick={() => startEditTemplate(template)} aria-label={`Edit ${template.name}`}><Pencil size={15} /></button><button type="button" className="icon-button" onClick={() => deleteTemplate(template)} aria-label={`Delete ${template.name}`}><Trash2 size={15} /></button></div></li>)}</ul> : <p>No reusable sessions yet.</p>}</aside>
    </div>
    <div className="builder-footer">
      <p>Total distance: {distanceExclRecovery.toFixed(2)} km (excluding recoveries){targets.durationSeconds ? ` · Total time: ~${formatDuration(targets.durationSeconds)}` : ""}</p>
    </div>
  </section>;
}

function SegmentEditor({ index, segment, onChange, onDrop, onRemove, canRemove }: { index: number; segment: SessionTemplateSegment; onChange: (changes: Partial<SessionTemplateSegment>) => void; onDrop: (fromIndex: number) => void; onRemove: () => void; canRemove: boolean }) {
  const [targetMode, setTargetMode] = useState<"distance" | "duration">(segment.duration_seconds && !segment.distance_km ? "duration" : "distance");
  const [dragOver, setDragOver] = useState(false);
  const isRepeat = segment.segment_type === "repeat";

  function changeTargetMode(mode: "distance" | "duration") {
    setTargetMode(mode);
    onChange(mode === "distance" ? { duration_seconds: null } : { distance_km: null });
  }

  function addChild() {
    const children = segment.children || [];
    const child: RepeatSubSegment = { id: children.length + 1, position: children.length, distance_km: 0.4, duration_seconds: null, target_pace: "4:30", rest_distance_km: 0.2, rest_duration_seconds: null, rest_pace: "7:00", include_recovery: 1 };
    onChange({ children: [...children, child] });
  }

  function updateChild(i: number, changes: Partial<RepeatSubSegment>) {
    onChange({ children: (segment.children || []).map((c, idx) => idx === i ? { ...c, ...changes } : c) });
  }

  function removeChild(i: number) {
    onChange({ children: (segment.children || []).filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, id: idx + 1, position: idx })) });
  }

  return <li
    className={`segment-editor ${segment.segment_type}${dragOver ? " drag-over" : ""}`}
    draggable
    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))}
    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
    onDragLeave={() => setDragOver(false)}
    onDrop={(e) => { e.preventDefault(); setDragOver(false); const from = Number(e.dataTransfer.getData("text/plain")); if (from !== index) onDrop(from); }}
  >
    <div className="segment-toolbar">
      <div className="segment-toolbar-left"><span className="drag-handle" aria-hidden="true"><GripVertical size={15} /></span><span className={`segment-kind ${segment.segment_type}`}>{segmentIcons[segment.segment_type]}{segmentLabels[segment.segment_type]}</span></div>
      <div className="segment-toolbar-right">
        {isRepeat && <label className="repeats-inline">Repeats<input type="number" min="1" value={segment.repeat_count || ""} onChange={(e) => onChange({ repeat_count: e.target.value ? Number(e.target.value) : null })} /></label>}
        <button type="button" onClick={onRemove} disabled={!canRemove} aria-label="Remove segment"><Trash2 size={15} /></button>
      </div>
    </div>
    {isRepeat ? (
      <>
        <ol className="repeat-children">
          {(segment.children || []).map((child, i) => <RepeatChildEditor key={`${child.id}-${i}`} child={child} onChange={(changes) => updateChild(i, changes)} onRemove={() => removeChild(i)} canRemove={(segment.children || []).length > 1} />)}
        </ol>
        <button type="button" className="add-repeat-child" onClick={addChild}><Plus size={13} />Add run</button>
      </>
    ) : (
      <div className="segment-fields">
        <label>Type<select value={targetMode} onChange={(event) => changeTargetMode(event.target.value as "distance" | "duration")}><option value="distance">Distance</option><option value="duration">Duration</option></select></label>
        {targetMode === "distance" ? <label>Distance<div className="input-with-unit"><input type="number" min="0" step="0.1" value={segment.distance_km ?? ""} onChange={(event) => onChange({ distance_km: event.target.value ? Number(event.target.value) : null })} /><span className="input-unit">km</span></div></label> : <label>Duration<div className="input-with-unit"><input value={formatDurationInput(segment.duration_seconds)} placeholder="05:00" onChange={(event) => onChange({ duration_seconds: parseDuration(event.target.value) })} /><span className="input-unit">mm:ss</span></div></label>}
        <label>Pace<div className="input-with-unit"><input value={segment.target_pace || ""} placeholder="5:30" onChange={(event) => onChange({ target_pace: event.target.value || null })} /><span className="input-unit">/km</span></div></label>
      </div>
    )}
  </li>;
}

function RepeatChildEditor({ child, onChange, onRemove, canRemove }: { child: RepeatSubSegment; onChange: (changes: Partial<RepeatSubSegment>) => void; onRemove: () => void; canRemove: boolean }) {
  const [targetMode, setTargetMode] = useState<"distance" | "duration">(child.duration_seconds && !child.distance_km ? "duration" : "distance");
  const [recoveryMode, setRecoveryMode] = useState<"distance" | "duration">(child.rest_duration_seconds && !child.rest_distance_km ? "duration" : "distance");
  const includesRecovery = child.include_recovery !== 0;

  function changeTargetMode(mode: "distance" | "duration") {
    setTargetMode(mode);
    onChange(mode === "distance" ? { duration_seconds: null } : { distance_km: null });
  }

  function changeRecoveryMode(mode: "distance" | "duration") {
    setRecoveryMode(mode);
    onChange(mode === "distance" ? { rest_duration_seconds: null } : { rest_distance_km: null });
  }

  return (
    <li className="repeat-child">
      <div className="segment-fields">
        <label>Type<select value={targetMode} onChange={(e) => changeTargetMode(e.target.value as "distance" | "duration")}><option value="distance">Distance</option><option value="duration">Duration</option></select></label>
        {targetMode === "distance" ? <label>Distance<div className="input-with-unit"><input type="number" min="0" step="0.1" value={child.distance_km ?? ""} onChange={(e) => onChange({ distance_km: e.target.value ? Number(e.target.value) : null })} /><span className="input-unit">km</span></div></label> : <label>Duration<div className="input-with-unit"><input value={formatDurationInput(child.duration_seconds)} placeholder="05:00" onChange={(e) => onChange({ duration_seconds: parseDuration(e.target.value) })} /><span className="input-unit">mm:ss</span></div></label>}
        <label>Pace<div className="input-with-unit"><input value={child.target_pace || ""} placeholder="4:30" onChange={(e) => onChange({ target_pace: e.target.value || null })} /><span className="input-unit">/km</span></div></label>
        <button type="button" className="remove-child" onClick={onRemove} disabled={!canRemove} aria-label="Remove run"><Trash2 size={14} /></button>
      </div>
      <label className="recovery-toggle"><input type="checkbox" checked={includesRecovery} onChange={(e) => onChange(e.target.checked ? { include_recovery: 1 } : { include_recovery: 0, rest_distance_km: null, rest_duration_seconds: null, rest_pace: null })} />Include recovery</label>
      {includesRecovery && <div className="recovery-fields recovery-fields--block"><label>Type<select value={recoveryMode} onChange={(e) => changeRecoveryMode(e.target.value as "distance" | "duration")}><option value="distance">Distance</option><option value="duration">Duration</option></select></label>{recoveryMode === "distance" ? <label>Distance<div className="input-with-unit"><input type="number" min="0" step="0.1" value={child.rest_distance_km ?? ""} onChange={(e) => onChange({ rest_distance_km: e.target.value ? Number(e.target.value) : null })} /><span className="input-unit">km</span></div></label> : <label>Duration<div className="input-with-unit"><input value={formatDurationInput(child.rest_duration_seconds)} placeholder="01:00" onChange={(e) => onChange({ rest_duration_seconds: parseDuration(e.target.value) })} /><span className="input-unit">mm:ss</span></div></label>}<label>Pace<div className="input-with-unit"><input value={child.rest_pace || ""} placeholder="7:00" onChange={(e) => onChange({ rest_pace: e.target.value || null })} /><span className="input-unit">/km</span></div></label></div>}
    </li>
  );
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
    if (!template) {
      if (templateId) { setDistance(""); setDuration(""); setNotes(""); }
      setTemplateId(null); setRunType(value); return;
    }
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

  const selectedTemplate = templateId ? templates.find((candidate) => candidate.id === templateId) : undefined;
  const sessionTemplate = session?.template_id ? templates.find((candidate) => candidate.id === session.template_id) : undefined;

  if (session) return <aside className="side-panel" aria-label="Session details"><header><div><p className="eyebrow">SESSION DETAIL</p><h2>{session.run_type}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close panel"><X /></button></header><div className="session-detail"><dl><div><dt>Target distance</dt><dd>{session.target_distance_km ? `${session.target_distance_km} km` : "Not set"}</dd></div><div><dt>Target duration</dt><dd>{formatDurationInput(session.target_duration_seconds)}</dd></div><div><dt>Pace range</dt><dd>{session.pace_low ? `${session.pace_low} - ${session.pace_high}/km` : "Not set"}</dd></div><div><dt>Status</dt><dd className="capitalize">{session.status}</dd></div></dl>{sessionTemplate && <SegmentBreakdown segments={sessionTemplate.segments} />}{session.notes && <p className="notes">{session.notes}</p>}<label>Reschedule date<input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></label><button className="secondary-action" onClick={reschedule}>Reschedule</button>{session.status !== "completed" && session.status !== "skipped" && <><button className="primary-action" onClick={() => onLog(session)}>Log result</button><button className="skip-action" onClick={skip}><SkipForward size={16} />Mark skipped</button></>}</div></aside>;

  return <aside className="side-panel" aria-label="Add a session"><header><div><p className="eyebrow">NEW SESSION</p><h2>Add a session</h2></div><button className="icon-button" onClick={onClose} aria-label="Close panel"><X /></button></header><form onSubmit={create} className="session-form"><label>Session date<input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} required /></label><label>Run type<select value={templateId ? `template-${templateId}` : runType} onChange={(event) => selectRunType(event.target.value)}>{predefinedRunTypes.map((type) => <option key={type} value={type}>{type}</option>)}{templates.length > 0 && <optgroup label="Custom sessions">{templates.map((template) => <option key={template.id} value={`template-${template.id}`}>{template.name}</option>)}</optgroup>}</select></label>{selectedTemplate ? <div className="session-detail"><dl><div><dt>Total distance</dt><dd>{distance ? `${distance} km` : "Not set"}</dd></div><div><dt>Total duration</dt><dd>{duration || "Not set"}</dd></div></dl><SegmentBreakdown segments={selectedTemplate.segments} />{selectedTemplate.notes && <p className="notes">{selectedTemplate.notes}</p>}</div> : <><div className="field-row"><label>Target distance (km)<input type="number" min="0" step="0.1" value={distance} onChange={(event) => setDistance(event.target.value)} /></label><label>Target duration (mm:ss)<input value={duration} placeholder="45:00" onChange={(event) => setDuration(event.target.value)} /></label></div><div className="field-row"><label>Fast pace<input placeholder="5:00" value={paceLow} onChange={(event) => setPaceLow(event.target.value)} /></label><label>Easy pace<input placeholder="5:30" value={paceHigh} onChange={(event) => setPaceHigh(event.target.value)} /></label></div><label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Workout details or interval structure" /></label></>}<button className="primary-action" type="submit">Add session</button></form></aside>;
}
