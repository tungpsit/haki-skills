# Haki Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-haki--skills-red.svg)](https://www.npmjs.com/package/haki-skills)

**AI workflow system for structured project initialization, task planning, and TDD-first execution.**

Haki gives AI coding agents a repeatable workflow: ask the right questions, research the tech stack, plan with tests first, and execute with subagents — so projects start with clarity instead of guesswork.

**Works with:** Antigravity · Claude Code · Cursor · Codex · Gemini CLI

## Why Haki

- **Structured over ad-hoc** — Instead of dumping a vague prompt, Haki walks through Socratic questioning to extract real requirements before writing any code.
- **TDD-first plans** — Every implementation step starts with a failing test. Plans are concrete: exact file paths, exact test commands, ≤ 5-minute steps.
- **Verified tech stacks** — Uses [Context7 MCP](https://context7.com) to look up real library versions and install commands. No hallucinated package names.
- **Parallel subagents** — Research, codebase mapping, and task execution are dispatched to focused subagents for speed and context isolation.
- **State machine routing** — `/haki:next` auto-detects project state and invokes the right workflow. No memorizing commands.

## Quick Start

### Install into any project

```bash
npx haki-skills                      # Antigravity (default)
npx haki-skills --for claude         # + CLAUDE.md (Claude Code)
npx haki-skills --for cursor         # + .cursor/rules/haki.mdc (Cursor)
npx haki-skills --for codex          # + AGENTS.md (Codex)
npx haki-skills --for claude,cursor  # Multiple agents
npx haki-skills --for all            # All agents
npx haki-skills ./my-app --for claude  # Target a specific directory
```

### Start building

```
/haki:next           # auto-detect state and advance
/haki:new-project    # full init: questions → research → PROJECT.md → ROADMAP.md
/haki:discuss        # extract decisions for a task through adaptive Q&A
/haki:plan           # create TDD-first implementation plan
/haki:exec           # execute planned tasks with subagents
```

> **Prerequisite:** An AI coding agent that reads workflow files. The installer generates entry-point configs for Cursor (`.cursor/rules/`), Claude Code (`CLAUDE.md`), and Codex (`AGENTS.md`) automatically.

## Workflow

Haki follows a linear pipeline. Each stage feeds the next:

```
new-project → discuss → plan → exec
     ↑                          |
     └── /haki:next (auto) ─────┘
```

| Command              | What it does                                                                  |
| -------------------- | ----------------------------------------------------------------------------- |
| `/haki:new-project`  | Socratic discovery → 4 parallel research agents → `PROJECT.md` + `ROADMAP.md` |
| `/haki:discuss`      | Resolve gray areas for a specific task — one decision at a time               |
| `/haki:plan`         | Create step-by-step TDD plan: write test → fail → implement → pass → commit   |
| `/haki:exec`         | Dispatch subagents to execute all planned tasks with review gates             |
| `/haki:next`         | State machine — detects progress and invokes the right command                |
| `/haki:research`     | Look up library versions/docs via Context7 MCP                                |
| `/haki:map-codebase` | 4 parallel agents map stack, architecture, conventions, structure             |
| `/haki:init`         | Re-run the installer (with `--force` to overwrite)                            |

## What Gets Installed

Core files install into `.agent/`. Agent configs are generated at the project root:

```
AGENTS.md                # Cross-agent instructions (Codex + others)
CLAUDE.md                # Claude Code entry point
.cursor/rules/haki.mdc   # Cursor rules
.agent/
├── workflows/           # 8 haki command files
├── bin/                 # CLI tools (haki-tools.cjs)
├── skills/              # 18 skill folders
├── templates/           # project, roadmap, task templates
└── references/          # questioning guide, UI formatting
.haki/                   # runtime data (gitignored)
├── research/
├── codebase/
└── tasks/
```

> Agent config files are **non-destructive** — the installer skips them if they already exist, so your custom configs are never overwritten.

### Included Skills

| Category        | Skills                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Planning**    | `brainstorming`, `writing-plans`, `executing-plans`                                                                                              |
| **Development** | `subagent-driven-development`, `test-driven-development`, `systematic-debugging`                                                                 |
| **Execution**   | `dispatching-parallel-agents`, `verification-before-completion`, `full-output-enforcement`                                                       |
| **Design**      | `ui-ux-pro-max`, `taste-skill`, `soft-skill`, `brutalist-skill`, `minimalist-skill`, `stitch-skill`, `redesign-skill`, `industrial-brutalist-ui` |
| **Research**    | `context7-research`                                                                                                                              |

### CLI Tools

`haki-tools.cjs` provides state management for the workflow:

```bash
# Config management
node .agent/bin/haki-tools.cjs config init
node .agent/bin/haki-tools.cjs config get ui_design_skill
node .agent/bin/haki-tools.cjs config set ui_design_skill taste-skill

# Roadmap operations
node .agent/bin/haki-tools.cjs roadmap analyze
node .agent/bin/haki-tools.cjs roadmap next-task
node .agent/bin/haki-tools.cjs roadmap update-status T-01 completed

# State detection (used by /haki:next)
node .agent/bin/haki-tools.cjs state detect
node .agent/bin/haki-tools.cjs state json
```

## Requirements

- **Node.js** ≥ 18
- An AI coding agent: [Antigravity](https://github.com/AcademySoftwareFoundation/antigravity) · [Claude Code](https://docs.anthropic.com/en/docs/claude-code) · [Cursor](https://cursor.com) · [Codex](https://openai.com/codex) · Gemini CLI
- [Context7 MCP server](https://context7.com) (optional, for `/haki:research` and verified library versions)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### Project Structure

```
haki-skills/
├── bin/install.js        # Installer script (npx entry point)
├── .agent/
│   ├── workflows/        # Workflow definitions (haki-*.md)
│   ├── bin/              # CLI tools
│   │   ├── haki-tools.cjs
│   │   └── lib/          # config, roadmap, state, core modules
│   ├── skills/           # Skill folders (SKILL.md + resources)
│   ├── templates/        # Markdown templates for project docs
│   └── references/       # Reference guides
└── package.json
```

## Support

- **Issues:** [github.com/tungpsit/haki-skills/issues](https://github.com/tungpsit/haki-skills/issues)
- **Repository:** [github.com/tungpsit/haki-skills](https://github.com/tungpsit/haki-skills)

## License

[MIT](LICENSE)
