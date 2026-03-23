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
 * Installs everything into .agent/ (Antigravity standard):
 *   .agent/workflows/haki-*.md   Command entry points
 *   .agent/bin/                  CLI tools
 *   .agent/skills/               All skills
 *   .agent/templates/            Templates
 *   .agent/references/           References
 *   .haki/                       Runtime data (gitignored)
 */

const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────

const SOURCE_ROOT = path.resolve(__dirname, "..");

const COPY_MAP = [
  { src: ".agent/bin", dst: ".agent/bin" },
  { src: ".agent/skills", dst: ".agent/skills" },
  { src: ".agent/templates", dst: ".agent/templates" },
  { src: ".agent/references", dst: ".agent/references" },
  { src: ".agent/workflows", dst: ".agent/workflows", pattern: /^haki-/ },
];

// Registry of agent → config file to generate
const AGENT_REGISTRY = {
  antigravity: null, // built-in: .agent/ is the config
  gemini: null, // alias for antigravity
  claude: {
    template: ".agent/templates/claude.md",
    target: "CLAUDE.md",
    label: "CLAUDE.md (Claude Code)",
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
  // Check truly unknown agents
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

function ensureGitignore(targetDir) {
  const gitignorePath = path.join(targetDir, ".gitignore");
  const entry = ".haki/";

  let content = "";
  try {
    content = fs.readFileSync(gitignorePath, "utf-8");
  } catch {}

  if (content.includes(entry)) return false;

  const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(
    gitignorePath,
    content + `${separator}\n# Haki runtime data\n${entry}\n`,
    "utf-8",
  );
  return true;
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

  let totalFiles = 0;

  for (const { src, dst, pattern } of COPY_MAP) {
    const srcPath = path.join(SOURCE_ROOT, src);
    const dstPath = path.join(targetDir, dst);
    const filter = pattern ? (name) => pattern.test(name) : undefined;
    const count = copyDirRecursive(srcPath, dstPath, filter);
    console.log(`   ✅ ${dst}/ (${count} files)`);
    totalFiles += count;
  }

  // Create .haki/ runtime directory
  for (const sub of ["research", "codebase", "tasks"]) {
    fs.mkdirSync(path.join(targetDir, ".haki", sub), { recursive: true });
  }
  console.log("   ✅ .haki/ (runtime directory)");

  // Generate agent config files for selected agents (non-destructive)
  const agentConfigs = selectedAgents
    .map((a) => AGENT_REGISTRY[a])
    .filter(Boolean); // null = antigravity/gemini, no extra file needed

  if (
    agentConfigs.length === 0 &&
    !selectedAgents.includes("antigravity") &&
    !selectedAgents.includes("gemini")
  ) {
    // Should not happen, but guard anyway
  }

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

  // Update .gitignore
  if (fs.existsSync(path.join(targetDir, ".git"))) {
    if (ensureGitignore(targetDir))
      console.log("   ✅ .gitignore (added .haki/)");
  }

  console.log(`\n✨ Done! ${totalFiles} files installed into .agent/`);
  console.log(`\n▶ Next: /haki:new-project (or /haki:next)\n`);
}

main();
