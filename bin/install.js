#!/usr/bin/env node

/**
 * Haki Init — Install haki workflow system into a target project
 *
 * Usage:
 *   npx haki-skills [target-dir] [options]
 *
 * Options:
 *   --for <agent>   Generate config for a specific agent (default: antigravity)
 *                   agents: antigravity, claude, codex, cursor, gemini, all
 *                   comma-separated: --for claude,cursor
 *   --force         Overwrite existing .agent/ files
 *   --help          Show this help
 *
 * Agent-specific install paths:
 *   antigravity/gemini:  .agent/workflows/, .agent/skills/, .agent/bin/, etc.
 *   claude:              .claude/workflows/, .claude/skills/ + skill wrappers for workflows
 *   codex:               .agent/ (standard)
 *   cursor:              .agent/ (standard)
 */

const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────

const SOURCE_ROOT = path.resolve(__dirname, "..");

// Default copy map (for antigravity/gemini/codex/cursor)
const DEFAULT_COPY_MAP = [
  { src: ".agent/bin", dst: ".agent/bin" },
  { src: ".agent/skills", dst: ".agent/skills" },
  { src: ".agent/templates", dst: ".agent/templates" },
  { src: ".agent/references", dst: ".agent/references" },
  { src: ".agent/workflows", dst: ".agent/workflows", pattern: /^haki-/ },
];

// Claude Code copy map — uses .claude/ paths
const CLAUDE_COPY_MAP = [
  { src: ".agent/bin", dst: ".agent/bin" },
  { src: ".agent/skills", dst: ".claude/skills" },
  { src: ".agent/templates", dst: ".agent/templates" },
  { src: ".agent/references", dst: ".agent/references" },
  { src: ".agent/workflows", dst: ".claude/workflows", pattern: /^haki-/ },
];

// Registry of agent → config file to generate
const AGENT_REGISTRY = {
  antigravity: null, // built-in: .agent/ is the config
  gemini: null, // alias for antigravity
  claude: {
    template: ".agent/templates/claude.md",
    target: "CLAUDE.md",
    label: "CLAUDE.md (Claude Code)",
    copyMap: CLAUDE_COPY_MAP,
  },
  codex: {
    template: ".agent/templates/agents.md",
    target: "AGENTS.md",
    label: "AGENTS.md (Codex / cross-agent)",
  },
  cursor: {
    template: ".agent/templates/cursor-haki.mdc",
    target: path.join(".cursor", "rules", "haki.mdc"),
    label: ".cursor/rules/haki.mdc (Cursor)",
  },
};

const KNOWN_AGENTS = Object.keys(AGENT_REGISTRY);

// Parse --for value: "claude,cursor" → ["claude", "cursor"]
function parseForArg(args) {
  const idx = args.indexOf("--for");
  if (idx === -1) return ["antigravity"];
  const val = args[idx + 1];
  if (!val || val.startsWith("-")) {
    console.error("Error: --for requires a value, e.g. --for claude");
    console.error(`  Known agents: ${KNOWN_AGENTS.join(", ")}`);
    process.exit(1);
  }
  if (val === "all") return KNOWN_AGENTS.filter((a) => a !== "gemini");
  const selected = val.split(",").map((s) => s.trim().toLowerCase());
  const invalid = selected.filter((a) => !KNOWN_AGENTS.includes(a));
  if (invalid.length) {
    console.error(`Error: Unknown agent(s): ${invalid.join(", ")}`);
    console.error(`  Known agents: ${KNOWN_AGENTS.join(", ")}, all`);
    process.exit(1);
  }
  return selected;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function copyDirRecursive(src, dst, filter) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dst, { recursive: true });

  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".git")) continue;
    if (filter && !filter(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
      count++;
    }
  }
  return count;
}

/**
 * Create skill wrappers for Claude Code workflows.
 * Each workflow file gets a corresponding skill in .claude/skills/
 * so that /haki:xxx slash commands work.
 */
function createClaudeSkillWrappers(targetDir, workflowsDir) {
  const skillsDir = path.join(targetDir, ".claude", "skills");
  let count = 0;

  if (!fs.existsSync(workflowsDir)) return count;

  const entries = fs.readdirSync(workflowsDir).filter((f) => f.startsWith("haki-") && f.endsWith(".md"));

  for (const filename of entries) {
    const base = filename.replace(/\.md$/, ""); // e.g. "haki-next"
    const skillName = base.replace(/^haki-/, "haki:"); // e.g. "haki:next"

    // Read description from workflow frontmatter
    const workflowContent = fs.readFileSync(path.join(workflowsDir, filename), "utf-8");
    const descMatch = workflowContent.match(/^description:\s*(.+)$/m);
    const description = descMatch ? descMatch[1].trim() : `Run the ${skillName} workflow`;

    // Create skill directory and SKILL.md
    const skillDir = path.join(skillsDir, base);
    fs.mkdirSync(skillDir, { recursive: true });

    const skillContent = `---
name: ${skillName}
description: ${description}
---

Read and follow the workflow instructions in \`.claude/workflows/${filename}\` exactly.
`;

    fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillContent, "utf-8");
    count++;
  }

  return count;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Haki Init — Install haki workflow system into a project

Usage:  npx haki-skills [target-dir] [options]

Options:
  --for <agent>  Generate config for a specific agent (default: antigravity)
                 Agents: ${KNOWN_AGENTS.join(", ")}, all
                 Comma-separated: --for claude,cursor
  --force        Overwrite existing .agent/ files
  --help         Show this help

Examples:
  npx haki-skills                      # Antigravity (default)
  npx haki-skills --for claude         # Claude Code
  npx haki-skills --for cursor         # Cursor
  npx haki-skills --for codex          # Codex / AGENTS.md
  npx haki-skills --for claude,cursor  # Multiple agents
  npx haki-skills --for all            # All agents
`);
    process.exit(0);
  }

  const force = args.includes("--force");
  const selectedAgents = parseForArg(args);
  const targetDir = path.resolve(
    args.find(
      (a) => !a.startsWith("-") && a !== args[args.indexOf("--for") + 1],
    ) || ".",
  );

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  // Check existing
  const agentBin = path.join(targetDir, ".agent", "bin");
  if (fs.existsSync(agentBin) && !force) {
    console.log(`⚠️  .agent/bin/ already exists in ${targetDir}`);
    console.log("   Use --force to overwrite");
    process.exit(1);
  }

  console.log(`\n🚀 Installing haki into: ${targetDir}\n`);

  const isClaude = selectedAgents.includes("claude");

  // Determine which copy map to use
  // If claude is selected, use CLAUDE_COPY_MAP; otherwise use DEFAULT_COPY_MAP
  // When multiple agents are selected, run both maps (deduplicate shared paths)
  const copyMaps = new Map();

  for (const agent of selectedAgents) {
    const reg = AGENT_REGISTRY[agent];
    const map = reg?.copyMap || DEFAULT_COPY_MAP;
    for (const entry of map) {
      // Use dst as key to deduplicate
      copyMaps.set(entry.dst, entry);
    }
  }

  let totalFiles = 0;

  for (const { src, dst, pattern } of copyMaps.values()) {
    const srcPath = path.join(SOURCE_ROOT, src);
    const dstPath = path.join(targetDir, dst);
    const filter = pattern ? (name) => pattern.test(name) : undefined;
    const count = copyDirRecursive(srcPath, dstPath, filter);
    console.log(`   ✅ ${dst}/ (${count} files)`);
    totalFiles += count;
  }

  // Create Claude Code skill wrappers for workflows
  if (isClaude) {
    const workflowsDir = path.join(targetDir, ".claude", "workflows");
    const wrapperCount = createClaudeSkillWrappers(targetDir, workflowsDir);
    console.log(`   ✅ .claude/skills/ workflow wrappers (${wrapperCount} skills)`);
    totalFiles += wrapperCount;
  }

  // Create .haki/ structure
  // Committed (docs): specs/, decisions/, research/, tasks/, reports/, codebase/, layouts/, screens/
  // Gitignored: runtime/
  for (const sub of [
    "specs",
    "decisions",
    "research",
    "tasks",
    "reports",
    "codebase",
    "layouts",
    "screens",
    path.join("runtime", "ui", "runs"),
    path.join("runtime", "ui", "snapshots"),
    path.join("runtime", "brainstorm", "sessions"),
    path.join("generated", "docs", "user-guides"),
  ]) {
    fs.mkdirSync(path.join(targetDir, ".haki", sub), { recursive: true });
  }
  console.log("   ✅ .haki/ (specs/, decisions/, research/, tasks/, reports/, codebase/, layouts/, screens/, runtime/)");

  // Generate agent config files for selected agents (non-destructive)
  const agentConfigs = selectedAgents
    .map((a) => AGENT_REGISTRY[a])
    .filter(Boolean);

  if (agentConfigs.length > 0) {
    for (const { template, target, label } of agentConfigs) {
      const dst = path.join(targetDir, target);
      if (fs.existsSync(dst)) {
        console.log(`   ⏭️  ${label} (already exists, skipped)`);
      } else {
        const src = path.join(SOURCE_ROOT, template);
        if (fs.existsSync(src)) {
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(src, dst);
          console.log(`   ✅ ${label}`);
        }
      }
    }
  }

  // Update .gitignore — only ignore .haki/runtime/ and .haki/ui/
  if (fs.existsSync(path.join(targetDir, ".git"))) {
    const giPath = path.join(targetDir, ".gitignore");
    let content = "";
    try { content = fs.readFileSync(giPath, "utf-8"); } catch {}

    const lines = [
      "# Haki runtime artifacts (do NOT commit)",
      "/.haki/runtime/",
      "/.haki/ui/",
    ];

    let changed = false;
    for (const line of lines) {
      if (!content.includes(line)) {
        const sep = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
        content += sep + line + "\n";
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(giPath, content, "utf-8");
    console.log("   ✅ .gitignore (added .haki/runtime/ + .haki/ui/ to ignore)");
  }

  console.log(`\n✨ Done! ${totalFiles} files installed`);
  console.log(`\n▶ Next: /haki:new-project (or /haki:next)\n`);
}

main();
