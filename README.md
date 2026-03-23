# Haki Skills

AI workflow system for project initialization, task planning, and execution.

## Quick Start

```bash
npx haki-skills [target-dir]
```

Installs into the current directory (or specified target). Then use:

```
/haki:new-project    → Initialize project with research
/haki:discuss        → Discuss task requirements
/haki:plan           → Create TDD-first implementation plan
/haki:exec           → Execute planned tasks with subagents
/haki:next           → Auto-advance to next step
/haki:map-codebase   → Analyze existing codebase
```

## What Gets Installed

Everything goes into `.agent/` (Antigravity standard):

| Location             | Contents                         |
| -------------------- | -------------------------------- |
| `.agent/workflows/`  | 7 haki command files             |
| `.agent/bin/`        | CLI tools                        |
| `.agent/skills/`     | 17 skill folders                 |
| `.agent/templates/`  | Project, roadmap, task templates |
| `.agent/references/` | Questioning guide, UI formatting |
| `.haki/`             | Runtime data (gitignored)        |

## License

MIT
