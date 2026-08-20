# Training Planner v2 Requirements

## 1. Purpose

Create a web application that enables an individual runner to manually build a race-focused training plan, record completed runs, and understand training adherence and progress. Version 2 is a local-first static site deployable through GitHub Pages; it does not require accounts, cloud services, a server-side API, or third-party activity integrations.

## 2. Product Scope

### 2.1 Users

- Primary user: an individual runner managing their own training.
- The application supports one active training plan at a time and retains archived plans for historical review.

### 2.2 Definitions

- **Goal**: a target race event attached to a training plan.
- **Plan**: a dated collection of planned training sessions with any length required by the runner.
- **Planned session**: a future or scheduled workout in the plan.
- **Completed run**: a manually recorded activity, linked to a planned session where applicable.
- **Unplanned run**: a completed activity recorded without a linked planned session.
- **Adherence**: completion of planned sessions; an unplanned run counts as a completed session in the headline adherence metric.

### 2.3 Success Criteria

- A runner can create a race goal and manually construct a plan of any practical duration.
- A runner can log actual outcomes, including partial and unplanned runs, without external integrations.
- The runner can immediately see whether training volume and session completion are on track.
- All entered data is still available when the runner returns using the same browser profile and site origin.

## 3. Functional Requirements

> **Status key:** ✅ Implemented · ⚠️ Changed · 🔶 Partial · ❌ Not implemented

### 3.1 Must Have

#### Goal and Plan Management

- **M-01** ✅: The application shall allow the runner to create a race goal with a name, race date, race distance, and optional target finish time.
- **M-02** ✅: The application shall offer standard race distances and allow a custom metric distance.  
  *Implemented: Race distance is a dropdown with 5K (5 km), 10K (10 km), Half Marathon (21.0975 km), and Marathon (42.195 km). Selecting Custom reveals a numeric input for a user-defined distance. Available on both the goal creation and edit plan forms.*
- **M-03** ✅: The application shall allow the runner to create a plan with a user-selected start date, end date, and length; plan length shall not be limited to fixed templates.
- **M-04** ⚠️: The application shall support one active plan and preserve prior plans as archives.  
  *Changed: When a new goal is created, the prior goal is set to inactive and retained as an archive — this path is implemented correctly. However, the Cancel Plan action permanently deletes the goal and all associated sessions and runs rather than archiving it.*
- **M-05** ✅: The application shall allow the runner to manually add a planned session to any date in the active plan.
- **M-06** ⚠️: The primary plan-management view shall be a weekly calendar showing sessions on their scheduled dates.  
  *Changed: Implemented as a monthly calendar view (C-04 promoted to primary). Navigation moves by month rather than by week.*
- **M-07** ✅: The application shall allow the runner to mark a planned session as skipped while retaining that decision in the plan history.
- **M-08** ✅: The application shall allow the runner to reschedule a planned session to another date.
- **M-09** 🔶: The application shall require confirmation before permanently deleting a completed run or plan.  
  *Partial: Confirmation is shown for cancel plan and when editing plan dates would remove sessions. Individual completed run deletion is not yet implemented (see M-19).*

#### Session Definition

- **M-10** ✅: The application shall allow the runner to define run types entirely according to their own terminology.
- **M-11** ✅: A planned session shall support a run type, target distance, target pace range, and optional notes.
- **M-12** ✅: The application shall support structured interval sessions with configurable warm-up, repeat, recovery, and cool-down segments.
- **M-13** ✅: Interval segments shall support their own target distance and/or pace range where applicable.
- **M-14** ✅: All distances, paces, and elevations in the initial release shall use metric units.

#### Activity Logging

- **M-15** ✅: The application shall let the runner complete a planned session by manually recording its actual outcome.
- **M-16** ✅: The application shall let the runner manually record an unplanned run.
- **M-17** ✅: A completed run shall capture date, distance, duration, average pace, perceived effort, average heart rate, maximum heart rate, elevation gain, and free-form notes; fields not known by the runner may be left blank except date, distance, and duration.
- **M-18** ⚠️: The application shall support partial completion by retaining the planned target and recording actual completed values separately.  
  *Changed: The planned target is displayed as context when logging a run, but there is no explicit partial-completion flag; actual values update the session state without a separate partial record.*
- **M-19** ❌: The application shall allow the runner to edit a completed run after it has been recorded.
- **M-20** ❌: For an interval session, the application shall support actual results for each interval or segment, including actual distance, duration, and pace where applicable.
- **M-21** ✅: The application shall derive average pace from distance and duration when both values are available and permit an appropriate displayed pace precision for metric running.

#### Dashboard and Metrics

- **M-22** ✅: The dashboard shall be the default screen when the application launches.
- **M-23** ✅: The dashboard shall prominently show planned versus completed distance by week.
- **M-24** ✅: The dashboard shall prominently show session completion status and a completion/adherence rate for the active plan.
- **M-25** ✅: The dashboard shall present a distance-over-time chart for logged activity.
- **M-26** ❌: The dashboard shall present an elevation-gain-over-time chart for logged activity when elevation data exists.
- **M-27** 🔶: The dashboard shall distinguish completed, skipped, and upcoming planned sessions.  
  *Partial: Session status is visually distinguished in the planner calendar. The dashboard surfaces only the next upcoming session; a full status breakdown is not shown.*
- **M-28** 🔶: The application shall record and display personal records for fastest times at standard distances, longest single run, and highest weekly distance.  
  *Partial: Longest single run and highest weekly distance are shown on the dashboard. Fastest times at standard distances (5K, 10K, half marathon, marathon) are not tracked.*
- **M-29** ❌: When an unplanned run is logged, it shall contribute to the headline session-completion metric and its contribution shall be understandable in the dashboard presentation.

#### Persistence and Platform

- **M-30** ✅: The application shall automatically persist all data locally without requiring a manual save action.
- **M-31** ✅: On reopening, the application shall restore all saved plans, goals, sessions, run types, completed runs, metrics, and settings.
- **M-32** ✅: The application shall run as a static web application in current Chrome, Edge, Firefox, and Safari browsers on supported desktop operating systems.
- **M-33** ✅: The application shall operate without a user account or internet connection for its core workflows.

#### Usability and Accessibility

- **M-34** ✅: The application shall provide a clean dashboard-oriented interface that makes key metrics, charts, and upcoming training easy to locate.
- **M-35** ✅: Interactive controls shall have clear labels or accessible names, and text and controls shall meet accessible color-contrast expectations.
- **M-36** ✅: The application shall provide user-selectable light and dark visual themes.

### 3.2 Should Have

- **S-01** ❌: The planner should allow a runner to copy or duplicate an existing session to reduce repetitive manual plan creation.
- **S-02** ✅: The weekly calendar should support navigation to previous and future weeks and visibly distinguish completed, skipped, upcoming, and rescheduled sessions.  
  *Note: Navigation operates by month rather than week, consistent with the M-06 change.*
- **S-03** ✅: The dashboard should show the active goal name, target date, target distance, optional target time, and days remaining.
- **S-04** ❌: Charts should offer sensible time windows, such as recent four weeks, current plan, and all history.
- **S-05** ❌: Personal-record calculations should be recalculated when an affected run is edited or deleted.  
  *Blocked by M-19 (edit completed run) not being implemented.*
- **S-06** 🔶: The application should validate implausible or incomplete entries, such as a zero distance, negative duration, or a goal date before the plan start date, with clear corrective messages.  
  *Partial: Zero distance and zero/negative duration are validated on run logging and session creation. Not all edge cases are covered.*
- **S-07** 🔶: The application should retain a visible association between a completed run and its planned workout, including planned-versus-actual values.  
  *Partial: Planned target values are shown as context in the log-run panel. The run log list does not display the linked planned session or a planned-versus-actual comparison.*
- **S-08** ✅: The application should provide empty states that guide a new runner toward creating a goal, plan, and first session.

### 3.3 Could Have

- **C-01** ❌: Export local data in a documented portable format such as JSON or CSV.
- **C-02** ❌: Import data previously exported from the application.
- **C-03** ❌: Create dated local backups and provide a restore workflow.
- **C-04** ⚠️: Support a monthly calendar or chronological list view alongside the weekly calendar.  
  *Changed: Implemented as the sole primary plan view rather than an optional addition alongside a weekly view (see M-06).*
- **C-05** ❌: Track equipment, routes, weather, or location details for logged runs.
- **C-06** ❌: Add target effort or heart-rate zones to planned sessions.
- **C-07** ❌: Add pace-trend charts for comparable distances.
- **C-08** ❌: Support keyboard-only navigation for all core workflows.
- **C-09** ❌: Provide a first-run guided setup for the first goal and plan.

### 3.4 Won't Have in the Initial Release

- **W-01**: Garmin, Strava, or other third-party activity integrations.
- **W-02**: Cloud synchronization, user accounts, authentication, or multi-device access.
- **W-03**: Coach workflows, athlete sharing, or multi-user collaboration.
- **W-04**: A mobile application.
- **W-05**: Automated generation or rebalancing of training plans.
- **W-06**: General-fitness, consistency, or non-race goal types.

### 3.5 Implemented Beyond Requirements

The following features were built but were not specified in the original requirements.

- **A-01**: **Session Builder** — A dedicated navigation section for creating and saving named reusable interval session templates. Templates can be selected when adding a session to the planner. This extends M-12/M-13 from per-session interval configuration to a reusable template library.
- **A-02**: **Drag-and-drop rescheduling** — Sessions in the monthly planner can be dragged and dropped onto any in-plan date as an alternative to the reschedule date input (M-08).
- **A-03**: **Edit Plan** — The active goal's name, dates, and distance can be edited after creation. Sessions outside the revised date range are removed with confirmation.
- **A-04**: **Cancel Plan** — A dedicated destructive action to permanently delete the active plan, its sessions, and associated runs. This is the current mechanism for the one-active-plan constraint in M-04 rather than archiving.
- **A-05**: **Legacy storage migration** — The application automatically migrates data from the earlier preview storage format to the current v2 schema on first load.

## 4. Key User Flows

### 4.1 Create a Plan

1. Runner creates a race goal and supplies its name, date, distance, and optional finish-time target.
2. Runner creates the associated plan and selects dates that define its length.
3. Runner creates any needed run types and adds sessions to the weekly calendar.
4. For each session, runner sets a target distance, pace range, and, for interval workouts, segment structure.

### 4.2 Record a Run

1. Runner selects a planned session or starts an unplanned-run entry.
2. Runner records actual data and, for intervals, results for individual segments.
3. Runner saves the completed run.
4. The application persists the result and refreshes adherence, volume, charts, and personal records.

### 4.3 Manage a Disrupted Week

1. Runner views the current week in the calendar.
2. Runner marks an unavailable session as skipped or moves it to another date.
3. The calendar and dashboard reflect the new status while retaining the original training history.

## 5. Non-Functional Requirements

- **N-01 Reliability**: The application shall write completed user changes to local storage before the application can be safely closed under normal operating conditions.
- **N-02 Data integrity**: Editing, skipping, rescheduling, archiving, and deletion shall update derived metrics consistently; permanently deleted records shall no longer be included in metrics.
- **N-03 Privacy**: Core data shall remain on the local device and shall not be transmitted to external services in the initial release.
- **N-04 Performance**: Common actions, including opening the dashboard, changing week, saving a run, and recalculating dashboard data, should complete without a perceptible delay for a personal training history.
- **N-05 Compatibility**: The application shall provide equivalent core functionality in the supported browsers and shall deploy correctly from a GitHub Pages project site path.
- **N-06 Visual quality**: Charts and key values shall remain readable at standard desktop browser viewport sizes and in both supported themes.

## 6. Data Model Baseline

| Entity | Required fields |
| --- | --- |
| Goal | identifier, name, race date, distance, optional target finish time, archive status |
| Plan | identifier, linked goal, start date, end date, active/archive status |
| Run type | identifier, user-defined name, optional display color |
| Planned session | identifier, plan, scheduled date, run type, target distance, pace range, notes, status |
| Interval segment | identifier, planned session, sequence, segment type, target distance, target pace range |
| Completed run | identifier, date, actual distance, actual duration, calculated pace, optional RPE/heart rate/elevation/notes, linked planned session when applicable |
| Completed interval result | identifier, completed run, planned segment when linked, sequence, actual distance, duration, calculated pace |

## 7. Assumptions Requiring Validation Before Design

- Standard race distances for personal records are expected to include at least 5K, 10K, half marathon, and marathon; the final list needs agreement.
- Average and maximum heart rate are optional inputs because manual entry may not always provide them.
- Perceived effort uses a runner-entered numeric scale; the scale, likely 1-10, should be confirmed during UX design.
- Target pace ranges apply to distance-based sessions and segments; duration-only workouts are deferred unless added to scope.
- An unplanned run counts as a completed session for the headline adherence metric, even though it is not a completion of a specific planned workout. The dashboard must make this policy visually clear to avoid misleading the runner.
- No import, export, or backup mechanism is in initial scope. Local persistence is therefore a release-critical dependency and data-loss expectations should be reviewed before implementation.

## 8. Release Acceptance Criteria

The initial release is acceptable when a runner can, on both Windows and macOS:

1. Create a custom-distance race goal with a date and optional target time.
2. Construct a manually scheduled, variable-length plan in a weekly calendar using runner-defined run types.
3. Configure distance, pace range, and structured intervals for planned sessions.
4. Complete, partially complete, edit, skip, reschedule, and manually add runs as defined in this document.
5. Close and reopen the application without losing entered data.
6. View weekly planned-versus-completed distance, completion status, distance history, elevation history, and required personal records on the launch dashboard.
7. Use the application in light or dark theme with readable, clearly labelled controls.

## 9. Product Experience and Interface Requirements

### 9.1 Experience Principles

- **UX-01**: The interface shall feel like a calm performance dashboard: focused, precise, and encouraging without being promotional or visually noisy.
- **UX-02**: The visual direction may take inspiration from Strava's athletic energy, strong typography, and high-contrast orange accent; it shall not copy Strava layouts, trademarks, logos, proprietary assets, or branded UI elements.
- **UX-03**: The product shall use balanced information density. Primary values and immediate actions are visible first; supporting details are available through progressive disclosure.
- **UX-04**: Every screen shall make one primary task clear and shall avoid nested cards or decorative panels that obscure hierarchy.
- **UX-05**: The application shall communicate run and session status using text and iconography in addition to color.

### 9.2 Application Shell and Navigation

- **UX-06**: The web application shall use a persistent left navigation sidebar at normal desktop browser widths.
- **UX-07**: The sidebar shall expose Dashboard, Planner, Run Log, Goals and Plan History, and Settings, with an icon, text label, current-page indication, and accessible name for each destination.
- **UX-08**: The sidebar shall include a clear primary action for logging a run that is available from all primary views.
- **UX-09**: The application header shall show the current view title and contextual actions without duplicating navigation.
- **UX-10**: The application shall open to the Dashboard.
- **UX-11**: At narrower supported window widths, the shell shall preserve access to all destinations through an adaptive compact navigation pattern without clipping content or controls.

### 9.3 Visual System

- **UX-12**: The visual system shall use a neutral light and dark foundation with an energetic orange-red accent for primary actions and important performance signals, following the intended Strava-inspired direction.
- **UX-13**: The implementation shall define semantic design tokens for background, surface, text, muted text, border, primary action, success, warning, error, and chart-series colors. Components shall consume tokens rather than hard-coded colors.
- **UX-14**: Typography shall use a contemporary sans-serif font with clear numeral forms and tabular numerals for times, distances, and pace where available. The chosen font must have an appropriate web-distribution license.
- **UX-15**: Numeric metrics shall be visually prioritised over supporting labels; units shall be visually secondary but remain legible.
- **UX-16**: Cards may frame individual metrics, chart groups, lists, and editor panels, but shall use restrained borders, shadows, and corner radii of no more than 8 px.
- **UX-17**: Charts shall use accessible labels, a readable legend where more than one series is shown, and an alternative text summary of the trend and values.
- **UX-18**: Light and dark themes shall initially follow the operating-system preference and allow the runner to override it in Settings. Theme preference shall persist locally.

### 9.4 Screen Layout Requirements

#### Dashboard

- **UX-19**: The first dashboard viewport at a normal desktop browser size shall show the active race goal and countdown, the next planned session, this week's planned-versus-completed distance, and recent activity.
- **UX-20**: The active-goal region shall show the goal name, race date, distance, optional target time, and a days-remaining value.
- **UX-21**: The next-session region shall show its date, run type, distance target, pace target when present, and a clear action to view or log the result.
- **UX-22**: The weekly-distance region shall compare planned and actual volume with labelled values, not only a visual bar or chart.
- **UX-23**: Recent activity shall list completed runs in reverse chronological order and expose enough information to distinguish date, type, distance, duration, and completion context.
- **UX-24**: Supporting dashboard content below the initial viewport shall include session adherence, planned-versus-completed distance history, distance-over-time, elevation-over-time when applicable, and personal records.
- **UX-25**: Charts shall reveal exact date and metric values through pointer hover and keyboard-accessible focus interaction.

#### Planner

- **UX-26**: The Planner shall present one week at a time in a seven-day calendar grid, with clearly labelled day and date headers.
- **UX-27**: Each calendar day shall provide an unambiguous add-session action.
- **UX-28**: A selected session shall open in a side detail panel that supports viewing and editing without losing calendar context.
- **UX-29**: The planner shall allow drag-and-drop rescheduling between days and shall provide an equivalent non-drag interaction for accessibility.
- **UX-30**: Rescheduling shall immediately show the destination date and require confirmation only where the move creates a conflict defined by product rules.
- **UX-31**: A session item shall display its run type, target distance, relevant pace target, and status without requiring the detail panel.
- **UX-32**: Status styling shall distinguish scheduled, completed, skipped, and rescheduled sessions using semantic text, icons, and color.

#### Run Log, Goals, and Settings

- **UX-33**: The Run Log shall present completed and unplanned activities in reverse chronological order, with a direct route to each activity's detail and edit view.
- **UX-34**: The Goals and Plan History view shall separate the active goal and plan from archived plans, and archived plans shall be viewable without being editable unless restored to active status in a future scope item.
- **UX-35**: Settings shall provide at least theme selection and a read-only indication that data is stored locally on the device.

### 9.5 Forms, Feedback, and States

- **UX-36**: Recording a run shall use a guided form with logical sections: session context, core outcome, optional health/performance data, interval results when applicable, and notes.
- **UX-37**: When recording a planned session, the form shall prefill the relevant date and planned targets while clearly separating planned values from actual values.
- **UX-38**: Required fields shall be labelled, validation shall appear inline adjacent to the affected field, and errors shall explain how to correct the value.
- **UX-39**: The application shall warn before discarding a changed form or unsaved session editor.
- **UX-40**: Destructive actions shall use a confirmation dialog that identifies the affected record and states that deletion is permanent.
- **UX-41**: Loading, empty, success, validation-error, and local-storage-error states shall be intentionally designed and must not leave the runner without an available next action.
- **UX-42**: A local save or read failure shall preserve entered form values in memory, show an actionable message, offer retry where appropriate, and write non-sensitive diagnostic information to a local log.

### 9.6 Accessibility and Responsive Behaviour

- **UX-43**: All core workflows shall be operable by keyboard, including navigation, adding/editing sessions, logging runs, selecting dates, rescheduling without drag-and-drop, and confirming dialogs.
- **UX-44**: Focus indicators shall be consistently visible and meet contrast requirements in both themes.
- **UX-45**: Controls, form inputs, charts, and calendar sessions shall expose meaningful semantic roles, names, values, and state to screen-reader technology.
- **UX-46**: The interface shall not rely on color alone for any meaning, including run status, form validity, chart series, or selected navigation item.
- **UX-47**: The application shall respect supported operating-system text scaling without overlapping, truncating, or hiding essential content.
- **UX-48**: The application shall remain usable in a resizable browser viewport; supported layouts shall adapt their columns and overflow predictably rather than shrinking controls or text below usable sizes.

### 9.7 Key Interaction Flows

#### First Plan Creation

1. Runner opens the empty dashboard and selects the prominent create-goal action.
2. Runner completes the goal form, then selects the plan dates.
3. The planner opens at the initial plan week with an accessible add-session action on each day.
4. Runner creates custom run types as needed and adds sessions through the side panel.
5. The dashboard updates to present the new goal, weekly volume, and next session.

#### Planned Run Completion

1. Runner selects the next session from the dashboard or planner and chooses to log the run.
2. The guided form opens with planned values visible and actual fields ready for entry.
3. Runner records the overall outcome and, when relevant, the result for each interval segment.
4. Inline validation prevents invalid values from being saved.
5. On successful save, a clear confirmation is shown and the dashboard, planner, records, and metrics update.

#### Unplanned Run Entry

1. Runner selects the persistent log-run action.
2. Runner chooses an unplanned run and enters actual results through the guided form.
3. The app identifies the activity as unplanned in the log and explains its contribution to headline adherence.

#### Reschedule or Skip

1. Runner locates a planned session in the weekly planner.
2. Runner moves it to another date through drag-and-drop or the accessible reschedule command, or marks it skipped from its detail panel.
3. The calendar, weekly volume, and adherence presentation update while retaining the revised session history.

## 10. Technical Implementation Requirements

### 10.1 Recommended Web Technology Baseline

- **T-01**: The implementation shall use React with TypeScript and Vite to produce a static web application. It shall not depend on Electron or Node.js APIs at runtime.
- **T-02**: The persistence mechanism shall be versioned browser local storage, scoped to the deployed site origin. It shall automatically preserve goals, sessions, templates, runs, and settings for the current browser profile.
- **T-03**: The product shall not implement a network backend, remote API, user identity service, cloud synchronization service, telemetry service, or server-side database in the initial release.
- **T-04**: A typed browser storage adapter is the local backend boundary. It shall own persistence, stored-state migration, validation, and recoverable storage errors; React views shall not access local storage directly.
- **T-05**: The frontend shall communicate with the browser storage adapter through typed, explicitly defined commands and responses.

### 10.2 Frontend Architecture

- **T-06**: The frontend shall separate route-level screens, reusable presentation components, application state, form handling, domain-oriented view models, and host-command clients.
- **T-07**: The frontend shall use a typed schema or equivalent type-safe contract for every form input, persisted entity, browser-storage command, and command response.
- **T-08**: The frontend shall use semantic HTML and native controls where practical. Custom controls shall be justified by a documented interaction need and shall match the accessibility requirements in this specification.
- **T-09**: All design tokens, theme definitions, spacing scales, typography styles, and component states shall be centralised in the frontend design system.
- **T-10**: Calendar, graph, and form controls shall have stable dimensions and responsive constraints so dynamic data does not cause disruptive layout shifts.
- **T-11**: Dashboard aggregates and personal records shall be rendered from derived application state returned by the domain layer rather than recomputed inconsistently by individual UI components.

### 10.3 Browser Persistence and Data Architecture

- **T-12**: The browser storage adapter shall separate persisted state access from domain services that manage plan status, schedule changes, validation, and metric calculation.
- **T-13**: Domain validation rules shall be centralised and enforced before browser state is committed. The frontend may provide immediate validation, but it shall not be the only enforcement point.
- **T-14**: A user change shall update a complete in-memory state snapshot and persist that snapshot as one browser storage write. Derived metrics shall be recalculated reliably from persisted state.
- **T-15**: Browser storage shall use versioned envelopes. Existing browser-stored state shall migrate forward without silent loss when the application schema changes.
- **T-16**: Dates and duration values shall use unambiguous, locale-independent storage formats. Presentation formatting shall occur in the frontend according to product rules.
- **T-17**: The application shall store only data necessary for its local functionality and shall keep diagnostic logs free of free-form run notes and other unnecessarily personal values.
- **T-18**: Startup shall detect unreadable or unavailable browser storage, preserve any recoverable values in memory, and show an actionable recovery message rather than silently starting with an empty data set.

### 10.4 Quality, Testing, and Packaging

- **T-19**: Automated unit tests shall cover calculation and domain rules, including pace calculation, weekly volume, adherence, personal records, validation, rescheduling, skipped sessions, archival, and persistence failure handling.
- **T-20**: The project shall maintain type checking, linting, formatting, and automated tests as repeatable build commands.
- **T-21**: A release candidate shall undergo manual smoke testing in current Chrome, Edge, Firefox, and Safari. The smoke test shall cover first plan creation, run logging, persistence after tab close and reopen, dashboard metrics, themes, and storage-error handling.
- **T-22**: Each release shall produce a static deployment artifact and release notes describing user-visible changes, browser support, and known limitations.
- **T-23**: GitHub Actions shall build and deploy the static artifact to GitHub Pages from the default branch. The build shall use the repository name as the project-site base path.
- **T-24**: Automatic updates, update checks, code signing, user accounts, and cross-device synchronization are outside the initial release requirement; deployment must still provide clear version information for support and testing.

## 11. Additional Acceptance Criteria

The visual, interaction, and implementation requirements are acceptable when:

1. A runner can complete each key interaction flow in Section 9.7 using the displayed controls in a supported browser, and can complete the core workflows without drag-and-drop using the keyboard.
2. The first dashboard viewport contains the goal countdown, next session, weekly distance progress, and recent activity at a normal desktop window size.
3. Planned and actual values are visibly distinguished while logging a planned session, and invalid entries are explained inline without losing entered values.
4. Light and dark themes follow the system by default, respect a saved user override, and keep status and chart meaning understandable without color alone.
5. The app operates correctly in a resizable browser viewport with text scaling enabled, and a screen reader can identify navigation, controls, form fields, session status, and chart summaries.
6. The deployed GitHub Pages site passes the defined smoke test in the supported browsers.
7. A tab close and reopen restores local data for the same browser profile and site origin, and a simulated local-save failure preserves unsaved input and presents an actionable error.

## 12. Version 2 Web Migration Plan

1. Replace the Electron runtime and SQLite command path with the existing typed browser storage adapter while retaining the React screen, component, domain, and command contracts.
2. Store a versioned state envelope in browser local storage and migrate the prior browser-preview key to the v2 key. Existing browser data keeps optional recovery enabled by default.
3. Remove desktop packaging dependencies and scripts; use Vite for local development and static production builds.
4. Configure Vite with a deploy-time base path and deploy `dist/` through GitHub Pages Actions from the default branch.
5. Validate the production bundle at its project-site path, then smoke test all existing workflows and both themes in the supported browsers.
6. Treat v1 Electron SQLite data as a separate migration decision: a static website cannot read the desktop application-data database directly. Until a v1 export/import utility is delivered, v2 starts with browser-local data.
