const fs = require("fs");
const path = require("path");
const http = require("http");
const { hakiPaths, findProjectRoot, safeReadFile } = require("../core.cjs");
const {
  readEvents,
  readCurrentRunMeta,
} = require("./event-store-jsonl.cjs");
const { buildProjections } = require("./projections.cjs");
const { buildReplayState } = require("./replay-engine.cjs");

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function serveStaticFile(filePath, res) {
  const content = safeReadFile(filePath);
  if (content == null) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath);
  const contentType = ext === ".html"
    ? "text/html; charset=utf-8"
    : ext === ".js"
      ? "text/javascript; charset=utf-8"
      : "text/plain; charset=utf-8";

  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
}

function createServer(options = {}) {
  const cwd = findProjectRoot(options.cwd || process.cwd());
  const paths = hakiPaths(cwd);
  const staticDir = options.staticDir || path.resolve(__dirname, "../../haki-ui-static");

  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (url.pathname === "/api/events") {
      const meta = readCurrentRunMeta(paths.haki_ui_current_run);
      const events = meta?.logPath ? readEvents(meta.logPath) : [];
      return sendJson(res, 200, { run: meta, events });
    }

    if (url.pathname === "/api/projections") {
      const meta = readCurrentRunMeta(paths.haki_ui_current_run);
      const events = meta?.logPath ? readEvents(meta.logPath) : [];
      return sendJson(res, 200, { run: meta, projections: buildProjections(events) });
    }

    if (url.pathname === "/api/replay") {
      const meta = readCurrentRunMeta(paths.haki_ui_current_run);
      const events = meta?.logPath ? readEvents(meta.logPath) : [];
      const playhead = Number(url.searchParams.get("playhead"));
      return sendJson(res, 200, { run: meta, replay: buildReplayState(events, playhead) });
    }

    if (url.pathname === "/api/stream") {
      const meta = readCurrentRunMeta(paths.haki_ui_current_run);
      const logPath = meta?.logPath;
      const seen = new Set();

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const pushEvents = () => {
        const events = logPath ? readEvents(logPath) : [];
        for (const event of events) {
          if (seen.has(event.id)) continue;
          seen.add(event.id);
          res.write(`id: ${event.id}\n`);
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      };

      pushEvents();
      const interval = setInterval(pushEvents, options.pollInterval || 500);

      req.on("close", () => {
        clearInterval(interval);
        res.end();
      });
      return;
    }

    const filePath = url.pathname === "/"
      ? path.join(staticDir, "index.html")
      : path.join(staticDir, url.pathname.replace(/^\//, ""));

    if (filePath.startsWith(staticDir)) {
      return serveStaticFile(filePath, res);
    }

    res.writeHead(403);
    res.end("Forbidden");
  });
}

function startServer(options = {}) {
  const server = createServer(options);
  const port = options.port || 4312;
  return new Promise((resolve) => {
    server.listen(port, () => resolve({ server, port }));
  });
}

module.exports = {
  createServer,
  startServer,
};
