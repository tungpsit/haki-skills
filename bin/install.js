#!/usr/bin/env node

/**
 * Haki Init — Install haki workflow system into a target project
 *
 * Usage:
 *   node bin/install.js [target-dir]     # Default: current directory
 *   node bin/install.js --help
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

Usage:  node bin/install.js [target-dir]
Options:
  --force    Overwrite existing files
  --help     Show this help

All files install into .agent/ (Antigravity standard).
Runtime data goes to .haki/ (gitignored).
`);
    process.exit(0);
  }

  const force = args.includes("--force");
  const targetDir = path.resolve(args.find((a) => !a.startsWith("-")) || ".");

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

  // Generate agent config files (non-destructive — never overwrite existing)
  const AGENT_CONFIGS = [
    {
      template: ".agent/templates/agents.md",
      target: "AGENTS.md",
      label: "AGENTS.md (Codex / cross-agent)",
    },
    {
      template: ".agent/templates/claude.md",
      target: "CLAUDE.md",
      label: "CLAUDE.md (Claude Code)",
    },
    {
      template: ".agent/templates/cursor-haki.mdc",
      target: path.join(".cursor", "rules", "haki.mdc"),
      label: ".cursor/rules/haki.mdc (Cursor)",
    },
  ];

  for (const { template, target, label } of AGENT_CONFIGS) {
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

  // Update .gitignore
  if (fs.existsSync(path.join(targetDir, ".git"))) {
    if (ensureGitignore(targetDir))
      console.log("   ✅ .gitignore (added .haki/)");
  }

  console.log(`\n✨ Done! ${totalFiles} files installed into .agent/`);
  console.log(`\n▶ Next: /haki:new-project (or /haki:next)\n`);
}

main();
