const crypto = require("crypto");

const PHASES = [
  "new-project",
  "discuss",
  "plan",
  "exec",
  "verify",
  "done",
  "failed",
];

const TASK_STATUSES = [
  "pending",
  "discussing",
  "discussed",
  "planning",
  "planned",
  "executing",
  "completed",
  "blocked",
];

const PHASE_STATUSES = ["pending", "active", "completed", "blocked"];
const AGENT_STATUSES = ["queued", "running", "succeeded", "failed"];

const EVENT_TYPES = new Set([
  "run.started",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "workflow.entered",
  "workflow.exited",
  "phase.pending",
  "phase.active",
  "phase.completed",
  "phase.blocked",
  "task.created",
  "task.discussing",
  "task.discussed",
  "task.planning",
  "task.planned",
  "task.executing",
  "task.completed",
  "task.blocked",
  "agent.started",
  "agent.completed",
  "agent.failed",
  "review.requested",
  "review.approved",
  "review.changed_requested",
  "route.selected",
]);

const STATUS_LABEL_MAP = new Map([
  ["⏳ Pending", "pending"],
  ["💬 Discussed", "discussed"],
  ["📋 Planned", "planned"],
  ["🔄 In Progress", "executing"],
  ["✅ Completed", "completed"],
  ["⏸️ Blocked", "blocked"],
  ["pending", "pending"],
  ["discussing", "discussing"],
  ["discussed", "discussed"],
  ["planning", "planning"],
  ["planned", "planned"],
  ["executing", "executing"],
  ["in_progress", "executing"],
  ["completed", "completed"],
  ["blocked", "blocked"],
]);

const TYPE_DEFAULTS = {
  "run.started": { entityType: "run" },
  "run.completed": { entityType: "run" },
  "run.failed": { entityType: "run" },
  "run.cancelled": { entityType: "run" },
  "workflow.entered": { entityType: "workflow" },
  "workflow.exited": { entityType: "workflow" },
  "phase.pending": { entityType: "phase", status: "pending" },
  "phase.active": { entityType: "phase", status: "active" },
  "phase.completed": { entityType: "phase", status: "completed" },
  "phase.blocked": { entityType: "phase", status: "blocked" },
  "task.created": { entityType: "task" },
  "task.discussing": { entityType: "task", status: "discussing" },
  "task.discussed": { entityType: "task", status: "discussed" },
  "task.planning": { entityType: "task", status: "planning" },
  "task.planned": { entityType: "task", status: "planned" },
  "task.executing": { entityType: "task", status: "executing" },
  "task.completed": { entityType: "task", status: "completed" },
  "task.blocked": { entityType: "task", status: "blocked" },
  "agent.started": { entityType: "agent", status: "running" },
  "agent.completed": { entityType: "agent", status: "succeeded" },
  "agent.failed": { entityType: "agent", status: "failed" },
  "review.requested": { entityType: "review" },
  "review.approved": { entityType: "review" },
  "review.changed_requested": { entityType: "review" },
  "route.selected": { entityType: "workflow" },
};

function normalizeStatusLabel(value) {
  if (!value) return null;
  const normalized = STATUS_LABEL_MAP.get(String(value).trim());
  return normalized || String(value).trim().toLowerCase();
}

function isKnownStatus(status) {
  return (
    TASK_STATUSES.includes(status) ||
    PHASE_STATUSES.includes(status) ||
    AGENT_STATUSES.includes(status)
  );
}

function inferPhase(value) {
  if (!value) return null;
  const phase = String(value).trim().toLowerCase();
  return PHASES.includes(phase) ? phase : null;
}

function createRunId() {
  return `run_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function createSessionId() {
  return `session_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function createEvent(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Event input must be an object");
  }

  const defaults = TYPE_DEFAULTS[input.type] || {};
  const event = {
    id: input.id || `evt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    timestamp: input.timestamp || new Date().toISOString(),
    runId: input.runId,
    sessionId: input.sessionId,
    type: input.type,
    entityType: input.entityType || defaults.entityType,
    entityId: input.entityId || input.runId || input.type,
    parentId: input.parentId || null,
    payload: input.payload || {},
  };

  const phase = inferPhase(input.phase || input.payload?.phase || defaults.phase);
  if (phase) event.phase = phase;

  const status = normalizeStatusLabel(input.status || defaults.status);
  if (status) event.status = status;

  validateEvent(event);
  return event;
}

function validateEvent(event) {
  if (!event.type || !EVENT_TYPES.has(event.type)) {
    throw new Error(`Unknown event type: ${event.type}`);
  }

  for (const field of ["id", "timestamp", "runId", "sessionId", "entityType", "entityId"]) {
    if (!event[field]) {
      throw new Error(`Missing required event field: ${field}`);
    }
  }

  if (event.phase && !PHASES.includes(event.phase)) {
    throw new Error(`Unknown phase: ${event.phase}`);
  }

  if (event.status && !isKnownStatus(event.status)) {
    throw new Error(`Unknown status: ${event.status}`);
  }

  return event;
}

module.exports = {
  PHASES,
  TASK_STATUSES,
  PHASE_STATUSES,
  AGENT_STATUSES,
  EVENT_TYPES,
  normalizeStatusLabel,
  inferPhase,
  createRunId,
  createSessionId,
  createEvent,
  validateEvent,
};
