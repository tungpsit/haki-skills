const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildGraphProjection,
  buildStageProjection,
  buildTimelineProjection,
  buildProjections,
} = require("../../../.agent/bin/lib/haki-ui/projections.cjs");
const { buildReplayState } = require("../../../.agent/bin/lib/haki-ui/replay-engine.cjs");

const events = [
  {
    id: "evt_1",
    timestamp: "2026-03-31T10:00:00.000Z",
    type: "run.started",
    entityType: "run",
    entityId: "run_1",
    runId: "run_1",
    sessionId: "session_1",
    payload: {},
  },
  {
    id: "evt_2",
    timestamp: "2026-03-31T10:00:01.000Z",
    type: "task.discussed",
    entityType: "task",
    entityId: "1.1",
    runId: "run_1",
    sessionId: "session_1",
    phase: "discuss",
    status: "discussed",
    payload: { taskTitle: "Map codebase" },
  },
  {
    id: "evt_3",
    timestamp: "2026-03-31T10:00:02.000Z",
    type: "task.planned",
    entityType: "task",
    entityId: "1.1",
    runId: "run_1",
    sessionId: "session_1",
    phase: "plan",
    status: "planned",
    payload: { taskTitle: "Map codebase" },
  },
];

test("buildGraphProjection creates nodes and edges", () => {
  const graph = buildGraphProjection(events);
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 2);
  assert.equal(graph.activeNodeId, "task:1.1");
});

test("buildStageProjection groups events by phase", () => {
  const stage = buildStageProjection(events);
  assert.equal(stage.lanes.length, 3);
  assert.equal(stage.lanes.find((lane) => lane.phase === "plan").statuses.planned, 1);
});

test("buildTimelineProjection returns ordered timeline entries", () => {
  const timeline = buildTimelineProjection(events);
  assert.equal(timeline.events.length, 3);
  assert.equal(timeline.playhead, 2);
});

test("buildReplayState slices events by playhead deterministically", () => {
  const replay = buildReplayState(events, 1);
  assert.equal(replay.playhead, 1);
  assert.equal(replay.totalEvents, 3);
  assert.equal(replay.projections.timeline.events.length, 2);
});

test("buildProjections combines graph, stage, and timeline", () => {
  const projections = buildProjections(events);
  assert.ok(projections.graph);
  assert.ok(projections.stage);
  assert.ok(projections.timeline);
});
