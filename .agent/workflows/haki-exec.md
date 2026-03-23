---
description: Execute all planned tasks with subagent-driven development
---

# /haki:exec

Execute all 📋 Planned tasks using subagent-driven development.

## Steps

1. **Find planned tasks:**
   // turbo

```bash
node .agent/bin/haki-tools.cjs roadmap analyze --raw
```

Extract tasks with status "Planned" or "In Progress". If none → suggest `/haki:plan`.

2. **For each task (sequential):**

   a. **Update status:**

   ```bash
   node .agent/bin/haki-tools.cjs roadmap update-status [task-id] in_progress --raw
   ```

   b. **Dispatch implementer subagent:**
   - Provide: full task plan from `.haki/tasks/[task-id].md`
   - Read: `.agent/skills/subagent-driven-development/SKILL.md` for methodology
   - Execute TDD steps: write test → verify fail → implement → verify pass
   - Atomic commit per step

   c. **Spec compliance review** (subagent):
   - Verify implementation matches plan + acceptance criteria

   d. **Code quality review** (subagent):
   - Check naming, error handling, test coverage

   e. **Mark complete:**

   ```bash
   node .agent/bin/haki-tools.cjs roadmap update-status [task-id] completed --raw
   ```

3. **Handling failures:**
   - DONE → next task
   - NEEDS_CONTEXT → provide context, re-dispatch
   - BLOCKED → escalate to user

4. **After all tasks:** Show summary → suggest `/haki:next`
