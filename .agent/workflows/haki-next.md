---
description: Auto-detect state and run the next logical workflow step
---

# /haki:next

Zero-friction advancement — auto-detect state and immediately invoke next command.
Perfect for resuming work after a context clear or starting a fresh session.

// turbo-all

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
| All ✅ Complete    | Milestone summary     | Show completion           |

3. **Display status and invoke immediately** (no confirmation):

```
🚀 Haki Next
Progress: [X]% | [done]/[total] tasks
▶ Next: /haki:[command] [args]
```
