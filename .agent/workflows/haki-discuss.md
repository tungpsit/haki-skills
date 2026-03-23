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

2. **Load context:**
   - `.haki/PROJECT.md` — project vision
   - `.haki/ROADMAP.md` — extract this task's section
   - `.haki/research/` — relevant research files
   - `.haki/codebase/` — codebase map (if exists)
   - `.haki/tasks/[task-id].md` — prior discussions (if exists)
   - Read: `.agent/references/questioning.md`

3. **Analyze gray areas** from task requirements and acceptance criteria:
   - Unresolved technical decisions
   - Ambiguous requirements needing clarification
   - Integration points with other tasks
   - Skip areas already decided in PROJECT.md

4. **Discuss** — one question at a time:
   - Prefer multiple-choice when possible
   - Dig deeper until each decision is clear
   - Capture decisions concisely

5. **Save decisions** to `.haki/tasks/[task-id].md`

6. **Update ROADMAP status:**

```bash
node .agent/bin/haki-tools.cjs roadmap update-status [task-id] discussed --raw
```

7. **Next:** `/haki:plan [task-id]`
