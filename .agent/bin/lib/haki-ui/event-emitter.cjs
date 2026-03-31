const path = require("path");
const { hakiPaths } = require("../core.cjs");
const { createEvent, createRunId, createSessionId } = require("./event-schema.cjs");
const {
  appendEvent,
  writeCurrentRunMeta,
  readCurrentRunMeta,
} = require("./event-store-jsonl.cjs");

function getOrCreateRunContext(cwd) {
  const paths = hakiPaths(cwd);
  const existing = readCurrentRunMeta(paths.haki_ui_current_run);
  if (existing?.runId && existing?.sessionId && existing?.logPath) {
    return existing;
  }

  const runId = createRunId();
  const sessionId = createSessionId();
  const logPath = path.join(paths.haki_ui_runs, `${runId}.jsonl`);
  const context = { runId, sessionId, logPath, createdAt: new Date().toISOString() };
  writeCurrentRunMeta(paths.haki_ui_current_run, context);
  return context;
}

function setCurrentRunContext(cwd, context) {
  const paths = hakiPaths(cwd);
  writeCurrentRunMeta(paths.haki_ui_current_run, context);
}

function emitEvent(cwd, input) {
  try {
    const context = getOrCreateRunContext(cwd);
    const event = createEvent({
      runId: context.runId,
      sessionId: context.sessionId,
      ...input,
    });
    appendEvent(context.logPath, event);
    return event;
  } catch {
    return null;
  }
}

module.exports = {
  getOrCreateRunContext,
  setCurrentRunContext,
  emitEvent,
};
