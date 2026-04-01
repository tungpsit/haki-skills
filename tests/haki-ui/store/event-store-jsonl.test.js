const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  appendEvent,
  readEvents,
  writeCurrentRunMeta,
  readCurrentRunMeta,
  buildRunContext,
  readRunMeta,
  appendEventToRun,
  readEventsForRun,
} = require("../../../.agent/bin/lib/haki-ui/event-store-jsonl.cjs");

test("appendEvent and readEvents round-trip JSONL events", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "haki-ui-store-"));
  const logPath = path.join(dir, "run.jsonl");

  appendEvent(logPath, { id: "evt_1", type: "run.started" });
  appendEvent(logPath, { id: "evt_2", type: "run.completed" });

  const events = readEvents(logPath);
  assert.equal(events.length, 2);
  assert.equal(events[0].id, "evt_1");
  assert.equal(events[1].id, "evt_2");
});

test("readCurrentRunMeta returns parsed metadata", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "haki-ui-meta-"));
  const metaPath = path.join(dir, "current-run.json");

  writeCurrentRunMeta(metaPath, { runId: "run_1", sessionId: "session_1" });

  const meta = readCurrentRunMeta(metaPath);
  assert.deepEqual(meta, { runId: "run_1", sessionId: "session_1" });
});

test("buildRunContext writes canonical and legacy metadata paths", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "haki-ui-context-"));

  const context = buildRunContext(root, "run_1", "session_1", "2026-04-01T00:00:00.000Z");

  assert.match(context.canonicalLogPath, /[\\/]\.haki[\\/]runtime[\\/]ui[\\/]runs[\\/]run_1\.jsonl$/);
  assert.match(context.legacyLogPath, /[\\/]\.haki[\\/]ui[\\/]runs[\\/]run_1\.jsonl$/);

  const canonicalMeta = JSON.parse(fs.readFileSync(path.join(root, ".haki", "runtime", "ui", "current-run.json"), "utf-8"));
  const legacyMeta = JSON.parse(fs.readFileSync(path.join(root, ".haki", "ui", "current-run.json"), "utf-8"));

  assert.equal(canonicalMeta.pathVersion, 2);
  assert.equal(legacyMeta.pathVersion, 1);
  assert.equal(canonicalMeta.logPath, context.canonicalLogPath);
  assert.equal(legacyMeta.logPath, context.legacyLogPath);
});

test("readRunMeta falls back to legacy metadata and migrates canonical log", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "haki-ui-legacy-"));
  const legacyDir = path.join(root, ".haki", "ui");
  const legacyLogPath = path.join(legacyDir, "runs", "run_1.jsonl");
  fs.mkdirSync(path.dirname(legacyLogPath), { recursive: true });

  const legacyMeta = {
    runId: "run_1",
    sessionId: "session_1",
    logPath: legacyLogPath,
    createdAt: "2026-04-01T00:00:00.000Z",
    pathVersion: 1,
  };

  fs.writeFileSync(path.join(legacyDir, "current-run.json"), JSON.stringify(legacyMeta, null, 2));
  fs.writeFileSync(legacyLogPath, `${JSON.stringify({ id: "evt_1", type: "run.started" })}\n`, "utf-8");

  const context = readRunMeta(root);
  const canonicalLogPath = path.join(root, ".haki", "runtime", "ui", "runs", "run_1.jsonl");

  assert.equal(context.logPath, canonicalLogPath);
  assert.equal(readEventsForRun(context).length, 1);
  assert.equal(readEvents(canonicalLogPath).length, 1);
});

test("appendEventToRun mirrors writes to canonical and legacy logs", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "haki-ui-mirror-"));
  const context = buildRunContext(root, "run_1", "session_1", "2026-04-01T00:00:00.000Z");

  appendEventToRun(context, { id: "evt_1", type: "run.started" });

  const canonicalEvents = readEvents(context.canonicalLogPath);
  const legacyEvents = readEvents(context.legacyLogPath);
  assert.equal(canonicalEvents.length, 1);
  assert.equal(legacyEvents.length, 1);
  assert.equal(canonicalEvents[0].id, "evt_1");
  assert.equal(legacyEvents[0].id, "evt_1");
});
