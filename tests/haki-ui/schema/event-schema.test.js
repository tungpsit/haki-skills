const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeStatusLabel,
  createEvent,
  validateEvent,
} = require("../../../.agent/bin/lib/haki-ui/event-schema.cjs");

test("normalizeStatusLabel maps roadmap labels to canonical statuses", () => {
  assert.equal(normalizeStatusLabel("⏳ Pending"), "pending");
  assert.equal(normalizeStatusLabel("💬 Discussed"), "discussed");
  assert.equal(normalizeStatusLabel("🔄 In Progress"), "executing");
});

test("createEvent fills defaults for task events", () => {
  const event = createEvent({
    runId: "run_1",
    sessionId: "session_1",
    type: "task.planned",
    entityId: "1.1",
    phase: "plan",
    payload: { taskTitle: "Build UI" },
  });

  assert.equal(event.entityType, "task");
  assert.equal(event.status, "planned");
  assert.equal(event.phase, "plan");
});

test("validateEvent rejects unknown event type", () => {
  assert.throws(() =>
    validateEvent({
      id: "evt_1",
      timestamp: new Date().toISOString(),
      runId: "run_1",
      sessionId: "session_1",
      type: "task.unknown",
      entityType: "task",
      entityId: "1.1",
      payload: {},
    }),
  );
});
