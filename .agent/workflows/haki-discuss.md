---
description: Gather task context through adaptive questioning before planning
---

# /haki:discuss [task-id]

Extract implementation decisions for a task through adaptive questioning.

## Steps

1. **Resolve task-id** — if not provided, pick next undiscussed task:
   // turbo

```bash
node .agent/bin/haki-tools.cjs roadmap next-task --raw
```

If `action: "discuss"`, use the returned task id.

2. **Mark as In Progress in ROADMAP.md:**

```bash
node .agent/bin/haki-tools.cjs roadmap update-status [task-id] in_progress --raw
```

3. **Load context:**
   - `.haki/PROJECT.md` — project vision
   - `.haki/ROADMAP.md` — extract this task's section
   - `.haki/research/` — relevant research files
   - `.haki/codebase/` — codebase map (if exists)
   - `.haki/tasks/[task-id].md` — prior discussions (if exists)
   - Read: `.agent/references/questioning.md`

4. **Analyze gray areas** from task requirements and acceptance criteria:
   - Unresolved technical decisions
   - Ambiguous requirements needing clarification
   - Integration points with other tasks
   - Skip areas already decided in PROJECT.md

5. **Discuss** — one question at a time:
   - Prefer multiple-choice when possible
   - Dig deeper until each decision is clear
   - Capture decisions concisely

6. **Save decisions** to `.haki/tasks/[task-id].md` **(MANDATORY)**:
   - If file does NOT exist → create it from `.agent/templates/task.md`
   - Fill `Context & Decisions` section with all captured decisions
   - **Do NOT skip this step** — the file must exist before moving to plan

7. **Update ROADMAP status to Discussed:**

```bash
node .agent/bin/haki-tools.cjs roadmap update-status [task-id] discussed --raw
```

⚠️ **Verify both files are updated before finishing:**

- `.haki/tasks/[task-id].md` exists and has decisions
- ROADMAP status is `💬 Discussed`

8. **Next:** `/haki:plan [task-id]`
