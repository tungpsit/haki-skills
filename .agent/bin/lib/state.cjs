/**
 * State — Project state detection for /haki:next routing
 *
 * Analyzes .haki/ directory to determine:
 * - Project initialization status
 * - Research completion
 * - Task lifecycle position (pending → discussed → planned → executing → complete)
 * - Next recommended action
 */

const fs = require("fs");
const path = require("path");
const {
  output,
  error,
  hakiPaths,
  safeReadFile,
  HAKI_DIR,
} = require("./core.cjs");
const { parseRoadmap } = require("./roadmap.cjs");

/**
 * Detect the full project state and return a snapshot.
 */
function detectState(cwd) {
  const paths = hakiPaths(cwd);
  const state = {
    initialized: false,
    has_project: false,
    has_roadmap: false,
    has_config: false,
    has_research: false,
    has_codebase_map: false,
    tasks: {
      total: 0,
      pending: 0,
      discussed: 0,
      planned: 0,
      in_progress: 0,
      completed: 0,
      blocked: 0,
    },
    next_action: null,
    next_args: null,
    next_reason: null,
  };

  // Check .haki/ exists
  if (!fs.existsSync(paths.haki)) {
    state.next_action = "/haki:new-project";
    state.next_reason = "No .haki/ directory found";
    return state;
  }

  state.initialized = true;
  state.has_project = fs.existsSync(paths.project);
  state.has_roadmap = fs.existsSync(paths.roadmap);
  state.has_config = fs.existsSync(paths.config);

  // Check research
  if (fs.existsSync(paths.research)) {
    try {
      const entries = fs.readdirSync(paths.research);
      state.has_research = entries.length > 0;
    } catch {
      /* ignore */
    }
  }

  // Check codebase map
  if (fs.existsSync(paths.codebase)) {
    try {
      const entries = fs.readdirSync(paths.codebase);
      state.has_codebase_map = entries.length > 0;
    } catch {
      /* ignore */
    }
  }

  // No project file yet
  if (!state.has_project) {
    state.next_action = "/haki:new-project";
    state.next_reason = "PROJECT.md not found";
    return state;
  }

  // No roadmap yet
  if (!state.has_roadmap) {
    state.next_action = "/haki:new-project";
    state.next_reason = "ROADMAP.md not found";
    return state;
  }

  // Parse roadmap for task analysis
  const roadmapContent = safeReadFile(paths.roadmap);
  if (roadmapContent) {
    const { tasks } = parseRoadmap(roadmapContent);
    state.tasks.total = tasks.length;

    for (const task of tasks) {
      if (task.status.includes("Completed")) state.tasks.completed++;
      else if (task.status.includes("In Progress")) state.tasks.in_progress++;
      else if (task.status.includes("Planned")) state.tasks.planned++;
      else if (task.status.includes("Discussed")) state.tasks.discussed++;
      else if (task.status.includes("Blocked")) state.tasks.blocked++;
      else state.tasks.pending++;
    }

    // Determine next action based on task states
    // Route 1: In-progress tasks → continue executing
    if (state.tasks.in_progress > 0) {
      const task = tasks.find((t) => t.status.includes("In Progress"));
      state.next_action = "/haki:exec";
      state.next_args = task?.id;
      state.next_reason = `Task ${task?.id} is in progress`;
    }
    // Route 2: Planned tasks → execute
    else if (state.tasks.planned > 0) {
      const task = tasks.find((t) => t.status.includes("Planned"));
      state.next_action = "/haki:exec";
      state.next_args = task?.id;
      state.next_reason = `Task ${task?.id} is planned and ready to execute`;
    }
    // Route 3: Discussed tasks → plan
    else if (state.tasks.discussed > 0) {
      const task = tasks.find((t) => t.status.includes("Discussed"));
      state.next_action = "/haki:plan";
      state.next_args = task?.id;
      state.next_reason = `Task ${task?.id} is discussed, needs planning`;
    }
    // Route 4: Pending tasks → discuss
    else if (state.tasks.pending > 0) {
      const task = tasks.find((t) => t.status.includes("Pending"));
      state.next_action = "/haki:discuss";
      state.next_args = task?.id;
      state.next_reason = `Task ${task?.id} is pending, needs discussion`;
    }
    // Route 5: All complete → milestone
    else if (
      state.tasks.completed === state.tasks.total &&
      state.tasks.total > 0
    ) {
      state.next_action = "milestone";
      state.next_reason = "All tasks completed — ready for milestone";
    }
  }

  return state;
}

/**
 * CLI command: detect state and output as JSON.
 */
function cmdStateDetect(cwd, raw) {
  const state = detectState(cwd);
  output(state, raw);
}

/**
 * CLI command: output compact state JSON for /haki:next.
 */
function cmdStateJson(cwd, raw) {
  const state = detectState(cwd);

  const progressPercent =
    state.tasks.total > 0
      ? Math.round((state.tasks.completed / state.tasks.total) * 100)
      : 0;

  output(
    {
      initialized: state.initialized,
      progress: progressPercent,
      next_action: state.next_action,
      next_args: state.next_args,
      next_reason: state.next_reason,
      tasks: state.tasks,
    },
    raw,
  );
}

module.exports = {
  detectState,
  cmdStateDetect,
  cmdStateJson,
};
