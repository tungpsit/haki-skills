---
description: Define a new milestone (phase) and add tasks to ROADMAP.md
---

# /haki:new-milestone [name]

Add a new Phase to the project — gather task requirements through questioning then append to ROADMAP.md.

## Steps

1. **Check state:**
   // turbo

```bash
node .agent/bin/haki-tools.cjs roadmap analyze --raw
```

Read `stats.total` to determine the next phase number (`stats.phases.length + 1`).
If no ROADMAP.md exists → tell user to run `/haki:new-project` first and stop.

2. **Confirm milestone name:**
   - If `[name]` arg is given → use it directly
   - Otherwise → ask: "What is this milestone called? (e.g., 'Auth & Permissions', 'Billing', 'v2 Features')"

3. **Extract tasks via Socratic Questioning:**
   - Read: `.agent/references/questioning.md`
   - Goal: enumerate concrete, independent tasks for this milestone
   - Ask one question at a time:
     - "What are the main features or capabilities this milestone delivers?"
     - "Can you list the individual tasks? I'll help break them down if needed."
     - "Are there any dependencies between tasks, or on tasks from earlier phases?"
     - "What does 'done' look like for each task? (acceptance criteria)"
   - Capture: task name, slug (kebab-case), priority (1=highest), dependencies, acceptance criteria
   - Continue until user confirms task list is complete

4. **Build the new Phase section** in memory:

```markdown
## Phase N: <Milestone Name>

### Task N.1: <Task Name> (`<task-slug>`)

**Status:** ⏳ Pending
**Priority:** 1
**Dependencies:** None | <task-slug-1>, <task-slug-2>
**Plan:** [tasks/<task-slug>.md](tasks/<task-slug>.md)

**Requirements:**

- <requirement>

**Acceptance Criteria:**

- [ ] <criterion>

---
```

Repeat for each task, incrementing `N.1`, `N.2`, etc.

5. **Append to ROADMAP.md:**
   - Read `.haki/ROADMAP.md`
   - Append the new phase block at the end
   - Write back to `.haki/ROADMAP.md`

6. **Confirm and show next steps:**

```
✅ Milestone Added: Phase N — <Milestone Name>
   Tasks added: <count>

▶ Next: /haki:discuss <first-task-id>
```
