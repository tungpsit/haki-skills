const fs = require("fs");
const path = require("path");
const { ensureDir, safeReadFile } = require("../core.cjs");

function appendEvent(logPath, event) {
  ensureDir(path.dirname(logPath));
  fs.appendFileSync(logPath, `${JSON.stringify(event)}\n`, "utf-8");
}

function readEvents(logPath) {
  const content = safeReadFile(logPath);
  if (!content) return [];

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function writeCurrentRunMeta(metaPath, meta) {
  ensureDir(path.dirname(metaPath));
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
}

function readCurrentRunMeta(metaPath) {
  const content = safeReadFile(metaPath);
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getLastEventId(logPath) {
  const events = readEvents(logPath);
  return events.length > 0 ? events[events.length - 1].id : null;
}

module.exports = {
  appendEvent,
  readEvents,
  writeCurrentRunMeta,
  readCurrentRunMeta,
  getLastEventId,
};
