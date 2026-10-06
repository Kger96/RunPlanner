import { useEffect, useState } from "react";
import { Activity, CalendarDays, Dumbbell, Flag, Settings, Trophy } from "lucide-react";
import type { PlannerState, Theme } from "./types";
import { DashboardView, GoalHistoryView, RunLogView } from "./views";
import { PlannerView } from "./planner-calendar";
import { SessionBuilderView } from "./session-builder";

type View = "Dashboard" | "Planner" | "Session builder" | "Run log" | "Goals & history" | "Settings";

const emptyState: PlannerState = { activeGoal: null, goals: [], sessions: [], templates: [], runs: [], theme: "system" };
const navItems: { label: View; icon: typeof Activity }[] = [
  { label: "Dashboard", icon: Activity },
  { label: "Planner", icon: CalendarDays },
  { label: "Session builder", icon: Dumbbell },
  { label: "Run log", icon: Trophy },
  { label: "Goals & history", icon: Flag },
  { label: "Settings", icon: Settings },
];

export default function App() {
  const [state, setState] = useState<PlannerState>(emptyState);
  const [view, setView] = useState<View>("Dashboard");
  const [error, setError] = useState("");
  const [openRunEntry, setOpenRunEntry] = useState(false);

  useEffect(() => {
    window.trainingPlanner.getState().then(setState).catch(() => setError("Your local training data could not be opened. Restart the app and try again."));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  async function setTheme(theme: Theme) {
    try { setState(await window.trainingPlanner.setTheme(theme)); } catch { setError("Theme preference could not be saved."); }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand"><span className="brand-mark">TP</span><span>Training<br />Planner</span></div>
        <nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={view === label ? "nav-item active" : "nav-item"} onClick={() => setView(label)}><Icon size={18} aria-hidden="true" />{label}</button>)}</nav>
        <button className="log-run" onClick={() => { setView("Run log"); setOpenRunEntry(true); }}>Log a run</button>
        <p className="local-note">Local data only</p>
      </aside>
      <section className="workspace">
        <header className="topbar"><div><p className="eyebrow">RUNNING TRAINING</p><h1>{view}</h1></div><span className="status-dot">Saved locally</span></header>
        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
        {view === "Dashboard" && <DashboardView state={state} onState={setState} onPlanner={() => setView("Planner")} />}
        {view === "Planner" && <PlannerView state={state} onState={setState} onError={setError} />}
        {view === "Session builder" && <SessionBuilderView state={state} onState={setState} onError={setError} />}
        {view === "Run log" && <RunLogView state={state} onState={setState} onError={setError} openEntry={openRunEntry} onEntryOpened={() => setOpenRunEntry(false)} />}
        {view === "Goals & history" && <GoalHistoryView state={state} onCreate={() => setView("Dashboard")} onState={setState} onError={setError} />}
        {view === "Settings" && <SettingsView theme={state.theme} onTheme={setTheme} />}
      </section>
    </main>
  );
}

function SettingsView({ theme, onTheme }: { theme: Theme; onTheme: (theme: Theme) => void }) { return <section className="settings-view"><h2>Appearance</h2><p>Choose how Training Planner looks on this device.</p><div className="theme-options">{(["system", "light", "dark"] as Theme[]).map((option) => <label key={option}><input type="radio" name="theme" checked={theme === option} onChange={() => onTheme(option)} />{option[0].toUpperCase() + option.slice(1)}</label>)}</div><h2>Local storage</h2><p>Training Planner stores your data only on this device.</p></section>; }