---
id: m5-000
title: "M5: Skill Registry + CLI Integration"
type: milestone
status: completed
priority: 1
depends_on: []
created: 2026-04-12
created_by: claude
---

## Objective

Expose skills as a machine-readable registry and CLI commands for programmatic invocation.

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Design skill registry approach | ✅ |
| 2 | Add skill.cjs lib with list/info/invoke/registry commands | ✅ |
| 3 | Integrate into haki-tools.cjs | ✅ |
| 4 | Generate .agent/registry.json (25 skills) | ✅ |

## Commands

```bash
node .agent/bin/haki-tools.cjs skill list       # List all skills
node .agent/bin/haki-tools.cjs skill info <name> # Skill details
node .agent/bin/haki-tools.cjs skill invoke <name> # Print SKILL.md
node .agent/bin/haki-tools.cjs skill registry   # Regenerate registry
```
