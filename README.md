# Training Planner

Training Planner v2 is a local-first web application for runners who want to create a race-focused training plan, schedule workouts, record completed runs, and follow plan progress without an account or third-party activity connection.

The application is built with React, TypeScript, and Vite, and is designed for static deployment through GitHub Pages. Data remains in browser local storage on the current browser profile and site origin.

## Capabilities

- Create one active race goal with a plan start date, race date, metric distance, and optional target time.
- View plan and completed distance across the active plan date range on the dashboard.
- Schedule and manage runs in a weekly calendar bounded by the active plan dates.
- Create sessions using defined run types: `Easy`, `Long`, `Tempo`, `Interval`, and `Race`.
- Build reusable custom workouts in the Session Builder and schedule them from the Planner.
- Define structured workouts from warm-up, repeat, rest, and cool-down segments.
- Configure segment pace and a distance or duration target; repeat segments include a repeat count and recovery target.
- Log planned or unplanned runs with actual distance, duration, perceived effort, heart rate, elevation, and notes.
- Mark sessions completed or skipped, and reschedule them within the plan period.
- Store goals, plans, sessions, templates, runs, and theme preferences locally.

## Dashboard

The Dashboard opens by default and provides an at-a-glance view of the active plan:

- Active goal name, target distance, and optional target finish time.
- Weekly planned-versus-completed distance.
- Plan Status: a completion bar plus integer counts of completed and remaining planned runs.
- Personal distance milestones: longest run and highest weekly volume.
- `Plan distance` chart comparing planned and completed distance from plan start through race date.
- Next planned session and recent run activity.

## Main Workflows

### Create a plan

1. Open the Dashboard and create a goal.
2. Set a plan start date, race date, and metric target distance.
3. Open the Planner and add sessions to available plan dates.
4. Select a defined run type or a reusable custom session template.

### Build a reusable workout

1. Open **Session builder** from the sidebar.
2. Name the session and add warm-up, repeat, rest, or cool-down segments.
3. Set each segment's distance or duration and target pace.
4. For repeat segments, set the repeat count and recovery target.
5. Save the template, then select it from the Planner's Run type list.

### Record a run

1. Open a planned session and select **Log result**, or select **Log a run** for an unplanned activity.
2. Enter actual distance and duration, then optional effort, heart-rate, elevation, and notes.
3. Save the run to update the Planner and Dashboard metrics.

## Usability and Accessibility

- Persistent sidebar navigation provides access to Dashboard, Planner, Session Builder, Run Log, Goals and History, and Settings.
- The Planner disables navigation before the plan start week and after the race week.
- Days outside the plan date range cannot accept new or rescheduled sessions.
- Forms use labelled controls, inline validation, and destructive-action confirmation.
- Sessions are visually identified by scheduled, completed, skipped, and rescheduled states.
- Drag-and-drop rescheduling has an equivalent date-based reschedule control in the session detail panel.
- The interface supports light, dark, and system themes, with the choice saved locally.
- Status, charts, and controls use labels as well as colour to communicate meaning.

## Technology

| Area | Dependency / Tool | Purpose |
| --- | --- | --- |
| Frontend | React and TypeScript | Typed user interface and application state. |
| Build tooling | Vite | Frontend development server and production bundle. |
| Local persistence | Browser local storage | Versioned local state, migration, and automatic saves. |
| Charts | Recharts | Plan-versus-completed distance visualisation. |
| Icons | Lucide React | Accessible interface icons. |
| Tests | Vitest | Domain calculation and date-range tests. |
| Deployment | GitHub Pages Actions | Static production deployment. |

## Requirements

- Node.js 22 or later is recommended.
- npm is used for dependency installation and scripts.
- Windows development may require using `npm.cmd` when PowerShell script execution prevents `npm` from running directly.

Install dependencies:

```powershell
npm.cmd install
```

## Development

Start the Vite web application:

```powershell
npm.cmd run dev
```

Run checks:

```powershell
npm.cmd run typecheck
npm.cmd test
```

Build the static production site:

```powershell
npm.cmd run build
```

Vite writes the deployable static site to `dist/`.

## Deployment

The repository includes a GitHub Pages workflow at [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml). Enable GitHub Actions as the repository's Pages source, then push to `main`. The workflow builds the site with the repository name as its project-site base path and deploys `dist/`.

For a custom domain or another static host, set the base path before building:

```powershell
$env:VITE_BASE_PATH = "/"
npm.cmd run build
```

## Local Data and Privacy

- Core workflows operate without accounts, telemetry, cloud synchronization, or a server-side API after the site has loaded.
- The app automatically saves through a typed browser-storage command layer.
- Data is scoped to the current browser profile and site origin. Clearing browser site data or opening a different browser creates a separate local data set.
- Browser-preview data is migrated to the v2 storage key on first use. Existing Electron SQLite data requires a separate export/import migration utility and is not imported automatically.

## Current Scope

The MVP is designed for a single runner managing one active race plan at a time. Garmin, Strava, other activity-sync integrations, accounts, cloud sync, coaching collaboration, and a mobile client are intentionally out of scope.

See [REQUIREMENTS.md](REQUIREMENTS.md) for the full product specification and [Bugs.md](Bugs.md) for tracked implementation work.
