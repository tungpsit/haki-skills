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
npx haki-skills                         # Antigravity (default)
npx haki-skills --for claude            # + CLAUDE.md (Claude Code)
npx haki-skills --for cursor            # + .cursor/rules/haki.mdc (Cursor)
npx haki-skills --for codex             # + AGENTS.md (Codex)
npx haki-skills --for claude,cursor     # Multiple agents
npx haki-skills --for all               # All agents
npx haki-skills ./my-app --for claude   # Target a specific directory
npx haki-skills --cocoindex-setup      # Standalone CocoIndex setup (optional)
```

### Start building

```
/haki:next           # auto-detect state and advance
/haki:new-project    # full init: questions → research → PROJECT.md → ROADMAP.md
/haki:discuss        # extract decisions for a task through adaptive Q&A
/haki:plan           # create TDD-first implementation plan
/haki:exec           # execute planned tasks with subagents
/haki:e2e            # init / generate / run E2E tests with Playwright
/haki:e2e-gen        # generate test specs from natural-language descriptions
/haki:api-test       # write and run API integration tests with Vitest
/haki:docs           # generate user guides with screenshots for modules
```

> **Prerequisite:** An AI coding agent that reads workflow files. The installer generates entry-point configs for Cursor (`.cursor/rules/`), Claude Code (`CLAUDE.md`), and Codex (`AGENTS.md`) automatically.

## Workflow

Haki follows a linear pipeline. Each stage feeds the next:

```
new-project → discuss → plan → exec
     ↑                          |
     └── /haki:next (auto) ─────┘
```

| Command               | What it does                                                                  |
| --------------------- | ----------------------------------------------------------------------------- |
| `/haki:new-project`   | Socratic discovery → 4 parallel research agents → `PROJECT.md` + `ROADMAP.md` |
| `/haki:discuss`       | Resolve gray areas for a specific task — one decision at a time               |
| `/haki:plan`          | Create step-by-step TDD plan: write test → fail → implement → pass → commit   |
| `/haki:exec`          | Dispatch subagents to execute all planned tasks with review gates             |
| `/haki:next`          | State machine — detects progress and invokes the right command                |
| `/haki:research`      | Look up library versions/docs via Context7 MCP                                |
| `/haki:new-milestone` | Define a new milestone (phase) and add tasks to `ROADMAP.md`                  |
| `/haki:e2e`           | Init, generate, or run E2E tests with Playwright (TDD mandatory)              |
| `/haki:e2e-gen`       | Generate Playwright specs from natural-language intent (browser-aware + auth) |
| `/haki:api-test`      | Write and run API integration tests with Vitest + fetch                       |
| `/haki:docs`          | Generate user guides with screenshots for project modules                     |
| `/haki:map-codebase`  | 4 parallel agents map stack, architecture, conventions, structure             |
| `/haki:init`          | Re-run the installer (with `--force` to overwrite)                            |

## What Gets Installed

Core files install into `.agent/`. Agent configs are generated at the project root:

```
AGENTS.md                # Cross-agent instructions (Codex + others)
CLAUDE.md                # Claude Code entry point
.cursor/rules/haki.mdc   # Cursor rules
.agent/
├── workflows/           # 13 haki command files
├── bin/                 # CLI tools (haki-tools.cjs, haki-ui.cjs)
├── skills/              # 23 skill folders (incl. cocoindex-hybrid)
├── templates/           # project, roadmap, task templates
└── references/          # questioning guide, UI formatting
.haki/                   # runtime + generated data (gitignored)
├── research/
├── codebase/
├── tasks/
├── runtime/
│   ├── ui/
│   │   ├── current-run.json
│   │   ├── runs/
│   │   └── snapshots/
│   └── brainstorm/
│       └── sessions/
└── generated/
    └── docs/user-guides/ # generated user documentation
```

`haki-ui` stores its append-only event logs and current-run pointer under `.haki/runtime/ui/`. Brainstorming mockups persisted with `--project-dir` live under `.haki/runtime/brainstorm/sessions/`.

Legacy `.haki/ui/` runtime data is still read for compatibility during the transition.

> Agent config files are **non-destructive** — the installer skips them if they already exist, so your custom configs are never overwritten.

### CocoIndex Integration (Optional)

When installing with `--for claude`, Haki can optionally set up [CocoIndex](https://cocoindex.io) for semantic code search and RAG-powered planning.

**Requirements:** Python 3 + Docker

**To enable:** Re-run `npx haki-skills --cocoindex-setup` (or install with `--for claude` on a machine with Python + Docker).

**What it sets up:**
- Per-project PostgreSQL + pgvector (Docker)
- CLI: `node .haki/cocoindex/cli/index.js` to index codebase
- `/haki:index` skill for semantic code search

**Embedding models:** Local (default, no API key) or OpenAI/Gemini (requires API key).

See [docs/specs/2026-04-01-cocoindex-hybrid-integration.md](docs/specs/2026-04-01-cocoindex-hybrid-integration.md) for design details.

### Included Skills

| Category        | Skills                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Planning**    | `brainstorming`, `writing-plans`, `executing-plans`                                                                                              |
| **Development** | `subagent-driven-development`, `test-driven-development`, `systematic-debugging`                                                                 |
| **Testing**     | `playwright-automation`, `playwright-intent-to-spec`, `api-testing`                                                                              |
| **Execution**   | `dispatching-parallel-agents`, `verification-before-completion`, `full-output-enforcement`                                                       |
| **Design**      | `ui-ux-pro-max`, `taste-skill`, `soft-skill`, `brutalist-skill`, `minimalist-skill`, `stitch-skill`, `redesign-skill`, `industrial-brutalist-ui` |
| **Research**    | `context7-research`, `taste-research`                                                                                                            |
| **Docs**        | `user-docs-generator`                                                                                                                            |

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
