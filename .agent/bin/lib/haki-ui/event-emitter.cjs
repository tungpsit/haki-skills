const { createEvent, createRunId, createSessionId } = require("./event-schema.cjs");
const {
  appendEventToRun,
  buildRunContext,
  readRunMeta,
  writeRunMeta,
} = require("./event-store-jsonl.cjs");

function getOrCreateRunContext(cwd) {
  const existing = readRunMeta(cwd);
  if (existing?.runId && existing?.sessionId && existing?.logPath) {
    return existing;
  }

  const runId = createRunId();
  const sessionId = createSessionId();
  return buildRunContext(cwd, runId, sessionId);
}

function setCurrentRunContext(cwd, context) {
  return writeRunMeta(cwd, context);
}

function emitEvent(cwd, input) {
  try {
    const context = getOrCreateRunContext(cwd);
    const event = createEvent({
      runId: context.runId,
      sessionId: context.sessionId,
      ...input,
    });
    appendEventToRun(context, event);
    return event;
  } catch {
    return null;
  }
}

function createRunContext(cwd, createdAt = new Date().toISOString()) {
  return buildRunContext(cwd, createRunId(), createSessionId(), createdAt);
}

function readCurrentRunContext(cwd) {
  return readRunMeta(cwd);
}

function writeCurrentRunContext(cwd, context) {
  return writeRunMeta(cwd, context);
}

module.exports = {
  getOrCreateRunContext,
  setCurrentRunContext,
  emitEvent,
  createRunContext,
  readCurrentRunContext,
  writeCurrentRunContext,
};
