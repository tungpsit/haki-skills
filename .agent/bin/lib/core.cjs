/**
 * Core — Shared utilities for haki-tools CLI
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// ─── Constants ───────────────────────────────────────────────────────────────

const HAKI_DIR = ".haki";

// ─── Path helpers ────────────────────────────────────────────────────────────

/** Normalize path to forward slashes (cross-platform). */
function toPosixPath(p) {
  return p.split(path.sep).join("/");
}

/**
 * Walk up from startDir to find the project root that owns .haki/.
 * Returns startDir if no ancestor .haki/ found (first-run).
 */
function findProjectRoot(startDir) {
  const resolved = path.resolve(startDir);
  const root = path.parse(resolved).root;
  const homedir = require("os").homedir();

  let dir = resolved;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, HAKI_DIR))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir || parent === homedir) break;
    dir = parent;
  }
  return startDir;
}

/**
 * Get all .haki file paths for a project.
 */
function hakiPaths(cwd) {
  const base = path.join(cwd, HAKI_DIR);
  const runtime = path.join(base, "runtime");
  const runtimeUi = path.join(runtime, "ui");
  const runtimeUiRuns = path.join(runtimeUi, "runs");
  const runtimeUiSnapshots = path.join(runtimeUi, "snapshots");
  const runtimeBrainstorm = path.join(runtime, "brainstorm");
  const runtimeBrainstormSessions = path.join(runtimeBrainstorm, "sessions");
  const generated = path.join(base, "generated");
  const generatedDocs = path.join(generated, "docs");
  const generatedDocsUserGuides = path.join(generatedDocs, "user-guides");

  const legacyHakiUi = path.join(base, "ui");
  const legacyHakiUiRuns = path.join(legacyHakiUi, "runs");
  const legacyHakiUiSnapshots = path.join(legacyHakiUi, "snapshots");

  return {
    haki: base,
    project: path.join(base, "PROJECT.md"),
    roadmap: path.join(base, "ROADMAP.md"),
    config: path.join(base, "config.json"),
    milestones: path.join(base, "MILESTONES.md"),
    research: path.join(base, "research"),
    codebase: path.join(base, "codebase"),
    tasks: path.join(base, "tasks"),
    runtime,
    runtime_ui: runtimeUi,
    runtime_ui_runs: runtimeUiRuns,
    runtime_ui_current_run: path.join(runtimeUi, "current-run.json"),
    runtime_ui_snapshots: runtimeUiSnapshots,
    runtime_brainstorm: runtimeBrainstorm,
    runtime_brainstorm_sessions: runtimeBrainstormSessions,
    generated,
    generated_docs: generatedDocs,
    generated_docs_user_guides: generatedDocsUserGuides,
    haki_ui: legacyHakiUi,
    haki_ui_runs: legacyHakiUiRuns,
    haki_ui_current_run: path.join(legacyHakiUi, "current-run.json"),
    haki_ui_current_log: path.join(legacyHakiUi, "current-run.jsonl"),
    haki_ui_snapshots: legacyHakiUiSnapshots,
  };
}

// ─── Output helpers ──────────────────────────────────────────────────────────

function output(result, raw, rawValue) {
  let data;
  if (raw && rawValue !== undefined) {
    data = String(rawValue);
  } else {
    data = JSON.stringify(result, null, 2);
  }
  fs.writeSync(1, data);
}

function error(message) {
  fs.writeSync(2, "Error: " + message + "\n");
  process.exit(1);
}

// ─── File utilities ──────────────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    error("Failed to create directory: " + dirPath + " — " + err.message);
  }
}

function safeWriteFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

// ─── Markdown normalization ─────────────────────────────────────────────────

/**
 * Normalize markdown for IDE-friendly output.
 * Enforces: blank lines around headings, code blocks, lists.
 * Collapses 3+ blank lines to 2. Ensures trailing newline.
 */
function normalizeMd(content) {
  if (!content || typeof content !== "string") return content;

  let text = content.replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = i > 0 ? lines[i - 1] : "";
    const prevTrimmed = prev.trimEnd();
    const trimmed = line.trimEnd();

    // Blank line before headings
    if (
      /^#{1,6}\s/.test(trimmed) &&
      i > 0 &&
      prevTrimmed !== "" &&
      prevTrimmed !== "---"
    ) {
      result.push("");
    }

    // Blank line before code blocks
    if (
      /^```/.test(trimmed) &&
      i > 0 &&
      prevTrimmed !== "" &&
      !isInsideFencedBlock(lines, i)
    ) {
      result.push("");
    }

    // Blank line before lists
    if (
      /^(\s*[-*+]\s|\s*\d+\.\s)/.test(line) &&
      i > 0 &&
      prevTrimmed !== "" &&
      !/^(\s*[-*+]\s|\s*\d+\.\s)/.test(prev) &&
      prevTrimmed !== "---"
    ) {
      result.push("");
    }

    result.push(line);

    // Blank line after headings
    if (/^#{1,6}\s/.test(trimmed) && i < lines.length - 1) {
      const next = lines[i + 1];
      if (next !== undefined && next.trimEnd() !== "") result.push("");
    }
  }

  text = result.join("\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/\n*$/, "\n");
  return text;
}

function isInsideFencedBlock(lines, i) {
  let count = 0;
  for (let j = 0; j < i; j++) {
    if (/^```/.test(lines[j].trimEnd())) count++;
  }
  return count % 2 === 1;
}

// ─── Git utilities ───────────────────────────────────────────────────────────

function execGit(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    stdio: "pipe",
    encoding: "utf-8",
  });
  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? "").toString().trim(),
    stderr: (result.stderr ?? "").toString().trim(),
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  HAKI_DIR,
  toPosixPath,
  findProjectRoot,
  hakiPaths,
  output,
  error,
  safeReadFile,
  ensureDir,
  safeWriteFile,
  normalizeMd,
  execGit,
};
