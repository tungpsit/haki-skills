/**
 * .haki/scripts/generate-roadmap.js
 *
 * Reads all task files from .haki/tasks/, generates .haki/ROADMAP.md.
 * Run: node .haki/scripts/generate-roadmap.js
 *
 * Task file frontmatter format:
 *   ---
 *   id: m3-001
 *   title: "Task title"
 *   type: milestone|feature|bug|chore|task
 *   status: pending|in_progress|completed|blocked
 *   priority: 1-4
 *   depends_on: []
 *   created: 2026-04-12
 *   created_by: claude
 *   ---
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, '..', 'tasks');
const ROADMAP = path.join(__dirname, '..', 'ROADMAP.md');

// ── Frontmatter parser ────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;

  const raw = match[1];
  const body = match[2];
  const attrs = {};

  raw.split(/\r?\n/).forEach(function(line) {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();

    if (value.charAt(0) === '[') {
      try {
        value = JSON.parse(value.replace(/'/g, '"'));
      } catch (e) {
        value = [];
      }
    } else if ((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
               (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")) {
      value = value.slice(1, -1);
    }
    attrs[key] = value;
  });

  return { attrs: attrs, body: body };
}

// ── Helpers ────────────────────────────────────────────────────────────

function statusIcon(status) {
  const icons = {
    completed:    '\u2705',  // ✅
    in_progress:  '\uD83D\uDD04', // 🔄
    blocked:      '\u274C',  // ❌
    pending:      '\u23F3',  // ⏳
  };
  return icons[status] || icons.pending;
}

function escapeMd(text) {
  // Minimal escaping for table cells
  return String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// ── Section builders ──────────────────────────────────────────────────

function buildHeader() {
  return '# Project Roadmap — Haki Skills\n\n' +
    '> **WARNING: AUTO-GENERATED.** Edit task files in `.haki/tasks/` instead.\n' +
    '> Run `node .haki/scripts/generate-roadmap.js` to regenerate.\n\n---\n\n';
}

function buildMilestones(tasks, taskMap) {
  const milestones = tasks.filter(function(t) { return t.attrs.type === 'milestone'; });
  if (milestones.length === 0) return '';

  let md = '## Milestones\n\n';

  milestones.forEach(function(m) {
    const title = m.attrs.title || m.attrs.id;
    const icon  = statusIcon(m.attrs.status);
    md += '### ' + icon + ' ' + escapeMd(title) + ' [Details](./tasks/' + m._file + ')\n\n';

    // List child tasks (non-milestone tasks that reference this milestone)
    const children = tasks.filter(function(t) {
      return t.attrs.type !== 'milestone' && t.attrs.milestone === m.attrs.id;
    });
    if (children.length > 0) {
      md += '| # | Task | Status |\n';
      md += '|---|---|---|\n';
      children.forEach(function(c, i) {
        md += '| ' + (i + 1) + ' | ' + escapeMd(c.attrs.title || c.attrs.id) + ' | ' + statusIcon(c.attrs.status) + ' |\n';
      });
      md += '\n';
    }
  });

  return md;
}

function buildTaskTable(tasks, taskMap) {
  const nonMilestones = tasks.filter(function(t) { return t.attrs.type !== 'milestone'; });
  if (nonMilestones.length === 0) return '';

  let md = '## All Tasks\n\n';
  md += '| ID | Title | Type | Priority | Status | Blockers |\n';
  md += '|----|-------|------|----------|--------|----------|\n';

  nonMilestones.forEach(function(t) {
    const id       = escapeMd(t.attrs.id || '?');
    const title    = escapeMd(t.attrs.title || '?');
    const type     = escapeMd(t.attrs.type || 'task');
    const priority = escapeMd(t.attrs.priority || '?');
    const status   = t.attrs.status || 'pending';
    const deps     = t.attrs.depends_on || [];

    const blockers = deps.length > 0
      ? deps.map(function(depId) {
          const dep = taskMap.get(depId);
          if (!dep) return depId + ' ?';
          return depId + ' ' + statusIcon(dep.attrs.status);
        }).join(', ')
      : '\u2014';  // —

    md += '| ' + id + ' | ' + title + ' | ' + type + ' | P' + priority + ' | ' + statusIcon(status) + ' | ' + blockers + ' |\n';
  });

  return md + '\n';
}

function buildStats(tasks) {
  const counts = { completed: 0, in_progress: 0, pending: 0, blocked: 0 };
  tasks.forEach(function(t) {
    const s = t.attrs.status || 'pending';
    if (counts.hasOwnProperty(s)) counts[s]++;
  });

  return '## Quick Stats\n\n' +
    '- ' + statusIcon('completed') + ' Completed: ' + counts.completed + '\n' +
    '- ' + statusIcon('in_progress') + ' In Progress: ' + counts.in_progress + '\n' +
    '- ' + statusIcon('pending') + ' Pending: ' + counts.pending + '\n' +
    '- ' + statusIcon('blocked') + ' Blocked: ' + counts.blocked + '\n' +
    '- **Total: ' + tasks.length + '**\n\n' +
    '---\n*Generated at ' + new Date().toISOString() + ' by .haki/scripts/generate-roadmap.js*\n';
}

// ── Main ──────────────────────────────────────────────────────────────

const taskFiles = fs.readdirSync(TASKS_DIR).filter(function(f) { return f.endsWith('.md'); });
const tasks = [];

taskFiles.forEach(function(file) {
  const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf8');
  const parsed = parseFrontmatter(content);
  if (parsed) {
    parsed._file = file;
    tasks.push(parsed);
  }
});

// Dependency map
const taskMap = new Map();
tasks.forEach(function(t) {
  if (t.attrs.id) taskMap.set(t.attrs.id, t);
});

// Sort: milestones first, then by id
tasks.sort(function(a, b) {
  if (a.attrs.type === 'milestone' && b.attrs.type !== 'milestone') return -1;
  if (a.attrs.type !== 'milestone' && b.attrs.type === 'milestone') return 1;
  return String(a.attrs.id || '').localeCompare(String(b.attrs.id || ''));
});

// Build
let md = buildHeader();
md += buildMilestones(tasks, taskMap);
md += buildTaskTable(tasks, taskMap);
md += buildStats(tasks);

fs.writeFileSync(ROADMAP, md, 'utf8');
console.log('Generated ROADMAP.md (' + tasks.length + ' tasks)');
