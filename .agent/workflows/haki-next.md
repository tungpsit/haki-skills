---
description: Auto-detect state and run the next logical workflow step
---

# /haki:next

Zero-friction advancement — auto-detect state and immediately invoke next command.
Perfect for resuming work after a context clear or starting a fresh session.

// turbo-all

## ⚠️ MANDATORY: File Tracking Rules (READ FIRST)

**Every workflow phase MUST maintain two files. Skipping = broken state.**

### 1. Task File: `.haki/tasks/[task-id].md`

| Phase       | Required Action                                                          |
| ----------- | ------------------------------------------------------------------------ |
| **discuss** | CREATE file if missing (from `.agent/templates/task.md`). Save decisions |
| **plan**    | UPDATE file with implementation steps                                    |
| **exec**    | UPDATE file with Implementation Details + Execution Results              |

### 2. ROADMAP: `.haki/ROADMAP.md`

| Phase       | Required Action                                                    |
| ----------- | ------------------------------------------------------------------ |
| **discuss** | `update-status [task-id] in_progress` → then `discussed` on finish |
| **plan**    | `update-status [task-id] in_progress` → then `planned` on finish   |
| **exec**    | `update-status [task-id] in_progress` → then `completed` on finish |

**Before invoking any sub-workflow, verify:**

- `.haki/tasks/[task-id].md` exists (create from template if missing)
- `ROADMAP.md` status matches reality (fix stale status if needed)

---

## Steps

1. **Detect state:**

```bash
node .agent/bin/haki-tools.cjs state json --raw
```

2. **Route based on state:**

| Condition          | Action                | Command                   |
| ------------------ | --------------------- | ------------------------- |
| No `.haki/`        | Initialize            | `/haki:new-project`       |
| Tasks ⏳ Pending   | Discuss first pending | `/haki:discuss [task-id]` |
| Tasks 💬 Discussed | Plan first discussed  | `/haki:plan [task-id]`    |
| Tasks 📋 Planned   | Execute               | `/haki:exec`              |
| All ✅ Complete    | New milestone or done | `/haki:new-milestone`     |

3. **Display status and invoke immediately** (no confirmation):

```
🚀 Haki Next
Progress: [X]% | [done]/[total] tasks
▶ Next: /haki:[command] [args]
```
