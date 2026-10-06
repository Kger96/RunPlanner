# Bug Log

## BUG-20261006-002: Logging a run with a duration of 1 hour or more produces an incorrect duration and pace

- **Reported:** 2026-10-06
- **Severity:** High
- **Status:** Resolved
- **Area:** Log a run (duration entry)
- **Environment:** Not provided
- **Impact:** Runners completing an activity lasting 1 hour or longer cannot log the correct duration; the saved duration and resulting pace are wrong, affecting activity history and pace-based metrics.

### Summary
The "Log a run" duration field only parses a `minutes:seconds` pair: `save()` in `RunEntryPanel` does `const [minutes, seconds = "0"] = duration.split(":")`, which only reads the first two colon-separated parts. If a user enters a hours-style value (e.g. `1:00:00` for one hour), the extra segment is silently ignored and the value is misread as `1` minute `00` seconds, producing a `durationSeconds` far shorter than actual. This in turn makes `formatPace`/`formatDuration`-derived pace calculations incorrect. There is no input affordance or validation indicating hours are unsupported.

### Steps to Reproduce
1. Open "Log a run" (or complete a planned session).
2. Enter a distance and set Duration to a value representing 1 hour or more (e.g. `1:00:00`).
3. Save the run and observe the recorded duration and calculated pace.

### Expected Behaviour
Entering a duration of 1 hour or more should be supported and result in the correct total duration being saved, with pace calculated from the correct value.

### Actual Behaviour
Durations of 1 hour or more are misparsed, producing an incorrect (much shorter) saved duration and an incorrect pace.

### Evidence
- User report: "When logging an activity it should be possible to enter a duration longer than 59min 59sec. Currently that is the limit and if I enter 1hr or above then this affects the pace calculation etc."
- Code reference: [views.tsx](src/views.tsx#L273) (`const [minutes, seconds = "0"] = duration.split(":")` only handles two segments; a third segment for hours is dropped).
- Code reference: [domain.ts](src/domain.ts#L58) (`formatPace` divides the resulting, potentially incorrect, `durationSeconds` by distance).

### Triage Notes
- Reproducibility: Always (for any duration entered in an hours-inclusive format)
- Workaround: None known
- Suspected cause: `RunEntryPanel.save()` split the value on `:` and only read the first two parts.
- Missing information: None
- Resolution: Added shared `parseRunDuration` in `src/domain.ts` (accepts `m`, `mm:ss`, `h:mm:ss`; rejects malformed values and minutes/seconds above 59 when more than one part is given). `RunEntryPanel.save()` now uses it; label, placeholder and error text updated to mention hours. A bare number is treated as minutes.
- Validation: Added unit tests in `src/domain.test.ts`; `npx tsc --noEmit` and `npx vitest run` pass (9 tests).

## BUG-20261006-001: Logged activities cannot be edited or deleted after being recorded

- **Reported:** 2026-10-06
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Activity History / Run Log
- **Environment:** Not provided
- **Impact:** Runners who log an activity with incorrect information (e.g. wrong date, distance, duration) cannot correct or remove it; the mistake permanently remains in the planner/activity history.

### Summary
The Activity History list (`RunLogView`) renders each logged run as a static `<li>` with no click, edit, or delete control, and there is no update/delete method for runs (`logRun` only creates new entries; no `editRun`/`updateRun`/`deleteRun` API exists). Once a run is logged, its details cannot be changed or removed.

### Steps to Reproduce
1. Log an activity with an incorrect value (e.g. wrong date or distance).
2. Open the Activity History (Run Log) list.
3. Attempt to edit or delete the logged entry.

### Expected Behaviour
A logged activity should be editable (e.g. date, distance, duration, and other recorded fields) and deletable, so incorrect entries can be corrected or removed without permanently skewing planner history.

### Actual Behaviour
Logged activities are displayed as read-only list items with no way to edit or delete their recorded information.

### Evidence
- User report: "When logging an activity, it should be possible to edit the activity in case any information was entered incorrectly such as date, distance etc. Currently this is not possible so permanently affects the planner history." Confirmed in follow-up that deleting should also be supported.
- Code reference: [views.tsx](src/views.tsx#L119) (`RunLogView` renders `run-list` items as static text with no edit or delete action).
- Code reference: [types.ts](src/types.ts#L143) (only `logRun` is defined; no update or delete method for an existing run).

### Triage Notes
- Reproducibility: Always
- Workaround: None known
- Suspected cause: No `updateRun`/`deleteRun` API existed and `RunLogView` rendered runs as read-only items.
- Missing information: None
- Resolution: Added `updateRun` and `deleteRun` to `window.trainingPlanner` (`src/types.ts`, `src/browser-api.ts`). Each activity in the Run log now has Edit and Delete buttons. Edit reuses `RunEntryPanel` pre-filled with the run's values. Delete asks for confirmation, and deleting the only result for a planned session returns that session to scheduled/rescheduled status.
- Validation: `npx tsc --noEmit` and `npx vitest run` pass. Not yet checked manually in the browser.

## BUG-20260928-006: Planner session detail panel does not show the structured segment breakdown for sessions created from a saved template

- **Reported:** 2026-09-28
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Planner (session detail panel)
- **Environment:** Not provided
- **Impact:** Runners who scheduled a session from a saved custom template (e.g. containing warm-up/interval/rest/cool-down segments) cannot see that structure from the planner; they only see the same generic distance/duration/pace/status fields shown for every session, regardless of whether a template was used.

### Summary
The Planner's session detail panel (`SessionPanelWithTemplates`, session view) always renders the same fixed fields — Target distance, Target duration, Pace range, Status — even when the session has a `template_id` referencing a saved session template with structured segments (warm-up, repeats, rest, cool-down). The segment structure and per-segment breakdown (available via `segmentDescription`/`SessionTemplate.segments` in the Session Builder) is not surfaced here, so users must return to the Session Builder to see the workout's structure.

### Steps to Reproduce
1. In the Session Builder, create and save a structured session template (e.g. with warm-up, interval repeats, and cool-down segments).
2. On the Planner, add a session and select that saved template as the run type.
3. Open the session's detail panel from the planner day cell.
4. Observe the fields shown.

### Expected Behaviour
When a scheduled session originates from a saved template with structured segments, the session detail panel should display that segment structure (e.g. warm-up, repeat/interval, rest, cool-down details) so the user can see the full planned workout without leaving the planner.

### Actual Behaviour
The session detail panel only ever shows Target distance, Target duration, Pace range, and Status — the same generic fields regardless of whether the session came from a structured template.

### Evidence
- User report: "When viewing a session from within the planner view the details are always the same. However, if importing a saved session with intervals etc then these must be displayed here... Currently they can only see the target distance."
- Code reference: [session-builder.tsx](src/session-builder.tsx#L234) (`SessionPanelWithTemplates` session-detail branch renders only the fixed `<dl>` fields; no lookup of `session.template_id` against `templates` or rendering of segments).
- Code reference: [types.ts](src/types.ts#L27) (`Session.template_id` exists, confirming the link to a template is available but unused in the detail view).

### Triage Notes
- Reproducibility: Always
- Workaround: Return to the Session Builder tab to view the saved template's segment structure.
- Suspected cause: The session-detail branch of `SessionPanelWithTemplates` never looked up `session.template_id` in `templates`, so no segments were rendered.
- Missing information: None
- Resolution: In `src/session-builder.tsx`, the session detail panel now looks up the linked template and shows a "Workout structure" list (warm up, run repeats with count, per-run target/pace and recovery, rest, cool down). Styles added in `src/styles.css`. The panel is unchanged for sessions without a template, or whose template has been deleted.
- Validation: `npx tsc --noEmit` and `npx vitest run` pass (10 tests). Not checked manually in a browser.

## BUG-20260928-005: Settings page appearance options ("System, Light, Dark") overflow their container on mobile

- **Reported:** 2026-09-28
- **Severity:** Low
- **Status:** Resolved
- **Area:** Settings page (Appearance section)
- **Environment:** Mobile device (specific OS/browser/viewport width not provided)
- **Impact:** Runners viewing Settings on a mobile device see the "System", "Light", "Dark" theme options extend beyond the appearance block instead of fitting within it.

### Summary
On the Settings page, the `.theme-options` row is a non-wrapping flex container (`display: flex; gap: 10px`) with no responsive rule to stack or wrap the options on narrow viewports, so the three appearance options overflow the surrounding `.settings-view` block on mobile widths.

### Steps to Reproduce
1. Open the Settings page on a mobile device (narrow viewport).
2. View the "Appearance" section.
3. Observe the "System", "Light", "Dark" options relative to the block containing them.

### Expected Behaviour
The appearance options should fit within the settings block on mobile widths, wrapping or stacking as needed.

### Actual Behaviour
The appearance options overflow the appearance block on mobile widths.

### Evidence
- User report: "On the settings page when using a mobile device, the appearance options \"System, Light, Dark\" overflow the appearance block."
- Code reference: [styles.css](src/styles.css#L34) (`.theme-options { display: flex; gap: 10px; ... }`, no `flex-wrap` and not included in any `@media` rule).

### Triage Notes
- Reproducibility: Unknown
- Workaround: None known
- Suspected cause: `.theme-options` was a non-wrapping flex row, and the global `input` padding made each radio option wider than needed.
- Missing information: Specific mobile device, OS, browser, and viewport width.
- Resolution: In `src/styles.css`, `.theme-options` now uses `flex-wrap: wrap`, and the radio inputs are sized to 16px with no padding so each option is compact.
- Validation: CSS-only change; not yet checked manually on a mobile viewport.

## BUG-20260928-004: Session builder distance fields will not accept a leading 0 (e.g. cannot type "0.4")

- **Reported:** 2026-09-28
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Session Builder (segment and repeat-child distance inputs)
- **Environment:** Not provided
- **Impact:** Runners cannot enter sub-1 km distances (e.g. 0.4 km) using the natural "0.4" input; only the ".4" portion is retained.

### Summary
The distance number inputs in the Session Builder render their value as `segment.distance_km || ""` (and the equivalent for repeat-child and recovery distance fields). Because `0` is falsy, as soon as the field's numeric value becomes `0` (e.g. after typing a leading "0"), the displayed value collapses back to an empty string, preventing a leading "0" from being kept while typing a decimal such as "0.4".

### Steps to Reproduce
1. Open the Session Builder tab.
2. In a segment's Distance field (or a repeat run/recovery distance field), attempt to type `0.4`.
3. Observe that typing `0` is immediately cleared, so only `.4` remains enterable.

### Expected Behaviour
Typing `0.4` in a distance field should retain the leading `0` and display `0.4` as entered.

### Actual Behaviour
The leading `0` is not accepted/retained; only the digits after the decimal point remain in the field.

### Evidence
- User report: "When entering a distance value in the session builder it does not currently allow for entering a 0 as the first number. If needing to enter 0.4 then it only accepts the .4 but it should be entered by a 0 first."
- Code reference: [session-builder.tsx](src/session-builder.tsx#L152) (segment distance input: `value={segment.distance_km || ""}`).
- Code reference: [session-builder.tsx](src/session-builder.tsx#L173) (repeat-child distance input, same pattern).
- Code reference: [session-builder.tsx](src/session-builder.tsx#L188) (recovery distance input, same pattern).

### Triage Notes
- Reproducibility: Always
- Workaround: Type the decimal portion first (e.g. ".4") then the value can be saved, though the leading zero is never visibly entered.
- Suspected cause: The inputs used `value={... || ""}`, so a numeric `0` rendered as an empty string and the typed leading zero was discarded.
- Missing information: None
- Resolution: In `src/session-builder.tsx`, the segment, repeat-child and recovery distance inputs now use `?? ""`, so `0` is displayed while typing.
- Validation: `npx tsc --noEmit` and `npx vitest run` pass; not checked manually in a browser.

## BUG-20260928-003: Session total distance is not rounded to 2 decimal places, and the unrounded value carries into the planner

- **Reported:** 2026-09-28
- **Severity:** Low
- **Status:** Resolved
- **Area:** Session Builder / Add a session (template distance calculation)
- **Environment:** Not provided
- **Impact:** Runners selecting a custom session template see (and save) a target distance with more than 2 decimal places, which then displays on the planner in the same unrounded form.

### Summary
When a custom session template is selected as the run type on the "Add a session" panel, `calculateTemplateTargets` sums segment distances without rounding. The resulting unrounded value is used to prefill the target-distance field, is saved with the session, and is subsequently shown as-is on the Planner day cell and session detail views.

### Steps to Reproduce
1. Open the Session Builder tab and build/save a template whose segment distances sum to a value with more than 2 decimal places (e.g. due to repeat-count multiplication or floating-point addition).
2. Open the Planner, add a session, and select that template as the run type.
3. Observe the auto-filled "Target distance (km)" value, save the session, and observe the distance shown on the planner day cell.

### Expected Behaviour
The calculated total distance should be rounded to a maximum of 2 decimal places when it is calculated for a template-based session, and that 2-decimal-place value should be what is saved and displayed on the planner.

### Actual Behaviour
The total distance from `calculateTemplateTargets` is used unrounded to prefill the distance field; this unrounded value is then saved and displayed unrounded on the planner.

### Evidence
- User report: "When a session is created and it calculates the total distance of the session. Ensure it is to 2 decimal places maximum. And this 2dp is kept when adding a session to the planner."
- Code reference: [domain.ts](src/domain.ts#L62) (`calculateTemplateTargets` accumulates `distanceKm` with no rounding).
- Code reference: [session-builder.tsx](src/session-builder.tsx#L206) (`setDistance(targets.distanceKm ? String(targets.distanceKm) : "")` uses the unrounded total to prefill the session form).
- Code reference: [views.tsx](src/views.tsx#L109) (planner day cell displays `session.target_distance_km` as saved, with no rounding).

### Triage Notes
- Reproducibility: Always (for templates whose segment math produces more than 2 decimal places)
- Workaround: Manually edit the "Target distance (km)" field before saving the session.
- Suspected cause: `calculateTemplateTargets` summed floating-point distances without rounding.
- Missing information: None
- Resolution: In `src/domain.ts`, `calculateTemplateTargets` now rounds the total distance to 2 decimal places. The rounded value prefills the session form, so it is saved and shown on the planner.
- Validation: Added a unit test for rounding; `npx tsc --noEmit` and `npx vitest run` pass (10 tests). Not checked manually in a browser.

## BUG-20260928-002: Saved session templates cannot be edited or deleted after creation

- **Reported:** 2026-09-28
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Session Builder (saved session templates)
- **Environment:** Not provided
- **Impact:** Runners who created a reusable session template cannot correct, adjust, or remove it afterwards; they must live with the template as originally saved.

### Summary
On the Session Builder tab, once a session template has been saved it appears in the "Saved sessions" list, but there is no way to edit or delete it. There is no update/delete API method (`createSessionTemplate` exists but no corresponding edit or delete method) and the saved-sessions list renders each entry as static text with no edit or delete control.

### Steps to Reproduce
1. Open the Session Builder tab.
2. Build and save a session template.
3. Attempt to modify or remove the saved session from the "Saved sessions" list.

### Expected Behaviour
A saved session template should be editable (e.g. an edit action on each entry in the "Saved sessions" list that loads it back into the builder for changes) and deletable (e.g. a delete action that removes it from the list).

### Actual Behaviour
The "Saved sessions" list only displays the template name and segment summary as static text, with no edit or delete control, and no update/delete method exists to persist changes to or remove an existing template.

### Evidence
- User report: "On the session builder tab. After a session has been created it currently does not allow you to edit the saved sessions." Confirmed in follow-up that deleting should also be supported.
- Code reference: [session-builder.tsx](src/session-builder.tsx#L92) (saved-sessions list rendered as static `<li>` text, no edit or delete action).
- Code reference: [browser-api.ts](src/browser-api.ts#L74) (only `createSessionTemplate` is implemented; no update or delete method).

### Triage Notes
- Reproducibility: Always
- Workaround: None known; the only option is to create a new template.
- Suspected cause: Only `createSessionTemplate` existed in the API and the saved-sessions list rendered static text with no controls.
- Missing information: None
- Resolution: Added `updateSessionTemplate` and `deleteSessionTemplate` to `src/browser-api.ts` and `src/types.ts`. Each saved session now has Edit and Delete buttons; Edit loads the template into the builder form (button becomes "Update reusable session", with a "Cancel editing" button), and Delete asks for confirmation. Deleting a template unlinks it from planner sessions that used it, which keep their saved targets. Duplicate-name validation ignores the template being edited.
- Validation: `npx tsc --noEmit` and `npx vitest run` pass (10 tests). Not checked manually in a browser.

## BUG-20260928-001: Planner month-view daily cells truncate session text on mobile widths

- **Reported:** 2026-09-28
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Planner month view (daily cells)
- **Environment:** Mobile device (specific OS/browser/viewport width not provided)
- **Impact:** Runners viewing the planner on a mobile device cannot fully read session information (e.g. run type, distance/duration) shown inside a day cell.

### Summary
On the Planner page, the daily calendar cells are too narrow on mobile screen widths to fit the session text they contain, causing the text to appear cut off.

### Steps to Reproduce
1. Open the Planner page on a mobile device (narrow viewport).
2. View a month containing scheduled sessions.
3. Observe the text inside a day cell for a scheduled session.

### Expected Behaviour
Session text within each daily cell should be fully readable on mobile screen widths, without being visually cut off.

### Actual Behaviour
The daily cells are too narrow for the session text at mobile widths, so the text appears cut off/truncated.

### Evidence
- User report: "On the planner page if using a mobile, the daily cells are too narrow for the text and it appears cut off."

### Triage Notes
- Reproducibility: Unknown
- Workaround: Tap/click the session card to open its detail panel, which shows the full session information.
- Suspected cause: `Not investigated`
- Missing information: Specific mobile device, OS, browser, and viewport width; whether the issue occurs on all sessions or only certain run types/text lengths.
- Resolution: The planner was redesigned as a Week/Month calendar (`src/planner-calendar.tsx`). Day cells now show only the date number and coloured activity dots, so no session text is truncated. Full session details are shown in the detail area below the calendar when a day is selected.
- Validation: `npx tsc --noEmit` and `npx vitest run` pass (10 tests). Not checked manually in a browser.

## BUG-20260803-001: Dashboard displays unnecessary race-day countdown text

- **Reported:** 2026-08-03
- **Severity:** Low
- **Status:** Superseded
- **Area:** Dashboard
- **Environment:** Not provided
- **Impact:** Runners see dashboard text that is not required for the intended interface.

### Summary
The dashboard displays the text `Race day in XX days`. This text is not required and should be removed from the dashboard.

### Steps to Reproduce
1. Launch the application.
2. Open the Dashboard for an active race goal.
3. Observe the race-goal summary.

### Expected Behaviour
The dashboard should not display the `Race day in XX days` text.

### Actual Behaviour
The dashboard displays `Race day in XX days` beside the goal distance.

### Evidence
- Stakeholder report: "On the dashboard the text \"Race day in XX days\" is not required and can be removed."

### Triage Notes
- Reproducibility: Unknown
- Workaround: None known
- Previous resolution: Removed the race-day countdown from the dashboard goal summary.
- Superseded: The stakeholder later confirmed that the countdown should be restored; see `BUG-20260807-004`.
- Validation: Typecheck, unit suite, and browser preview verified.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260803-002: Dashboard plan-progress section does not show plan status details

- **Reported:** 2026-08-03
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Dashboard plan-progress metric
- **Environment:** Not provided
- **Impact:** Runners cannot see the required whole-plan completion status or the integer counts of completed and remaining runs at a glance.

### Summary
The dashboard currently presents a section labelled `Session Adherance`. It should instead be labelled `Plan Status` and communicate completion progress for the whole active plan.

### Steps to Reproduce
1. Launch the application with an active plan containing planned runs.
2. Open the Dashboard.
3. Observe the section labelled `Session Adherance`.

### Expected Behaviour
The section should be labelled `Plan Status` and include a completion bar for the active plan. The bar should be full when the plan is 100% complete. It should also display integer counts for completed runs and runs still to do in the plan.

### Actual Behaviour
The dashboard shows a `Session Adherance` section instead of the required `Plan Status` presentation and does not provide the requested completion bar and completed-versus-remaining run counts.

### Evidence
- Stakeholder report: "Instead of \"Session Adherance\" section on the dashboard . Change this to Plan Status. It should then feature a bar which shows completion status where a full bar indicates it is 100% completed. It should also detail the number of runs completed and number of runs stil lto do in the plan as integers"

### Triage Notes
- Reproducibility: Unknown
- Workaround: None known
- Resolution: Replaced Session adherence with Plan Status, a percentage bar, and completed/remaining plan-run counts.
- Validation: Unit suite and browser preview verified the zero-session and active-plan states.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260803-003: Planner permits navigation outside training plan dates

- **Reported:** 2026-08-03
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Planner weekly navigation
- **Environment:** Not provided
- **Impact:** Runners can navigate to weeks that are not part of their training plan, which makes the plan scope unclear and creates unnecessary empty calendar views.

### Summary
The weekly planner allows navigation indefinitely before and after the active training plan. Weekly navigation should be restricted to weeks that overlap the plan's configured date range.

### Steps to Reproduce
1. Create or open an active training plan with defined start and end dates.
2. Open the Planner.
3. Select the previous-week or next-week navigation control repeatedly beyond the plan date range.
4. Observe that the planner continues to display weeks outside the training plan.

### Expected Behaviour
The Planner should only allow navigation to weeks within the active training plan date range. Navigation controls should prevent movement to weeks before the plan start date or after the plan end date.

### Actual Behaviour
The Planner permits effectively infinite navigation to weeks outside the training plan date range.

### Evidence
- Stakeholder report: "The planner page should only allow you to scroll to weeks within the training plan date ranges. Currently it allows and infinite scroll."

### Triage Notes
- Reproducibility: Unknown
- Workaround: None known
- Resolution: Bounded planner week navigation and unavailable calendar dates to the active plan start date through race date.
- Validation: Unit suite and browser preview verified disabled boundary navigation.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260803-004: Dashboard distance chart labels do not use the required wording

- **Reported:** 2026-08-03
- **Severity:** Low
- **Status:** Resolved
- **Area:** Dashboard distance chart
- **Environment:** Not provided
- **Impact:** Runners see chart wording that does not match the intended plan-progress terminology.

### Summary
The dashboard graph plot section requires the title `Plan distance` and the subtitle `Plan vs Completed`.

### Steps to Reproduce
1. Launch the application with an active plan.
2. Open the Dashboard.
3. Locate the graph plot section for plan and completed distance.

### Expected Behaviour
The graph plot section title should be `Plan distance` and its subtitle should be `Plan vs Completed`.

### Actual Behaviour
The graph plot section does not use the required title and subtitle wording.

### Evidence
- Stakeholder report: "The graph plot section on the dashboard page should be titled \"Plan distance\" with the sub title \"Plan vs Completed\""

### Triage Notes
- Reproducibility: Unknown
- Workaround: None known
- Resolution: Updated the chart title to `Plan distance` and subtitle to `Plan vs Completed`.
- Validation: Browser preview verified the chart labels.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260803-005: Dashboard distance chart is limited to the last four weeks

- **Reported:** 2026-08-03
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Dashboard distance chart
- **Environment:** Not provided
- **Impact:** Runners cannot assess planned and completed distance across the complete active training plan.

### Summary
The dashboard graph plot shows only the last four weeks. It must show the entire active training plan date range, from the plan start date through the race date.

### Steps to Reproduce
1. Create or open an active training plan spanning more than four weeks.
2. Open the Dashboard.
3. Locate the plan-distance graph plot.

### Expected Behaviour
The graph plot should display planned and completed distance for every date from the active plan start date through its race date.

### Actual Behaviour
The graph plot displays only the last four weeks rather than the entire active training plan date range.

### Evidence
- Stakeholder report: "The graph plot on the dashboard page should show the entire date range not just the last 4 weeks"
- Stakeholder clarification: "entire date range means the acttive training plan start date > race date"

### Triage Notes
- Reproducibility: Unknown
- Workaround: None known
- Resolution: Chart aggregation now spans every week from plan start through race week, with the race date in its summary.
- Validation: Unit suite and browser preview verified full active-plan coverage.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260803-006: Application lacks a reusable structured session builder

- **Reported:** 2026-08-03
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Session planning and custom workout creation
- **Environment:** Not provided
- **Impact:** Runners cannot define, save, and reuse detailed structured workouts when building their training plans.

### Summary
The application requires a Session Builder page for creating reusable custom session templates. A template must allow the runner to construct an ordered workout from predefined warm-up, cool-down, rest, and repeat segments.

### Steps to Reproduce
1. Launch the application.
2. Attempt to create a reusable custom structured session with warm-up, repeat, rest, and cool-down segments.
3. Attempt to configure the target pace and distance and/or duration for each segment.
4. Attempt to save the session for use on multiple future planned dates.

### Expected Behaviour
The application should provide a Session Builder page where the runner can:

1. Create and save a named custom session template for reuse in future plans or planned sessions.
2. Add, remove, reorder, and configure predefined warm-up, cool-down, rest, and repeat segments.
3. Set a target distance and/or target duration, plus a target pace, for each applicable segment.
4. Set a repeat count for each repeat group.
5. Associate a rest segment with a repeat group so that the rest is included in every repetition.

### Actual Behaviour
The application does not provide a Session Builder page or the required reusable structured-session configuration workflow.

### Evidence
- Stakeholder report: "Add a session builder page to allow user to create custom sessions. It will allow users to define each individual split of the run with predefined warm up, cool down, rest and repeat segments. The user defines the desired pace and distances of each split."
- Stakeholder clarification: Custom sessions can be reused multiple times; segments support distance and/or duration; repeat groups require a repeat count and include the rest segment in each repetition.

### Triage Notes
- Reproducibility: Always
- Workaround: None known
- Resolution: Added a Session Builder with reusable templates, ordered segments, repeat counts, and recovery targets for every repetition.
- Validation: Unit suite and browser preview verified template creation and recovery-inclusive distance totals.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260803-007: Session creation does not provide a defined run-type dropdown

- **Reported:** 2026-08-03
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Planner session creation
- **Environment:** Not provided
- **Impact:** Runners cannot consistently classify a planned session or select a saved custom session template when adding a session to the plan.

### Summary
The Run type input used while adding a planned session should be a dropdown rather than free-text entry. It must list the predefined types `Easy`, `Long`, `Tempo`, `Interval`, and `Race`, as well as any reusable custom sessions created in the Session Builder.

### Steps to Reproduce
1. Open the Planner for an active training plan.
2. Add a session to a calendar date.
3. Locate the Run type input.
4. Attempt to select a predefined run type or a saved custom session template.

### Expected Behaviour
The Run type input should be a dropdown containing `Easy`, `Long`, `Tempo`, `Interval`, and `Race`. It should also include all saved custom session templates so that a runner can select one when scheduling a planned session.

### Actual Behaviour
The Run type input does not provide the required dropdown of predefined types and reusable custom sessions.

### Evidence
- Stakeholder report: "The Run type entry when adding a session should be a drop down of defined types (Easy, Long, Tempo, Interval, Race and any custom sessions created)"

### Triage Notes
- Reproducibility: Unknown
- Workaround: None known
- Resolution: Replaced free-text Run type entry with defined run types and saved custom session templates.
- Validation: Browser preview verified selection and template target prefill.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260804-001: Session Builder shows both distance and duration inputs for each segment

- **Reported:** 2026-08-04
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Session Builder segment configuration
- **Environment:** Not provided
- **Impact:** Runners must interpret and manage two competing target inputs for each workout segment, making structured sessions harder to define accurately.

### Summary
Each Session Builder segment must let the runner choose whether its target is distance-based or duration-based. The editor should then show only the input that corresponds to the selected target mode.

### Steps to Reproduce
1. Open the Session Builder.
2. Add or edit a warm-up, repeat, rest, or cool-down segment.
3. Observe the target inputs displayed for the segment.

### Expected Behaviour
Each segment should provide a clear distance-or-duration selector. Selecting distance should show only the distance input; selecting duration should show only the duration input. The same behavior should apply to the recovery target configured within a repeat segment.

### Actual Behaviour
The Session Builder presents both distance and duration inputs for a segment at the same time rather than showing the one appropriate to the runner's selected target mode.

### Evidence
- Stakeholder report: "On the session builder page for each segment of the workout the user can choose whether the segment is dependent on duration or distance. It then gives the user the correct entry box based on their selection rather than providing both."
- Regression report, 2026-08-07: Selecting `Duration` from the Target Type dropdown does not change the selected mode and leaves the `Distance (km)` input visible.

### Triage Notes
- Reproducibility: Always
- Workaround: None needed after resolution.
- Resolution: Target-mode selection now uses explicit editor state, so Duration immediately replaces the distance input before a duration value is entered. The same behavior applies to recovery targets.
- Validation: Typecheck, renderer build, and unit suite verified.
- Regression: Reopened on 2026-08-07 after the Target Type selector was reported not to switch to duration; resolved on 2026-08-07.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260807-001: Session Builder entry boxes overlap at wider page widths

- **Reported:** 2026-08-07
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Session Builder segment configuration
- **Environment:** Windows; application version/build not provided
- **Impact:** Runners cannot clearly view or use the Session Builder's segment entry boxes when the page is widened enough to place additional inputs horizontally.

### Summary
The Session Builder layout overlaps segment entry boxes at wider page widths when it attempts to position too many fields in the available horizontal space.

### Steps to Reproduce
1. Open the Session Builder on Windows.
2. Increase the page width until the layout attempts to position additional segment entry boxes horizontally.
3. Observe the segment entry boxes.

### Expected Behaviour
Segment entry boxes should remain distinct, readable, and usable at wider page widths. The layout should size or wrap fields without overlap.

### Actual Behaviour
Entry boxes overlap one another when the page is widened and the layout tries to place too many fields in the available horizontal space.

### Evidence
- User-supplied screenshot shows overlapping Distance, Duration, Target pace, Repeat count, and recovery entry boxes in the Session Builder.

### Triage Notes
- Reproducibility: Always when the page is widened to the reported layout condition before resolution
- Workaround: None needed after resolution
- Resolution: Replaced fixed field-column layouts with responsive, minimum-width grids for segment and repeat-recovery inputs.
- Validation: Typecheck and unit suite verified.
- Missing information: Application version/build

## BUG-20260807-002: Scroll-box arrows do not match application styling

- **Reported:** 2026-08-07
- **Severity:** Low
- **Status:** Resolved
- **Area:** Scroll-box controls
- **Environment:** Not provided
- **Impact:** Users see scroll-box arrow controls that are visually inconsistent with the rest of the application interface.

### Summary
The arrow controls displayed in scroll boxes do not aesthetically match the application's established visual style.

### Steps to Reproduce
1. Open a screen containing a scroll box.
2. Locate the scroll-box arrow controls.
3. Compare their appearance with the surrounding application controls.

### Expected Behaviour
Scroll-box arrow controls should use styling that is visually consistent with the rest of the application.

### Actual Behaviour
Scroll-box arrow controls use a visual style that does not match the rest of the application.

### Evidence
- User-supplied screenshot shows the current scroll-box arrow controls.

### Triage Notes
- Reproducibility: Always before resolution
- Workaround: None needed after resolution
- Resolution: Removed the browser-native numeric input spinner arrows, which were visually inconsistent with the application controls.
- Validation: Typecheck and renderer build verified.
- Missing information: Affected screen, application version/build, operating system, and browser or runtime were not provided.

## BUG-20260807-003: Planner session side panel requires horizontal scrolling by default

- **Reported:** 2026-08-07
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Planner session creation side panel
- **Environment:** Not provided
- **Impact:** Runners must horizontally scroll the add-session side panel to view and use all session information and controls.

### Summary
When a runner adds a session from the Planner, the side panel that opens from the right has a horizontal scrollbar by default because its content does not fit within the panel width.

### Steps to Reproduce
1. Open the Planner.
2. Start adding a session.
3. Observe the side panel that opens from the right.

### Expected Behaviour
The add-session content should fit within the side panel's default width without requiring horizontal scrolling.

### Actual Behaviour
The side panel shows a horizontal scrollbar by default to access all session information.

### Evidence
- Stakeholder report: "On the planner page, when adding a session, the side bar which comes from the right, by default has a horizontal scroll bar to see all the information. I want by default this to fit within the side pane size without needing to scroll"

### Triage Notes
- Reproducibility: Always in the reported default add-session panel state
- Workaround: None needed after resolution
- Resolution: Constrained panel inputs, selects, and textareas to the available panel width, set grid tracks to shrinkable widths, and suppressed horizontal overflow.
- Validation: Typecheck and renderer build verified.
- Missing information: Application version/build, operating system, and browser or runtime were not provided.

## BUG-20260807-004: Dashboard active-goal banner does not display days remaining

- **Reported:** 2026-08-07
- **Severity:** Low
- **Status:** Resolved
- **Area:** Dashboard active-goal banner
- **Environment:** Not provided
- **Impact:** Runners cannot see the number of days remaining until their active goal's race date from the Dashboard banner.

### Summary
The Dashboard active-goal banner does not show the days remaining until the active goal's race date. The stakeholder confirmed that this countdown should be restored.

### Steps to Reproduce
1. Create or open an active goal with a future race date.
2. Open the Dashboard.
3. Observe the active-goal banner.

### Expected Behaviour
The active-goal banner should display the number of days remaining until the active goal's race date, consistent with the supplied visual sketch.

### Actual Behaviour
The active-goal banner does not display the days-to-go countdown.

### Evidence
- User-supplied visual sketch shows the intended Dashboard active-goal banner treatment.
- Stakeholder confirmation: "Yes I confirm the countdown should be restored."

### Triage Notes
- Reproducibility: Always for an active goal with a future race date
- Workaround: None needed after resolution
- Resolution: Restored a days-to-go counter in the active-goal banner, calculated from local calendar days and clamped at zero after race day.
- Validation: Typecheck, renderer build, and unit suite verified countdown boundaries.
- Related entry: Supersedes the prior requirement recorded in `BUG-20260803-001`, which removed the dashboard race-day countdown.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260807-005: Session Builder labels repeat block as Repeat instead of Run

- **Reported:** 2026-08-07
- **Severity:** Low
- **Status:** Resolved
- **Area:** Session Builder segment labels
- **Environment:** Not provided
- **Impact:** Runners see terminology that does not match the requested workout-editing language.

### Summary
The Session Builder labels the run-and-recovery group as `Repeat`. The visible block name should be `Run`, with no functional change to its repeat-count or recovery behavior.

### Steps to Reproduce
1. Open the Session Builder.
2. Add or locate a repeat segment.
3. Observe the segment label.

### Expected Behaviour
The segment should be labelled `Run`. Its existing repeat-count and recovery behavior should remain unchanged.

### Actual Behaviour
The segment is labelled `Repeat`.

### Evidence
- Stakeholder report: "On the session builder, replace the \"Repeat\" block naming with \"Run\". Functionally the block is the same"

### Triage Notes
- Reproducibility: Always
- Workaround: None needed after resolution
- Resolution: Renamed the visible segment label to `Run` and its visible count label to `Run count`; stored segment behavior remains unchanged.
- Validation: Typecheck and renderer build verified.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260807-006: Session Builder run blocks cannot omit recovery

- **Reported:** 2026-08-07
- **Severity:** Medium
- **Status:** Resolved
- **Area:** Session Builder run segment configuration
- **Environment:** Not provided
- **Impact:** Runners cannot create repeated run blocks without a recovery segment when that workout structure is required.

### Summary
The Session Builder currently includes recovery configuration in every repeat block. Runners need a checkbox to decide whether a run block includes recovery.

### Steps to Reproduce
1. Open the Session Builder.
2. Add or edit a run block.
3. Attempt to create the repeated run without recovery.

### Expected Behaviour
Each run block should provide a checkbox to include recovery. When selected, the recovery fields and recovery behavior should be included after every repetition. When unselected, the recovery fields should be hidden and no recovery should be included in the repeated run.

### Actual Behaviour
Every repeat block displays recovery configuration and does not provide a control to omit recovery.

### Evidence
- Stakeholder report: "Currently the repeat block on the session builder page has the recovery part. Make this a checkbox for the user to decide if they want that repeat to feature the recovery or not"

### Triage Notes
- Reproducibility: Always
- Workaround: None needed after resolution
- Resolution: Added an Include recovery after every run checkbox. When unchecked, recovery fields are hidden, recovery values are cleared, and recovery targets are excluded from saved template totals. Existing templates retain recovery by default.
- Validation: Typecheck, renderer build, and unit suite verified recovery-inclusive and recovery-free totals.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260810-001: Goals and History page cannot cancel an active plan

- **Reported:** 2026-08-10
- **Severity:** High
- **Status:** Resolved
- **Area:** Goals and History active-plan management
- **Environment:** Not provided
- **Impact:** Runners cannot discard an incorrectly created or no-longer needed active plan before starting a new one. 

### Summary
The Goals and History page needs a Cancel plan control for the active plan. Cancellation must permanently delete the active goal and all data associated with it.  

### Steps to Reproduce
1. Create or open an active training plan.
2. Open Goals and History.
3. Attempt to cancel the active plan so that a new plan can be started.

### Expected Behaviour
The active plan section should provide a Cancel plan control. Selecting it should show a confirmation dialog that identifies the destructive action. Confirming cancellation should permamently delete the active goal and all associated plan data, including sessions, reusable templates associated with the plan where applicable, and completed runs associated with the plan. 

### Actual Behaviour
The Goals an History page does not provide a way to cancel the active plan and permanently remove its associated data.

### Evidence
- Stakeholder request: "There needs to be a cancel plan button. If someone creates a plan which is incorrect or they want to start a new plan then they have the option to cancel it. I think a button on the goals and history page on the associated active plan would be a good place for it."
- Stakeholder clarification: "Permanently delete all data associated with it and yes include a dialog."

### Triage Notes
- Reproducibility: Always
- Workaround: None needed after resolution.
- Resolution: Added a Cancel plan button to the active goal card on Goals and History. Confirmation dialog warns that all associated sessions and runs will be permanently deleted; templates are retained. Confirmed: action removes the goal, all goal sessions, and their logged runs from state.
- Validation: Typecheck verified.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260810-002: Goals and History page cannot edit an active plan

- **Reported:** 2026-08-10
- **Severity:** High
- **Status:** Resolved
- **Area:** Goals and History active-plan management
- **Environment:** Not provided
- **Impact:** Runners cannot correct active-plan details, including date range and race targets without cancelling the entire plan. 

### Summary
The active-plan section on Goals and History needs an Edit plan control. It must allow the runner to update the plan name, start date, end date, race distance and target time.   

### Steps to Reproduce
1. Create or open an active training plan.
2. Open Goals and History.
3. Attempt to edit the active plans name, start date, end date, race distance or target time. 

### Expected Behaviour
The active plan section should provide an Edit plan control. The edit workflow should allow the runner to change the plan name, start date, end date, race distance, and target time. Before committing a changed date range, the application should detect completed activities outside the proposed range and display a confirmation dialog warning that those activities will be permanently deleted. Confirming the dialog should apply the changes and delete only the affected completed activities. 

### Actual Behaviour
The Goals an History page does not provide an active-plan editing workflow or date-range warning for completed activities that would be removed. 

### Evidence
- Stakeholder request: "I also want an edit plan button on the associated plan on the goals and history tab. This will enable the user to edit the start and end date of the plan, target time, race distance and plan name. If the date is changed, then activities which were completed outside of the new date range will be lost. This warning is displayed via a dialog before the user commits their changes"

### Triage Notes
- Reproducibility: Always
- Workaround: None needed after resolution.
- Resolution: Added an Edit plan button to the active goal card. Clicking it reveals an inline form to update name, plan start date, race date, distance, and target time. If the date range is narrowed, sessions outside the new range (and their associated runs) are deleted after a generic confirmation dialog. Changes are committed via a new `editPlan` browser-API method.
- Validation: Typecheck verified.
- Missing information: Application version/build and affected operating system were not provided.

## BUG-20260812-001: Session Builder cosmetic appearance does not match design mockup

- **Reported:** 2026-08-12
- **Severity:** Low
- **Status:** Resolved
- **Area:** Session Builder
- **Environment:** Not provided
- **Impact:** The session builder UI does not match the intended design, reducing visual polish and usability clarity.

### Summary
The session builder page has cosmetic differences from the agreed design mockup. Most notably, the session metrics (total distance and total time) are currently displayed in the top-right area of the page rather than in a summary bar at the bottom, as shown in the mockup.

### Steps to Reproduce
1. Open the application and navigate to the Session Builder.
2. Add one or more segments (e.g. Warm up, Run, Cool down).
3. Observe the layout of the page, particularly the placement of session metrics.

### Expected Behaviour
The session builder should closely mirror the design mockup:
- Segment cards styled with coloured left-border accents per segment type (Warm up, Run, Cool down).
- Segment-type icons displayed alongside the segment heading.
- A fixed bottom summary bar showing total distance (excluding recoveries) and estimated total time, alongside a "Preview workout" action button.
- Add-segment buttons (+ Warm up, + Run, + Rest, + Cool down) grouped in the top-right header area.

### Actual Behaviour
Session metrics (total distance) are displayed in the top-right of the page rather than in a bottom summary bar. The segment cards, icons, and overall visual treatment do not match the mockup.

### Evidence
- Stakeholder-supplied mockup screenshot showing the intended layout, including the bottom metrics bar with "Total distance: 5.20 km (excluding recoveries) • Total time: ~24:52" and a "Preview workout" button.

### Triage Notes
- Reproducibility: Always
- Workaround: None needed after resolution.
- Resolution: (1) Add-segment buttons moved to the page-level header (top right), matching mockup layout. (2) Per-type coloured left-border accents applied to segment cards (amber warmup, orange run, teal rest, green cooldown). (3) Type-appropriate icons added to each segment header badge. (4) Total distance (excluding recoveries) and estimated total time moved to a bottom summary bar alongside a Preview workout button. The old template-total widget was removed from the top of the page.
- Validation: Typecheck verified.
- Missing information: Application version/build and affected operating system were not provided.