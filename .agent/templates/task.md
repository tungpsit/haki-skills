# Task {{TASK_ID}}: {{TASK_NAME}}

> **For agentic workers:** Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** {{TASK_GOAL}}

**Architecture:** {{TASK_ARCHITECTURE}}

**Tech Stack:** {{TECH_STACK}}

---

## Context & Decisions

{{CONTEXT_FROM_DISCUSS}}

---

## Implementation Steps

### Step 1: {{STEP_1_NAME}}

**Files:**

- Create: `{{FILE_PATH}}`
- Test: `{{TEST_PATH}}`

- [ ] **1.1: Write the failing test**

```{{LANGUAGE}}
{{TEST_CODE}}
```

- [ ] **1.2: Run test to verify it fails**

Run: `{{TEST_COMMAND}}`
Expected: FAIL

- [ ] **1.3: Write minimal implementation**

```{{LANGUAGE}}
{{IMPL_CODE}}
```

- [ ] **1.4: Run test to verify it passes**

Run: `{{TEST_COMMAND}}`
Expected: PASS

- [ ] **1.5: Commit**

```bash
git add {{FILES}}
git commit -m "feat: {{COMMIT_MSG}}"
```

---

## Verification

- [ ] All tests pass
- [ ] Acceptance criteria from ROADMAP met
- [ ] No lint errors
