const fs = require("fs");
const path = require("path");
const { ensureDir, safeReadFile, hakiPaths } = require("../core.cjs");

function writeJsonl(logPath, entries) {
  ensureDir(path.dirname(logPath));
  const lines = entries.map((entry) => JSON.stringify(entry)).join("\n");
  fs.writeFileSync(logPath, `${lines}${entries.length ? "\n" : ""}`, "utf-8");
}

function parseEvents(content) {
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

function appendEvent(logPath, event, mirrorLogPath) {
  ensureDir(path.dirname(logPath));
  fs.appendFileSync(logPath, `${JSON.stringify(event)}\n`, "utf-8");

  if (mirrorLogPath && path.resolve(mirrorLogPath) !== path.resolve(logPath)) {
    ensureDir(path.dirname(mirrorLogPath));
    fs.appendFileSync(mirrorLogPath, `${JSON.stringify(event)}\n`, "utf-8");
  }
}

function readEvents(logPath, fallbackLogPath) {
  const content = safeReadFile(logPath);
  if (content) return parseEvents(content);

  if (!fallbackLogPath) return [];
  const fallbackContent = safeReadFile(fallbackLogPath);
  if (!fallbackContent) return [];
  return parseEvents(fallbackContent);
}

function writeCurrentRunMeta(metaPath, meta, mirrorMetaPath) {
  ensureDir(path.dirname(metaPath));
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

  if (mirrorMetaPath && path.resolve(mirrorMetaPath) !== path.resolve(metaPath)) {
    ensureDir(path.dirname(mirrorMetaPath));
    fs.writeFileSync(mirrorMetaPath, JSON.stringify(meta, null, 2), "utf-8");
  }
}

function readCurrentRunMeta(metaPath, fallbackMetaPath) {
  const content = safeReadFile(metaPath);
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  if (!fallbackMetaPath) return null;
  const fallbackContent = safeReadFile(fallbackMetaPath);
  if (!fallbackContent) return null;

  try {
    return JSON.parse(fallbackContent);
  } catch {
    return null;
  }
}

function canonicalRunContext(cwd, meta) {
  if (!meta?.runId || !meta?.sessionId) return null;

  const paths = hakiPaths(cwd);
  const canonicalLogPath = path.join(paths.runtime_ui_runs, `${meta.runId}.jsonl`);
  const legacyLogPath = path.join(paths.haki_ui_runs, `${meta.runId}.jsonl`);

  return {
    ...meta,
    logPath: canonicalLogPath,
    canonicalLogPath,
    legacyLogPath,
    pathVersion: 2,
  };
}

function migrateLegacyLog(canonicalLogPath, legacyLogPath) {
  if (safeReadFile(canonicalLogPath) || !safeReadFile(legacyLogPath)) return;
  const legacyEvents = readEvents(legacyLogPath);
  writeJsonl(canonicalLogPath, legacyEvents);
}

function loadRunContext(cwd) {
  const paths = hakiPaths(cwd);
  const meta = readCurrentRunMeta(paths.runtime_ui_current_run, paths.haki_ui_current_run);
  if (!meta) return null;

  const context = canonicalRunContext(cwd, meta);
  if (!context) return null;

  migrateLegacyLog(context.canonicalLogPath, context.legacyLogPath);
  return context;
}

function persistRunContext(cwd, context) {
  const paths = hakiPaths(cwd);
  const canonical = canonicalRunContext(cwd, context);
  if (!canonical) return null;

  const canonicalMeta = {
    runId: canonical.runId,
    sessionId: canonical.sessionId,
    logPath: canonical.canonicalLogPath,
    createdAt: canonical.createdAt,
    pathVersion: 2,
  };
  const legacyMeta = {
    ...canonicalMeta,
    logPath: canonical.legacyLogPath,
    pathVersion: 1,
  };

  writeCurrentRunMeta(paths.runtime_ui_current_run, canonicalMeta);
  writeCurrentRunMeta(paths.haki_ui_current_run, legacyMeta);
  if (safeReadFile(canonical.legacyLogPath) == null) {
    writeJsonl(canonical.legacyLogPath, readEvents(canonical.canonicalLogPath));
  }

  return {
    ...canonicalMeta,
    logPath: canonical.canonicalLogPath,
    canonicalLogPath: canonical.canonicalLogPath,
    legacyLogPath: canonical.legacyLogPath,
    legacyMeta,
  };
}

function appendEventToRun(context, event) {
  appendEvent(context.canonicalLogPath || context.logPath, event, context.legacyLogPath);
}

function readEventsForRun(context) {
  return readEvents(context.canonicalLogPath || context.logPath, context.legacyLogPath);
}

function readRunMeta(cwd) {
  return loadRunContext(cwd);
}

function writeRunMeta(cwd, context) {
  return persistRunContext(cwd, context);
}

function buildRunContext(cwd, runId, sessionId, createdAt = new Date().toISOString()) {
  return persistRunContext(cwd, { runId, sessionId, createdAt });
}

function resolveStaticDir() {
  return path.resolve(__dirname, "../../haki-ui-static");
}

function resolveRunLogPaths(cwd, runId) {
  const paths = hakiPaths(cwd);
  return {
    canonicalLogPath: path.join(paths.runtime_ui_runs, `${runId}.jsonl`),
    legacyLogPath: path.join(paths.haki_ui_runs, `${runId}.jsonl`),
  };
}

function getLegacyRuntimePaths(cwd) {
  const paths = hakiPaths(cwd);
  return {
    legacyMetaPath: paths.haki_ui_current_run,
    legacyRunsPath: paths.haki_ui_runs,
  };
}

function getCanonicalRuntimePaths(cwd) {
  const paths = hakiPaths(cwd);
  return {
    metaPath: paths.runtime_ui_current_run,
    runsPath: paths.runtime_ui_runs,
    snapshotsPath: paths.runtime_ui_snapshots,
  };
}

function getLastEventId(logPath) {
  const events = readEvents(logPath);
  return events.length > 0 ? events[events.length - 1].id : null;
}

module.exports = {
  appendEvent,
  appendEventToRun,
  readEvents,
  readEventsForRun,
  writeCurrentRunMeta,
  readCurrentRunMeta,
  writeRunMeta,
  readRunMeta,
  buildRunContext,
  resolveRunLogPaths,
  resolveStaticDir,
  getCanonicalRuntimePaths,
  getLegacyRuntimePaths,
  getLastEventId,
};
