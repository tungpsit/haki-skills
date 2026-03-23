---
description: Research, plan, and verify implementation for a task
---

# /haki:plan [task-id]

Create a TDD-first implementation plan. If text instead of task-id → treat as new feature.

## Steps

1. **Resolve task-id:**
   // turbo

```bash
node .agent/bin/haki-tools.cjs roadmap next-task --raw
```

- Existing task-id → load from ROADMAP + `.haki/tasks/[task-id].md`
- No id → pick next task needing planning
- Text description → discuss as new feature → add to ROADMAP → plan

2. **Research** (if enabled):
   - Use Context7 MCP for library docs
   - Analyze codebase for existing patterns
   - Read relevant `.agent/skills/` for methodology (TDD, etc.)

3. **Create TDD-first plan** → `.haki/tasks/[task-id].md`
   - Read template: `.agent/templates/task.md`
   - Each step: write test → verify FAIL → implement → verify PASS → commit
   - Exact file paths, complete code, exact test commands
   - Each step ≤ 5 minutes of work

4. **Plan review loop** (max 3 iterations):
   - Dispatch reviewer subagent: completeness, TDD compliance, file paths
   - If issues → fix and re-review
   - If approved → proceed

5. **Update ROADMAP status:**

```bash
node .agent/bin/haki-tools.cjs roadmap update-status [task-id] planned --raw
```

6. **Next:** `/haki:exec`
