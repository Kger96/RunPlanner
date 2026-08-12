# Bug Log

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