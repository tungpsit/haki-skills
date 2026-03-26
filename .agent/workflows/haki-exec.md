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

   b. **Dispatch implementer subagent (or work directly if no subagent support):**
   - Provide: full task plan from `.haki/tasks/[task-id].md`
   - Read: `.agent/skills/subagent-driven-development/SKILL.md` for methodology
   - Execute TDD steps: write test → verify fail → implement → verify pass
   - Atomic commit per step

   c. **Spec compliance review** (subagent):
   - Verify implementation matches plan + acceptance criteria

   d. **Code quality review** (subagent):
   - Check naming, error handling, test coverage

   e. **Update task file with results (MANDATORY):**
   - Open `.haki/tasks/[task-id].md`
   - Fill **Implementation Details** section:
     - Files Changed table (path, action, notes)
     - Key Decisions & Deviations from plan
   - Fill **Execution Results** section:
     - Test Results (pass/fail count)
     - Build Status
     - Lint Status
     - Issues Encountered
     - Completed At (timestamp)
   - Check off verification items
   - **Do NOT skip this step** — incomplete task files will be rejected

   f. **Mark complete and Clear Context:**

   ```bash
   node .agent/bin/haki-tools.cjs roadmap update-status [task-id] completed --raw
   ```

   **CRITICAL: Strict Auto-Clear Rule**
   To prevent token bloat and cross-task hallucination, you MUST clear your context window before starting the next task:
   - **Antigravity:** Run the built-in `/clear` command to wipe session history, then run `/haki:next`.
   - **Claude Code:** Run the built-in `/clear` command to wipe session history, then run `/haki:next`.
   - **Cursor/Other Agents:** Stop here. Instruct the user to start a **New Chat / New Composer Session** and run `/haki:next` to pick up the next task.

   Do NOT continue executing subsequent tasks in the same bloated context window.

3. **Handling failures:**
   - DONE → next task
   - NEEDS_CONTEXT → provide context, re-dispatch
   - BLOCKED → escalate to user

4. **After all tasks:** Show summary → suggest `/haki:next`
