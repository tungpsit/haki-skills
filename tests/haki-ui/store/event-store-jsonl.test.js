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
