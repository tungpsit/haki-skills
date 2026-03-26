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

2. **Mark as In Progress in ROADMAP.md:**

```bash
node .agent/bin/haki-tools.cjs roadmap update-status [task-id] in_progress --raw
```

3. **Research** (if enabled):
   - Read: `.agent/skills/context7-research/SKILL.md`
   - Use Context7 MCP for library docs (verified versions, install commands)
   - Analyze codebase for existing patterns
   - Read relevant `.agent/skills/` for methodology (TDD, etc.)

4. **Write TDD-first plan** to `.haki/tasks/[task-id].md` **(MANDATORY)**:
   - If file does NOT exist → create from `.agent/templates/task.md`
   - If file exists → preserve `Context & Decisions`, update `Implementation Steps`
   - Each step: write test → verify FAIL → implement → verify PASS → commit
   - Exact file paths, complete code, exact test commands
   - Each step ≤ 5 minutes of work
   - **Do NOT skip this step** — exec phase depends on this file

5. **Plan review loop** (max 3 iterations):
   - Dispatch reviewer subagent: completeness, TDD compliance, file paths
   - If issues → fix and re-review
   - If approved → proceed

6. **Update ROADMAP status to Planned:**

```bash
node .agent/bin/haki-tools.cjs roadmap update-status [task-id] planned --raw
```

⚠️ **Verify both files are updated before finishing:**

- `.haki/tasks/[task-id].md` exists and has implementation steps
- ROADMAP status is `📋 Planned`

7. **Next:** `/haki:exec`
