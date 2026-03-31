const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { createServer } = require("../../../.agent/bin/lib/haki-ui/sse-server.cjs");

function requestJson(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "127.0.0.1", port, path: pathname }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(JSON.parse(body)));
    });
    req.on("error", reject);
  });
}

test("createServer serves projection and replay endpoints", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "haki-ui-server-"));
  const hakiDir = path.join(root, ".haki", "ui");
  fs.mkdirSync(path.join(hakiDir, "runs"), { recursive: true });

  const runMeta = {
    runId: "run_1",
    sessionId: "session_1",
    logPath: path.join(hakiDir, "runs", "run_1.jsonl"),
  };

  fs.writeFileSync(path.join(hakiDir, "current-run.json"), JSON.stringify(runMeta, null, 2));
  fs.writeFileSync(
    runMeta.logPath,
    [
      JSON.stringify({
        id: "evt_1",
        timestamp: "2026-03-31T10:00:00.000Z",
        type: "run.started",
        entityType: "run",
        entityId: "run_1",
        runId: "run_1",
        sessionId: "session_1",
        payload: {},
      }),
      JSON.stringify({
        id: "evt_2",
        timestamp: "2026-03-31T10:00:01.000Z",
        type: "task.planned",
        entityType: "task",
        entityId: "1.1",
        runId: "run_1",
        sessionId: "session_1",
        phase: "plan",
        status: "planned",
        payload: { taskTitle: "Build UI" },
      }),
    ].join("\n") + "\n",
  );

  const server = createServer({ cwd: root, pollInterval: 50 });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const events = await requestJson(port, "/api/events");
  assert.equal(events.events.length, 2);

  const projections = await requestJson(port, "/api/projections");
  assert.equal(projections.projections.timeline.events.length, 2);

  const replay = await requestJson(port, "/api/replay?playhead=0");
  assert.equal(replay.replay.projections.timeline.events.length, 1);

  await new Promise((resolve) => server.close(resolve));
});
