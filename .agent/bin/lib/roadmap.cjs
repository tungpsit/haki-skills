/**
 * Roadmap — ROADMAP.md parsing and update operations
 *
 * Parses the haki ROADMAP.md format with tasks like:
 *   ### Task 1.1: Name (`id`)
 *   **Status:** ⏳ Pending | 💬 Discussed | 📋 Planned | 🔄 In Progress | ✅ Completed | ⏸️ Blocked
 */

const fs = require("fs");
const path = require("path");
const { output, error, hakiPaths, safeReadFile } = require("./core.cjs");

// Status values and their order
const STATUS_ORDER = [
  "⏳ Pending",
  "💬 Discussed",
  "📋 Planned",
  "🔄 In Progress",
  "✅ Completed",
  "⏸️ Blocked",
];
const STATUS_EMOJI = {
  pending: "⏳ Pending",
  discussed: "💬 Discussed",
  planned: "📋 Planned",
  in_progress: "🔄 In Progress",
  completed: "✅ Completed",
  blocked: "⏸️ Blocked",
};

/**
 * Parse ROADMAP.md and extract all tasks with their metadata.
 */
function parseRoadmap(content) {
  if (!content) return { phases: [], tasks: [] };

  const phases = [];
  const tasks = [];

  // Extract phases: ## Phase N: Name
  const phasePattern = /^##\s+Phase\s+(\d+):\s*(.+)$/gm;
  let phaseMatch;
  while ((phaseMatch = phasePattern.exec(content)) !== null) {
    phases.push({
      number: parseInt(phaseMatch[1], 10),
      name: phaseMatch[2].trim(),
      startIndex: phaseMatch.index,
    });
  }

  // Extract tasks: ### Task X.Y: Name (`id`)
  const taskPattern =
    /^###\s+Task\s+([\d.]+):\s*(.+?)(?:\s*\(`?([^)`]+)`?\))?\s*$/gm;
  let taskMatch;
  while ((taskMatch = taskPattern.exec(content)) !== null) {
    const taskId = taskMatch[1]; // e.g., "1.1"
    const taskName = taskMatch[2].trim();
    const taskSlug = taskMatch[3] || null; // e.g., "foundation:database"

    // Find the section for this task
    const sectionStart = taskMatch.index;
    const restOfContent = content.slice(sectionStart);
    const nextTaskOrPhase = restOfContent.match(
      /\n###?\s+(Task\s+[\d.]|Phase\s+\d)/,
    );
    const sectionEnd = nextTaskOrPhase
      ? sectionStart + nextTaskOrPhase.index
      : content.length;
    const section = content.slice(sectionStart, sectionEnd);

    // Extract status
    const statusMatch = section.match(/\*\*Status:\*\*\s*(.+)/);
    const status = statusMatch ? statusMatch[1].trim() : "⏳ Pending";

    // Extract priority
    const priorityMatch = section.match(/\*\*Priority:\*\*\s*(\d+)/);
    const priority = priorityMatch ? parseInt(priorityMatch[1], 10) : 0;

    // Extract dependencies
    const depsMatch = section.match(/\*\*Dependencies:\*\*\s*(.+)/);
    const dependencies =
      depsMatch && depsMatch[1].trim() !== "None"
        ? depsMatch[1]
            .trim()
            .split(",")
            .map((d) => d.trim())
        : [];

    // Extract plan link
    const planMatch = section.match(/\*\*Plan:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
    const planLink = planMatch ? planMatch[2] : null;

    // Determine phase
    let phaseNum = null;
    for (const p of phases) {
      if (sectionStart >= p.startIndex) phaseNum = p.number;
    }

    tasks.push({
      id: taskId,
      name: taskName,
      slug: taskSlug,
      status,
      priority,
      dependencies,
      planLink,
      phase: phaseNum,
      sectionStart,
      sectionEnd,
    });
  }

  return { phases, tasks };
}

/**
 * Parse ROADMAP.md and return structured analysis.
 */
function cmdRoadmapAnalyze(cwd, raw) {
  const roadmapPath = hakiPaths(cwd).roadmap;
  const content = safeReadFile(roadmapPath);

  if (!content) {
    output({ error: "ROADMAP.md not found", phases: [], tasks: [] }, raw);
    return;
  }

  const { phases, tasks } = parseRoadmap(content);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) =>
    t.status.includes("Completed"),
  ).length;
  const inProgressTasks = tasks.filter((t) =>
    t.status.includes("In Progress"),
  ).length;
  const plannedTasks = tasks.filter((t) => t.status.includes("Planned")).length;
  const discussedTasks = tasks.filter((t) =>
    t.status.includes("Discussed"),
  ).length;
  const pendingTasks = tasks.filter((t) => t.status.includes("Pending")).length;

  output(
    {
      phases: phases.map((p) => ({ number: p.number, name: p.name })),
      tasks: tasks.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        priority: t.priority,
        dependencies: t.dependencies,
        phase: t.phase,
      })),
      stats: {
        total: totalTasks,
        completed: completedTasks,
        in_progress: inProgressTasks,
        planned: plannedTasks,
        discussed: discussedTasks,
        pending: pendingTasks,
        progress_percent:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    },
    raw,
  );
}

/**
 * Find the next actionable task from ROADMAP.md.
 * Priority: in_progress > planned > discussed > pending
 */
function cmdRoadmapNextTask(cwd, raw) {
  const roadmapPath = hakiPaths(cwd).roadmap;
  const content = safeReadFile(roadmapPath);

  if (!content) {
    output({ found: false, reason: "no_roadmap" }, raw, "");
    return;
  }

  const { tasks } = parseRoadmap(content);

  // Find first task by lifecycle priority
  const inProgress = tasks.find((t) => t.status.includes("In Progress"));
  if (inProgress) {
    output(
      { found: true, task: inProgress, action: "exec" },
      raw,
      inProgress.id,
    );
    return;
  }

  const planned = tasks.find((t) => t.status.includes("Planned"));
  if (planned) {
    output({ found: true, task: planned, action: "exec" }, raw, planned.id);
    return;
  }

  const discussed = tasks.find((t) => t.status.includes("Discussed"));
  if (discussed) {
    output({ found: true, task: discussed, action: "plan" }, raw, discussed.id);
    return;
  }

  const pending = tasks.find((t) => t.status.includes("Pending"));
  if (pending) {
    output({ found: true, task: pending, action: "discuss" }, raw, pending.id);
    return;
  }

  output({ found: false, reason: "all_complete" }, raw, "");
}

/**
 * Update the status of a task in ROADMAP.md.
 */
function cmdRoadmapUpdateStatus(cwd, taskId, newStatus, raw) {
  if (!taskId) error("Usage: roadmap update-status <task-id> <status>");
  if (!newStatus) error("Usage: roadmap update-status <task-id> <status>");

  const statusValue = STATUS_EMOJI[newStatus.toLowerCase()] || newStatus;
  const roadmapPath = hakiPaths(cwd).roadmap;
  let content = safeReadFile(roadmapPath);

  if (!content) {
    error("ROADMAP.md not found");
    return;
  }

  // Find and replace the status line for this task
  const escapedId = taskId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const taskPattern = new RegExp(
    `(###\\s+Task\\s+${escapedId}:[\\s\\S]*?\\*\\*Status:\\*\\*\\s*)([^\\n]+)`,
    "i",
  );

  const match = content.match(taskPattern);
  if (!match) {
    error(`Task ${taskId} not found in ROADMAP.md`);
    return;
  }

  content = content.replace(taskPattern, `$1${statusValue}`);
  fs.writeFileSync(roadmapPath, content, "utf-8");

  output(
    {
      updated: true,
      task: taskId,
      status: statusValue,
    },
    raw,
    `${taskId}: ${statusValue}`,
  );
}

module.exports = {
  STATUS_EMOJI,
  parseRoadmap,
  cmdRoadmapAnalyze,
  cmdRoadmapNextTask,
  cmdRoadmapUpdateStatus,
};
