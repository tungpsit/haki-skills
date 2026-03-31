/**
 * Roadmap — ROADMAP.md parsing and update operations
 *
 * Parses the haki ROADMAP.md format with tasks like:
 *   ### Task 1.1: Name (`id`)
 *   **Status:** ⏳ Pending | 💬 Discussed | 📋 Planned | 🔄 In Progress | ✅ Completed | ⏸️ Blocked
 */

const fs = require("fs");
const { output, error, hakiPaths, safeReadFile } = require("./core.cjs");
const { emitEvent } = require("./haki-ui/event-emitter.cjs");
const { normalizeStatusLabel } = require("./haki-ui/event-schema.cjs");

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

function mapTaskActionToPhase(action) {
  if (action === "discuss") return "discuss";
  if (action === "plan") return "plan";
  if (action === "exec") return "exec";
  return undefined;
}

function mapStatusToEventType(status) {
  switch (normalizeStatusLabel(status)) {
    case "discussed":
      return "task.discussed";
    case "planned":
      return "task.planned";
    case "executing":
      return "task.executing";
    case "completed":
      return "task.completed";
    case "blocked":
      return "task.blocked";
    default:
      return "task.created";
  }
}

function mapTaskPhase(task) {
  if (!task) return undefined;
  if (task.phase === 1) return "new-project";
  if (task.status.includes("Discussed") || task.status.includes("Pending")) {
    return "discuss";
  }
  if (task.status.includes("Planned")) return "plan";
  if (task.status.includes("In Progress") || task.status.includes("Completed") || task.status.includes("Blocked")) {
    return "exec";
  }
  return undefined;
}

function taskPayload(task) {
  return {
    taskId: task.id,
    taskTitle: task.name,
    phaseNumber: task.phase,
    dependencies: task.dependencies,
    priority: task.priority,
    statusLabel: task.status,
  };
}

function taskStatusValue(task) {
  return normalizeStatusLabel(task?.status);
}

function statusInputValue(newStatus) {
  return normalizeStatusLabel(STATUS_EMOJI[newStatus.toLowerCase()] || newStatus);
}

function summaryFromTasks(tasks) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status.includes("Completed")).length,
    in_progress: tasks.filter((task) => task.status.includes("In Progress")).length,
    planned: tasks.filter((task) => task.status.includes("Planned")).length,
    discussed: tasks.filter((task) => task.status.includes("Discussed")).length,
    pending: tasks.filter((task) => task.status.includes("Pending")).length,
  };
}

function progressPercent(summary) {
  return summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
}

function taskOutput(task) {
  return {
    id: task.id,
    name: task.name,
    slug: task.slug,
    status: task.status,
    priority: task.priority,
    dependencies: task.dependencies,
    phase: task.phase,
  };
}

function emitRoadmapEvent(cwd, type, task, payload = {}) {
  emitEvent(cwd, {
    type,
    entityType: "task",
    entityId: task?.id || payload.taskId || type,
    phase: payload.phase,
    status: payload.status,
    parentId: payload.parentId || null,
    payload,
  });
}

function emitWorkflowBoundary(cwd, workflowName, phase, outcome) {
  emitEvent(cwd, {
    type: outcome ? "workflow.exited" : "workflow.entered",
    entityType: "workflow",
    entityId: workflowName,
    phase,
    payload: outcome ? { workflowName, outcome } : { workflowName },
  });
}

function emitPhaseBoundary(cwd, entityId, phase, status, payload) {
  emitEvent(cwd, {
    type:
      status === "active"
        ? "phase.active"
        : status === "blocked"
          ? "phase.blocked"
          : "phase.completed",
    entityType: "phase",
    entityId,
    phase,
    status,
    payload,
  });
}

function emitRouteSelection(cwd, entityId, phase, payload) {
  emitEvent(cwd, {
    type: "route.selected",
    entityType: "workflow",
    entityId,
    phase,
    payload,
  });
}

function emitTaskState(cwd, task, phase, transition, statusOverride) {
  emitRoadmapEvent(cwd, mapStatusToEventType(statusOverride || task.status), task, {
    ...taskPayload(task),
    phase: phase || mapTaskPhase(task),
    status: statusOverride || taskStatusValue(task),
    transition,
  });
}

function parseRoadmap(content) {
  if (!content) return { phases: [], tasks: [] };

  const phases = [];
  const tasks = [];

  const phasePattern = /^##\s+Phase\s+(\d+):\s*(.+)$/gm;
  let phaseMatch;
  while ((phaseMatch = phasePattern.exec(content)) !== null) {
    phases.push({
      number: parseInt(phaseMatch[1], 10),
      name: phaseMatch[2].trim(),
      startIndex: phaseMatch.index,
    });
  }

  const taskPattern =
    /^###\s+Task\s+([\d.]+):\s*(.+?)(?:\s*\(`?([^)`]+)`?\))?\s*$/gm;
  let taskMatch;
  while ((taskMatch = taskPattern.exec(content)) !== null) {
    const taskId = taskMatch[1];
    const taskName = taskMatch[2].trim();
    const taskSlug = taskMatch[3] || null;

    const sectionStart = taskMatch.index;
    const restOfContent = content.slice(sectionStart);
    const nextTaskOrPhase = restOfContent.match(/\n###?\s+(Task\s+[\d.]|Phase\s+\d)/);
    const sectionEnd = nextTaskOrPhase
      ? sectionStart + nextTaskOrPhase.index
      : content.length;
    const section = content.slice(sectionStart, sectionEnd);

    const statusMatch = section.match(/\*\*Status:\*\*\s*(.+)/);
    const status = statusMatch ? statusMatch[1].trim() : "⏳ Pending";

    const priorityMatch = section.match(/\*\*Priority:\*\*\s*(\d+)/);
    const priority = priorityMatch ? parseInt(priorityMatch[1], 10) : 0;

    const depsMatch = section.match(/\*\*Dependencies:\*\*\s*(.+)/);
    const dependencies =
      depsMatch && depsMatch[1].trim() !== "None"
        ? depsMatch[1]
            .trim()
            .split(",")
            .map((d) => d.trim())
        : [];

    const planMatch = section.match(/\*\*Plan:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
    const planLink = planMatch ? planMatch[2] : null;

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

function cmdRoadmapAnalyze(cwd, raw) {
  const roadmapPath = hakiPaths(cwd).roadmap;
  const content = safeReadFile(roadmapPath);

  if (!content) {
    output({ error: "ROADMAP.md not found", phases: [], tasks: [] }, raw);
    return;
  }

  const { phases, tasks } = parseRoadmap(content);
  const summary = summaryFromTasks(tasks);

  emitWorkflowBoundary(cwd, "roadmap.analyze", "plan");
  emitPhaseBoundary(cwd, "roadmap.analyze", "plan", "active", {
    command: "roadmap.analyze",
    summary,
  });

  for (const task of tasks) {
    emitTaskState(cwd, task);
  }

  emitRouteSelection(cwd, "roadmap.analyze", "plan", {
    action: "analyze",
    summary,
  });
  emitPhaseBoundary(cwd, "roadmap.analyze", "plan", "completed", {
    command: "roadmap.analyze",
    summary,
  });
  emitWorkflowBoundary(cwd, "roadmap.analyze", "plan", "completed");

  output(
    {
      phases: phases.map((phase) => ({ number: phase.number, name: phase.name })),
      tasks: tasks.map(taskOutput),
      stats: {
        ...summary,
        progress_percent: progressPercent(summary),
      },
    },
    raw,
  );
}

function cmdRoadmapNextTask(cwd, raw) {
  const roadmapPath = hakiPaths(cwd).roadmap;
  const content = safeReadFile(roadmapPath);

  if (!content) {
    output({ found: false, reason: "no_roadmap" }, raw, "");
    return;
  }

  const { tasks } = parseRoadmap(content);

  function select(task, action) {
    const phase = mapTaskActionToPhase(action);
    emitTaskState(cwd, task, phase, "selected");
    emitRouteSelection(cwd, `roadmap-next-${task.id}`, phase, {
      action,
      taskId: task.id,
      taskTitle: task.name,
    });
    output({ found: true, task, action }, raw, task.id);
  }

  const inProgress = tasks.find((t) => t.status.includes("In Progress"));
  if (inProgress) return select(inProgress, "exec");

  const planned = tasks.find((t) => t.status.includes("Planned"));
  if (planned) return select(planned, "exec");

  const discussed = tasks.find((t) => t.status.includes("Discussed"));
  if (discussed) return select(discussed, "plan");

  const pending = tasks.find((t) => t.status.includes("Pending"));
  if (pending) return select(pending, "discuss");

  emitRouteSelection(cwd, "roadmap-next-all-complete", "done", {
    action: "milestone",
    reason: "all_complete",
  });
  output({ found: false, reason: "all_complete" }, raw, "");
}

function cmdRoadmapUpdateStatus(cwd, taskId, newStatus, raw) {
  if (!taskId) error("Usage: roadmap update-status <task-id> <status>");
  if (!newStatus) error("Usage: roadmap update-status <task-id> <status>");

  const statusValue = STATUS_EMOJI[newStatus.toLowerCase()] || newStatus;
  const normalizedStatus = statusInputValue(newStatus);
  const targetPhase =
    normalizedStatus === "discussed"
      ? "discuss"
      : normalizedStatus === "planned"
        ? "plan"
        : normalizedStatus === "executing" || normalizedStatus === "completed" || normalizedStatus === "blocked"
          ? "exec"
          : undefined;

  const roadmapPath = hakiPaths(cwd).roadmap;
  let content = safeReadFile(roadmapPath);
  if (!content) {
    error("ROADMAP.md not found");
    return;
  }

  const existingTask = parseRoadmap(content).tasks.find((task) => task.id === taskId);

  emitWorkflowBoundary(cwd, `roadmap.update-status.${taskId}`, targetPhase);
  if (existingTask) {
    emitTaskState(cwd, existingTask, targetPhase || mapTaskPhase(existingTask), "before");
  }
  emitPhaseBoundary(cwd, `task-${taskId}`, targetPhase, "active", {
    taskId,
    nextStatus: normalizedStatus,
  });

  const escapedId = taskId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const taskPattern = new RegExp(
    `(###\\s+Task\\s+${escapedId}:[\\s\\S]*?\\*\\*Status:\\*\\*\\s*)([^\\n]+)`,
    "i",
  );

  if (!taskPattern.test(content)) {
    error(`Task ${taskId} not found in ROADMAP.md`);
    return;
  }

  content = content.replace(taskPattern, `$1${statusValue}`);
  fs.writeFileSync(roadmapPath, content, "utf-8");

  const updatedTask = parseRoadmap(content).tasks.find((task) => task.id === taskId);
  if (updatedTask) {
    emitTaskState(cwd, updatedTask, targetPhase || mapTaskPhase(updatedTask), "after", normalizedStatus);
  }

  emitRouteSelection(cwd, `roadmap-update-${taskId}`, targetPhase, {
    action: "update-status",
    taskId,
    status: normalizedStatus,
  });
  emitPhaseBoundary(cwd, `task-${taskId}`, targetPhase, normalizedStatus === "blocked" ? "blocked" : "completed", {
    taskId,
    status: normalizedStatus,
  });
  emitWorkflowBoundary(cwd, `roadmap.update-status.${taskId}`, targetPhase, normalizedStatus);

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
  STATUS_ORDER,
  STATUS_EMOJI,
  parseRoadmap,
  cmdRoadmapAnalyze,
  cmdRoadmapNextTask,
  cmdRoadmapUpdateStatus,
};
