# Haki UI Design

**Date:** 2026-03-31
**Topic:** Visualize the full Haki lifecycle with a cinematic web UI that supports realtime monitoring and replay
**Status:** Proposed / approved in brainstorming

## 1. Goal

Build `haki-ui` as a dedicated web UI for visualizing the full Haki lifecycle, not just individual task execution. The UI should make Haki's workflow legible and dramatic at the same time: users should be able to understand overall progress quickly while also seeing beautiful animated transitions between workflow states.

The selected direction is a **dual-view synchronized UI**:
- a **graph/state-machine view** as the narrative and visual center
- a **stage/pipeline view** as the operational overview
- a **timeline/replay control layer** for temporal navigation
- an **inspector panel** for event/task details

The product should support both:
- **realtime mode** for following an active run
- **replay mode** for reviewing a completed run

## 2. Why this direction

The repository already defines a clear Haki workflow and CLI state model:
- [README.md](README.md) describes the linear workflow (`new-project → discuss → plan → exec`) and state-driven tooling.
- [.agent/references/ui-brand.md](.agent/references/ui-brand.md) defines a lightweight visual language for task and workflow status.

What is missing is a dedicated evented visualization layer that can render the lifecycle as a living system instead of static text output. `haki-ui` fills that gap.

A graph-only UI would maximize drama but lose scanability. A column-only UI would improve readability but underuse the state-machine concept. The chosen hybrid keeps both: the graph communicates the full system and the stage view keeps users oriented.

## 3. Product shape

### 3.1 Primary surface

`haki-ui` is a **separate web UI** rather than a terminal-only enhancement.

### 3.2 Primary use cases

1. **Live run monitoring**
   - watch a Haki run progress in realtime
   - see which lifecycle stage is active
   - inspect what task, workflow, or subagent is currently moving

2. **Replay and review**
   - replay a completed run from the beginning
   - scrub across time
   - inspect key transitions and failure points

3. **Debugging and storytelling**
   - understand why a run got blocked or failed
   - demonstrate Haki's workflow in a visually compelling way

## 4. Architecture overview

The system is composed of five main parts.

### 4.1 Event producer

Haki runtime / CLI wrappers should emit structured lifecycle events whenever important workflow transitions happen.

Responsibilities:
- emit normalized events at workflow checkpoints
- attach consistent identifiers and timestamps
- cover project, workflow, phase, task, and agent/subagent activity

### 4.2 Event store

Phase 1 should use an **append-only JSONL event log** as the source of truth.

Why this fits phase 1:
- local-first and compatible with the repo's CLI-centric nature
- easy to debug manually
- naturally supports replay by reading the log back in order
- avoids premature backend/database complexity

### 4.2.1 Phase 1 live delivery topology

Phase 1 realtime delivery should stay local and simple:
- Haki runtime appends structured events to a JSONL file for the active run
- the web UI reads live updates through a lightweight local delivery layer that tails the active log and forwards new events to the browser
- browser delivery should use a **single directional stream** in phase 1, with **Server-Sent Events (SSE)** as the default transport
- replay mode reads the completed JSONL log directly through the same projection pipeline, but without requiring the live stream to stay connected

This keeps the architecture local-first while avoiding polling drift and avoiding the complexity of a bidirectional realtime channel in phase 1.

### 4.3 Projection layer

A normalization/projection layer should derive UI-ready models from raw events.

It should produce at least three projections:
- **graph projection** — nodes, edges, activation state, transition emphasis
- **stage projection** — lifecycle lanes/columns and status summaries
- **timeline projection** — event list, checkpoints, playback markers

This keeps rendering logic independent from raw event schema details.

### 4.4 Web UI

The UI should include:
- **graph canvas** — the cinematic state-machine surface
- **stage panel** — the quick-read workflow/pipeline representation
- **timeline controls** — playback and navigation
- **inspector panel** — selected object metadata and raw event detail

### 4.5 Sync engine

A synchronization engine should coordinate all views around a single shared **playhead**.

This is critical. The graph, stage panel, and timeline must not compute and mutate progression independently. The playhead and projections together define the canonical visual state.

## 5. Information architecture

## 5.1 Dual-view synchronized model

The selected product direction is **dual-view synchronized**:
- one pane presents the **generalized state graph**
- another pane presents the **stage-oriented flow**
- both stay synchronized during live updates and replay

### Behavior rules

- selecting a node in the graph highlights related stage items and timeline events
- selecting a stage/lane highlights related graph nodes/edges and timeline regions
- scrubbing the timeline updates both graph and stage views together
- realtime incoming events update both views in the same logical frame

## 5.2 Visual hierarchy

The UI should have a clear hierarchy of roles:
- **graph** = emotional / narrative center
- **stage panel** = operational overview
- **timeline** = temporal control
- **inspector** = diagnostic detail

This division is important because the interface is intentionally cinematic, but it still needs to remain readable.

## 6. Interaction model

The UI should support three main modes.

### 6.1 Live mode

Used while a run is active.

Expected behavior:
- consume new events as they arrive
- auto-focus visually on newly active regions
- preserve the user's orientation through the stage view

### 6.2 Replay mode

Used after a run is complete.

Expected behavior:
- replay the lifecycle from stored events
- support play/pause/scrub/jump
- allow stepping through important checkpoints and transitions

### 6.3 Inspect mode

Used when the user clicks a node, edge, task, phase, or event.

Expected behavior:
- freeze or de-emphasize surrounding motion enough to inspect clearly
- open a detail panel without breaking global synchronization
- preserve awareness of current playhead state

## 7. Motion language

The desired tone is **cinematic**, not merely utilitarian.

### 7.1 Graph view motion

The graph view should use motion to tell the story of the run:
- **node activation** — glow and subtle scale increase
- **edge traversal** — light trail/pulse through transitions
- **state completion** — settle into a completed visual state rather than just changing color
- **failure/blocker** — distinct but controlled disruption, avoiding noisy flashing
- **camera choreography** — gentle pan/zoom toward current activity with cooldowns to avoid constant camera jitter

### 7.2 Stage view motion

The stage view should remain more restrained:
- active lanes receive ambient emphasis
- counters/progress indicators update clearly
- event chips or signals enter lanes to show new activity

The stage view exists primarily for orientation, so motion should support legibility over drama.

### 7.3 Motion guardrails

To avoid spectacle overwhelming utility:
- emphasize only fresh deltas and currently active transitions
- reduce prominence of settled/completed regions
- avoid animating every element at once
- leave room for future reduced-motion support

## 8. Event model

## 8.1 Core schema

Each event should include at minimum:
- `id`
- `timestamp`
- `runId`
- `sessionId`
- `type`
- `entityType`
- `entityId`
- `parentId` (optional)
- `payload`

Additional classification fields for phase 1:
- `phase` is required on `workflow.*`, `phase.*`, and `task.*` events; optional on `run.*`, `agent.*`, and `review.*`
- `status` is required on `phase.*`, `task.*`, and `agent.*` events; optional on `run.*`, `workflow.*`, and `review.*`

Canonical phase values in phase 1:
- `new-project`
- `discuss`
- `plan`
- `exec`
- `verify` (derived/UI-facing only when attached by projection)
- `done` (derived/UI-facing only when attached by projection)
- `failed`

Canonical status values in phase 1:
- task statuses: `pending`, `discussing`, `discussed`, `planning`, `planned`, `executing`, `completed`, `blocked`
- phase statuses: `pending`, `active`, `completed`, `blocked`
- agent statuses: `queued`, `running`, `succeeded`, `failed`
- run/workflow/review events may omit `status` when the event type itself is sufficiently descriptive

This keeps the schema strict where projection logic needs it, while avoiding fake values on event families where `status` would add noise.

## 8.1.1 Event family contract table

| Event family | `phase` | `status` | Notes |
| --- | --- | --- | --- |
| `run.*` | Optional | Optional | lifecycle implied by event type |
| `workflow.*` | Required | Optional | workflow entry/exit must map to lifecycle phase |
| `phase.*` | Required | Required | phase progress events are explicit state markers |
| `task.*` | Required | Required | core source for task lifecycle animation |
| `agent.*` | Optional | Required | can inherit `phase` from parent context |
| `review.*` | Optional | Optional | often attached to current task/workflow context |

## 8.2 Event families

### Run lifecycle
- `run.started`
- `run.completed`
- `run.failed`
- `run.cancelled`

Required payload fields:
- `run.started`: `entryWorkflow`
- `run.completed`: `summary`
- `run.failed`: `errorMessage`
- `run.cancelled`: `reason`

### Workflow lifecycle
- `workflow.entered`
- `workflow.exited`

Required payload fields:
- `workflow.entered`: `workflowName`
- `workflow.exited`: `workflowName`, `outcome`

### Phase lifecycle
- `phase.pending`
- `phase.active`
- `phase.completed`
- `phase.blocked`

Required payload fields:
- all `phase.*`: `phaseName`
- `phase.blocked`: `reason`

### Task lifecycle
- `task.created`
- `task.discussing`
- `task.discussed`
- `task.planning`
- `task.planned`
- `task.executing`
- `task.completed`
- `task.blocked`

Required payload fields:
- `task.created`: `taskTitle`
- `task.discussing`: `taskTitle`
- `task.discussed`: `taskTitle`, `decisionSummary`
- `task.planning`: `taskTitle`
- `task.planned`: `taskTitle`, `planRef`
- `task.executing`: `taskTitle`
- `task.completed`: `taskTitle`, `resultSummary`
- `task.blocked`: `taskTitle`, `reason`

### Agent/subagent lifecycle
- `agent.started`
- `agent.completed`
- `agent.failed`

Required payload fields:
- `agent.started`: `agentType`
- `agent.completed`: `agentType`, `summary`
- `agent.failed`: `agentType`, `errorMessage`

### Review/checkpoint lifecycle
- `review.requested`
- `review.approved`
- `review.changed_requested`

Required payload fields:
- `review.requested`: `targetType`, `targetId`
- `review.approved`: `targetType`, `targetId`
- `review.changed_requested`: `targetType`, `targetId`, `reason`

### Event invariants

All phase-1 events should obey these invariants:
- events are append-only and never mutated in place
- ordering is determined by file order first, timestamp second
- `runId` is required on every event in a run log
- `entityType` + `entityId` identify the subject of the event
- `parentId` links child entities such as task events under a workflow/run context when needed
- projections must treat unknown event types as non-fatal

This event model directly supports transitions like:
`pending → discussing → discussed → planning → planned → executing → completed`

## 9. State-machine mapping

To keep the system understandable, the visualization should use a **multi-layer state model** instead of flattening everything into one graph.

### 9.1 Global lifecycle layer

For the overall Haki run:
- `idle`
- `new-project`
- `discuss`
- `plan`
- `exec`
- `failed`

In phase 1, the persisted top-level workflow states are only the lifecycle stages that correspond to Haki's actual workflow progression.

`verify` and `done` are **derived UI states**, not additional persisted workflow stages:
- `verify` appears when the run has left active execution and is presenting final checks, reviews, or completion summaries
- `done` appears when the run has ended successfully and the final projection resolves to a completed outcome

This keeps the underlying lifecycle aligned with the repo's current workflow while still allowing the UI to show richer end-of-run semantics.

### 9.1.1 Canonical top-level transition map

The phase-1 canonical transition map is:
`idle → new-project → discuss → plan → exec → failed|done`

Notes:
- some runs may begin at `discuss`, `plan`, or `exec` depending on the entry command
- `verify` is a projection-only presentation state that can appear between `exec` and `done` in the UI, but it is not a required persisted workflow node in the event log
- `failed` is a terminal persisted outcome
- `done` is a terminal derived outcome when the run completes successfully

The stage view may still render a `verify` lane or summary region if that improves readability, but the planning and event model should treat it as derived from terminal/run-summary events rather than as a mandatory emitted phase

### 9.1.2 Stage lane mapping

For phase 1, the major stage lanes are:
- `new-project`
- `discuss`
- `plan`
- `exec`
- `verify` (derived)
- `done` (derived)
- `failed`

This preserves the current workflow semantics while keeping the UI expressive.

### 9.2 Task lifecycle layer

For each task:
- `pending`
- `discussing`
- `discussed`
- `planning`
- `planned`
- `executing`
- `completed`
- `blocked`

### 9.3 Execution activity layer

For agents/subagents:
- `queued`
- `running`
- `succeeded`
- `failed`

### 9.4 Layered rendering model

The graph should present these layers with different visual weight:
- **global nodes** as major states
- **task clusters** as mid-level state groups
- **execution bursts/activity traces** as fine-grained movement

The stage view should map these onto major lanes such as:
- `new-project`
- `discuss`
- `plan`
- `exec`
- `verify`
- `done`
- `failed`

## 10. Data principles

The main architectural principle is:

> **Events are facts. State is a projection.**

Implications:
- raw events are the durable source of truth
- UI state is always derived, never treated as canonical
- replay is reconstruction from recorded events, not a separate stored animation script
- both live mode and replay mode use the same projection logic

This is the basis for deterministic playback and debuggable behavior.

## 11. Error handling strategy

Main failure cases in this product are data and synchronization issues rather than ordinary form/UI errors.

### 11.1 Event validation

When events are emitted:
- validate required fields and allowed structure
- reject invalid events or mark them invalid without corrupting the whole stream
- surface invalidity clearly in debugging surfaces

### 11.2 Projection resilience

When unknown or malformed but non-fatal events are encountered:
- skip or isolate them safely
- continue processing subsequent valid events
- expose warnings in an inspector/dev overlay

### 11.3 Synchronization protection

If graph and stage representations diverge conceptually, the sync engine must recompute from shared playhead + projections rather than trusting panel-local state.

### 11.4 Replay fault tolerance

If parts of the log are missing or corrupted:
- replay should continue to the next valid event where possible
- the timeline should mark the corrupted/gapped range
- the inspector should identify missing segments explicitly

## 12. Testing strategy

The repo emphasizes structured planning, TDD-first execution, and verification. The testing strategy should reflect that.

### 12.1 Event schema tests

Verify:
- required fields exist
- event types map to valid shapes
- identifiers and lifecycle relationships are coherent

### 12.2 Projection tests

Given representative event sequences, assert:
- graph projections are correct
- stage projections are correct
- timeline checkpoints and playback markers are correct

This is the highest-value test category because it validates the derived semantics used by every view.

### 12.3 Sync engine tests

Verify:
- graph selection updates stage/timeline state correctly
- stage selection updates graph/timeline state correctly
- timeline scrubbing updates all synchronized views consistently
- new realtime events update all views under the same state transition rules

### 12.4 Replay determinism tests

For a given event log and playhead position, the resulting projection state should always be identical.

This is essential for trustworthy replay.

### 12.5 UI interaction tests

Verify only the key interactions needed for phase 1:
- play/pause/scrub
- select graph node
- select stage lane
- inspect event/task details

## 13. Phase 1 scope

### 13.1 In scope

Phase 1 should deliver:
- normalized event schema
- append-only JSONL event store
- dual-view synchronized web UI
- graph view for generalized lifecycle visualization
- stage/pipeline view for quick progress reading
- basic timeline/replay controls
- basic inspector panel
- realtime monitoring for active runs
- replay for completed runs
- full Haki lifecycle coverage at the top-level state model

### 13.2 Out of scope

Phase 1 should explicitly avoid:
- multi-user collaboration
- remote/shared backend infrastructure
- deep analytics systems
- manual graph authoring tools
- heavy 3D rendering or effects-first implementation
- advanced historical querying/search beyond replay needs

## 14. Recommended implementation posture

Phase 1 should prioritize correctness before flourish:
- get the event model right
- keep projections reliable
- make sync deterministic
- establish a distinct but not overbuilt visual signature

The cinematic layer matters, but it should sit on a trustworthy event/projection foundation.

## 15. Summary

`haki-ui` should be implemented as a dedicated web product that turns Haki's workflow into a synchronized dual-view experience: a cinematic graph for storytelling and a stage-oriented view for operational clarity. The entire system should be driven by append-only structured events, with replay and live monitoring using the same projection model. The design deliberately favors deterministic synchronization and a strong visual identity while limiting phase-1 scope to the smallest product that can credibly demonstrate the full Haki lifecycle.