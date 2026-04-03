---
name: swarm-product-team
description: Orchestrate a product team of specialized subagents to transform raw ideas into approved design specs and implementation plans — ready to hand off to swarm-dev-team for execution.
---

# Swarm Product Team

Orchestrate a complete product team using Claude Code subagents. Each agent assumes a specialized role, produces standardized reports, and builds toward a final handoff package ready for the development team.

**Works with:** `brainstorming` skill, `writing-plans` skill, `swarm-dev-team` skill.

---

## When to Use

- A new idea, feature request, or project is proposed and needs full product definition before development
- You want a structured, traceable process from raw concept → design spec → implementation plan
- You want to leverage existing `DESIGN.md` or establish a new design system before coding begins
- You want clear handoff documentation so `swarm-dev-team` can start immediately

---

## Prerequisites

- `brainstorming` skill is available in `.agent/skills/brainstorming/`
- `writing-plans` skill is available in `.agent/skills/writing-plans/`
- `DESIGN.md` exists in the project (optional — if absent, Designer will propose a new design system)

---

## Team Architecture

```
┌──────────────────────────────────────────────────────────┐
│          🎯 ORCHESTRATOR (Skill / You / Claude)           │
│   Idea → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 │
└────────────────────────────┬─────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  📋 Requirements │ │  📈 Product      │ │  🎨 UI/UX        │
│     Analyst      │ │   Strategist     │ │   Designer       │
│   (Phase 1)      │ │   (Phase 2)      │ │   (Phase 3)      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                      │                      │
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │  Phase 3 output      │
                               │  (architectural +    │
                               │   design combined)   │
                               ▼
                   ┌──────────────────────┐
                   │  📝 Spec Writer       │
                   │     (Phase 4)         │
                   └──────────────────────┘
                               │
                               ▼
                   ┌──────────────────────┐
                   │  📊 Implementation   │
                   │       Planner         │
                   │     (Phase 5)         │
                   └──────────────────────┘
                               │
                               ▼
                   ┌──────────────────────┐
                   │  🚀 swarm-dev-team   │
                   │   (handoff ready!)  │
                   └──────────────────────┘
```

### Role Summary

| Phase | Role | Responsibility |
|-------|------|----------------|
| 1 | Requirements Analyst | Elicit, document, and clarify requirements from the raw idea |
| 2 | Product Strategist | Define vision, personas, user stories, and success metrics |
| 3 | Product Architect | System architecture, API contracts, data model, tech approach |
| 3 | UI/UX Designer | Design system, component inventory, layout, accessibility |
| 4 | Spec Writer | Consolidate all Phase 1–3 outputs into a single `*-design.md` document |
| 5 | Implementation Planner | Break the spec into tasks, milestones, estimates → `.haki/ROADMAP.md` |

---

## Report Directory Structure

All agent reports are stored under `.haki/reports/`. This directory is created automatically.

```
.haki/
├── PROJECT.md                   ← Phase 2: vision, scope, constraints
├── ROADMAP.md                   ← Phase 5: task breakdown, milestones
├── requirements.md              ← Phase 1: feature list, constraints, acceptance criteria
├── vision.md                    ← Phase 2: vision statement, personas
├── prd.md                       ← Phase 2: user stories
├── reports/
│   ├── 01-requirements-analyst.md
│   ├── 02-product-strategist.md
│   ├── 03-product-architect.md
│   ├── 04-ui-ux-designer.md
│   ├── 05-spec-writer.md
│   └── 06-implementation-planner.md
├── research/                    ← Competitive analysis, market research (Phase 2)
└── tasks/                      ← Generated in Phase 5 from ROADMAP tasks

docs/
└── superpowers/
    └── specs/
        └── YYYY-MM-DD-<topic>-design.md   ← Phase 4: final approved spec
```

---

## Report Template (MANDATORY for every agent)

Every subagent MUST write its report to `.haki/reports/NN-role.md` using this exact structure:

```markdown
# [ICON] [ROLE NAME] Report

**Agent:** [Role name]
**Phase:** [Phase number]
**Status:** 🟢 COMPLETED | 🟡 PARTIAL | 🔴 BLOCKED
**Started:** [ISO 8601 timestamp]
**Completed:** [ISO 8601 timestamp]

---

## Input

- **Received from:** [Previous agent/phase or user]
- **Files read:** [List of files consumed]
- **Context used:** [Any relevant context, docs, or skills loaded]

---

## Objectives

- [x] Objective 1 — completed
- [x] Objective 2 — completed
- [ ] Objective 3 — skipped (reason)

---

## Tasks Executed

### Task 1: [Name]

- **Status:** ✅ Done | ⚠️ Partial | ❌ Failed | ⏭️ Skipped
- **Files created:**
  - `path/to/file` — Brief description
- **Files modified:**
  - `path/to/file` — Brief description
- **Details:** [What was done]
- **Issues found:** [Any problems discovered or open questions]

### Task 2: [Name]
...

---

## Output

- **Total files created:** [N]
- **Total files modified:** [N]
- **Handoff notes:** [What the next agent needs to know]

---

## Open Questions / Recommendations

1. [Open question or actionable recommendation]
2. [Open question or actionable recommendation]
```

---

## Phase Execution

### Phase 1: Requirements Elicitation

#### 📋 Subagent: Requirements Analyst

**Haki skills to read first:**
- `.agent/skills/brainstorming/SKILL.md` — follow the brainstorming process for understanding the idea

**Instructions:**

1. **Clarify the idea:**
   - If the user provided a raw idea, read through brainstorming process: ask ONE question at a time to refine
   - Identify: purpose, target users, core value proposition, success criteria
   - Flag immediately if the request describes multiple independent subsystems — help decompose first

2. **Requirements gathering:**
   - Functional requirements: what the system must do (use cases, features)
   - Non-functional requirements: performance, security, scalability, accessibility
   - Constraints: budget, timeline, tech stack preferences, team capabilities
   - Out of scope: what this will NOT cover

3. **Acceptance criteria:**
   - Define clear, testable acceptance criteria for each feature
   - Use "Given-When-Then" format for clarity

4. **Output:**
   - Write `.haki/requirements.md` with:
     - Project overview (1 paragraph)
     - Functional requirements (numbered list)
     - Non-functional requirements
     - Constraints & assumptions
     - Acceptance criteria per feature
     - Open questions (items that need user input before proceeding)

**Output:** Write report to `.haki/reports/01-requirements-analyst.md`

---

### Phase 2: Product Strategy

#### 📈 Subagent: Product Strategist

**Haki context to load:**
- `.haki/requirements.md` — from Phase 1

**Instructions:**

1. **Vision statement:**
   - Write a concise vision: "For [target users], [product] is a [core benefit] that [key differentiator]."
   - 2–3 sentences max

2. **User personas:**
   - Define 2–4 primary personas (name, role, goals, pain points)
   - Focus on the most important user types

3. **User stories:**
   - Write user stories in standard format: "As a [persona], I want [goal], so that [benefit]"
   - Prioritize with MoSCoW: Must have / Should have / Could have / Won't have (this sprint)
   - Map user stories to functional requirements from Phase 1

4. **Success metrics:**
   - Define 3–5 KPIs or success metrics
   - How will you know this feature/project succeeded?

5. **Competitive landscape (lightweight):**
   - Briefly note 1–2 comparable products/features
   - What can we learn from their UX or approach?

6. **Create `.haki/PROJECT.md`:**
   - Consolidate: vision, scope, target users, key constraints, success criteria
   - This becomes the canonical project definition

**Output:** Write report to `.haki/reports/02-product-strategist.md`
**Also create:** `.haki/vision.md`, `.haki/prd.md`, `.haki/PROJECT.md`

---

### Phase 3: Architecture & Design (Parallel)

Spawn Product Architect and UI/UX Designer in parallel.

#### 📐 Subagent: Product Architect

**Haki skills to read first:**
- `.agent/skills/brainstorming/SKILL.md` — architecture section
- `.agent/skills/writing-plans/SKILL.md` — for understanding how plans are structured

**Haki context to load:**
- `.haki/requirements.md`
- `.haki/PROJECT.md`
- `.haki/prd.md`

**Instructions:**

1. **System architecture:**
   - Choose pattern: monolith / modular monolith / microservices / SPA + API
   - Define layers: presentation → application → domain → infrastructure
   - Draw component diagram (C4 model: context, container, component)
   - Identify external services / integrations

2. **API contract design:**
   - Define all API endpoints (OpenAPI spec or markdown table)
   - Request/response schemas with TypeScript types
   - Error response format (standardized)
   - Pagination, filtering, sorting conventions

3. **Data model:**
   - Key entities and relationships
   - High-level ERD or schema sketch
   - Identify any complex domain logic

4. **Tech approach:**
   - Recommended tech stack (if not already defined)
   - Key libraries and their roles
   - DevOps / infrastructure basics

5. **Save outputs:**
   - `docs/ARCHITECTURE.md`
   - `docs/api-contract.md`

**Output:** Write report to `.haki/reports/03-product-architect.md`

---

#### 🎨 Subagent: UI/UX Designer

**Haki skills to read first:**
- `.agent/skills/ui-ux-pro-max/SKILL.md` (if available)
- `.agent/skills/taste-skill/SKILL.md` (if available)

**Haki context to load:**
- `.haki/requirements.md`
- `.haki/PROJECT.md`
- `.haki/prd.md`

**Instructions:**

1. **Design system check:**
   - Check if `DESIGN.md` exists in the project root
   - Check if `design-system/` folder or similar exists
   - If YES: Load and follow existing design tokens, patterns, and conventions
   - If NO: Propose a new design system from scratch

2. **Design system (new or existing):**
   - Design tokens: colors, typography, spacing, shadows, border radius
   - Component library base: Button, Input, Select, Modal, Toast, Table, Card, Navigation
   - Each component: states (default, hover, focus, disabled, error), variants, responsive behavior
   - Accessibility: ARIA attributes, keyboard navigation, WCAG 2.1 AA target

3. **Layout & navigation:**
   - Page structure / routing map
   - Navigation pattern (sidebar, top nav, tabs)
   - Responsive breakpoints (mobile-first)
   - Loading / error / empty states

4. **Visual direction:**
   - Describe the look and feel (e.g., "clean SaaS dashboard", "playful mobile-first", "minimal editorial")
   - Reference any brand guidelines or competitor UI for inspiration

5. **Output:**
   - If `DESIGN.md` existed: Update it with new components/pages
   - If no `DESIGN.md`: Write it to project root
   - Include: component inventory table, design token reference, layout diagrams (text-based)

**Output:** Write report to `.haki/reports/04-ui-ux-designer.md`

---

### Phase 4: Spec Writing

#### 📝 Subagent: Spec Writer

**Haki skills to read first:**
- `.agent/skills/brainstorming/SKILL.md` — spec document section
- `.agent/skills/subagent-driven-development/spec-reviewer-prompt.md` — for review process

**Haki context to load:**
- `.haki/requirements.md`
- `.haki/PROJECT.md`
- `.haki/prd.md`
- `.haki/reports/03-product-architect.md`
- `.haki/reports/04-ui-ux-designer.md`
- `DESIGN.md` (if exists)

**Instructions:**

1. **Consolidate all inputs:**
   - Merge technical architecture (from Architect) with design system (from Designer)
   - Ensure consistency between API contracts and UI data needs
   - Resolve any conflicts between Architect and Designer outputs

2. **Write the spec document:**
   - Write to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
   - Use the brainstorming skill's spec document format as reference
   - Scale sections to complexity: brief for simple projects, detailed for complex ones

3. **Spec sections (at minimum):**
   - **Overview:** Problem, solution, scope
   - **User Stories:** From prd.md, condensed
   - **Architecture:** System design, key components
   - **API Design:** Endpoints, schemas, errors
   - **Data Model:** Entities, relationships
   - **UI/UX Design:** Design tokens, component inventory, layouts
   - **Acceptance Criteria:** From requirements.md
   - **Out of Scope:** What is explicitly NOT covered
   - **Open Questions:** Items needing user input

4. **Spec review loop:**
   - Dispatch a spec-document-reviewer subagent with the spec content
   - Fix issues identified, re-dispatch (max 3 iterations)
   - If after 3 iterations issues remain, surface to user for guidance

**Output:** Write report to `.haki/reports/05-spec-writer.md`
**Final output:** `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`

---

### Phase 5: Implementation Planning

#### 📊 Subagent: Implementation Planner

**Haki skills to read first:**
- `.agent/skills/writing-plans/SKILL.md`

**Haki context to load:**
- `.haki/requirements.md`
- `.haki/PROJECT.md`
- `.haki/prd.md`
- `.haki/reports/05-spec-writer.md`
- `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`

**Instructions:**

1. **Task breakdown:**
   - Decompose the spec into discrete, actionable tasks
   - Each task: clear title, description, acceptance criteria
   - Group tasks into phases or milestones (2–4 milestones max)
   - Estimate effort: S / M / L / XL (relative, not hours)

2. **Dependency mapping:**
   - Identify which tasks block others
   - Sequence tasks accordingly
   - Flag any tasks that can run in parallel

3. **Milestone definition:**
   - Define 2–4 milestones with clear deliverables
   - Each milestone: name, target tasks, definition of "done"

4. **Generate `.haki/ROADMAP.md`:**
   - Use the project template structure:
     - Milestones with dates (TBD, user fills in)
     - Task list with status (all ⏳ Pending)
     - Priority ordering
   - Each task should reference the spec section it implements

5. **Generate individual task files:**
   - For each task in ROADMAP, create `.haki/tasks/<task-id>.md`
   - Follow the task template from `.agent/templates/task.md`

**Output:** Write report to `.haki/reports/06-implementation-planner.md`
**Also create:** `.haki/ROADMAP.md`, `.haki/tasks/*.md`

---

## Handoff to swarm-dev-team

After Phase 5 completes, the handoff package is ready:

```
✅ .haki/PROJECT.md          — Vision, scope, constraints
✅ .haki/ROADMAP.md           — Task breakdown, milestones
✅ .haki/requirements.md      — Full requirements
✅ docs/superpowers/specs/
    └── YYYY-MM-DD-<topic>-design.md  — Approved design spec
✅ .haki/reports/            — All agent reports for traceability
```

**To start development:**
```
/swarm-dev-team
```

---

## Invocation

### Full Orchestration

```
Read `.agent/skills/swarm-product-team/SKILL.md`.

This is a NEW project.
Project name: [NAME]
Idea: [DESCRIPTION]

Execute the full product team workflow:
1. Phase 1: Requirements Analyst (elicits requirements from idea)
2. Phase 2: Product Strategist (vision, personas, user stories, PROJECT.md)
3. Phase 3: Product Architect + UI/UX Designer (parallel — architecture + design system)
4. Phase 4: Spec Writer (consolidate into approved *-design.md)
5. Phase 5: Implementation Planner (generate ROADMAP.md + task files)

Every agent MUST:
- Read its assigned haki skills BEFORE starting work
- Load context from previous agent reports
- Write its report to .haki/reports/NN-role.md using the report template
- Pass handoff notes to the next phase

After Phase 5:
- Confirm all files are created
- Report handoff package summary
- Prompt user to review SPEC.md before proceeding to /swarm-dev-team
```

### Step-by-Step (Manual Control)

If you prefer to run each phase manually with review between phases:

```bash
# Phase 1
"You are REQUIREMENTS ANALYST. Read .agent/skills/swarm-product-team/SKILL.md Phase 1.
Analyze the user's idea: [idea description].
Write report to .haki/reports/01-requirements-analyst.md and .haki/requirements.md."

# Phase 2
"You are PRODUCT STRATEGIST. Read .agent/skills/swarm-product-team/SKILL.md Phase 2.
Load .haki/requirements.md. Write vision, personas, user stories.
Write report to .haki/reports/02-product-strategist.md.
Create .haki/PROJECT.md, .haki/vision.md, .haki/prd.md."

# Phase 3 — parallel
# Subagent 1:
"You are PRODUCT ARCHITECT. Read .agent/skills/swarm-product-team/SKILL.md Phase 3 Architect.
Load .haki/requirements.md, .haki/PROJECT.md. Design architecture and API contracts.
Write report to .haki/reports/03-product-architect.md."

# Subagent 2:
"You are UI/UX DESIGNER. Read .agent/skills/swarm-product-team/SKILL.md Phase 3 Designer.
Load .haki/requirements.md, .haki/PROJECT.md. Check for existing DESIGN.md.
If exists: follow it. If not: propose new design system. Write to DESIGN.md.
Write report to .haki/reports/04-ui-ux-designer.md."

# Phase 4
"You are SPEC WRITER. Read .agent/skills/swarm-product-team/SKILL.md Phase 4.
Load all Phase 1–3 reports. Write consolidated spec to
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md.
Run spec review loop (max 3 iterations).
Write report to .haki/reports/05-spec-writer.md."

# Phase 5
"You are IMPLEMENTATION PLANNER. Read .agent/skills/swarm-product-team/SKILL.md Phase 5.
Load spec, requirements, PROJECT.md. Generate ROADMAP.md and task files.
Write report to .haki/reports/06-implementation-planner.md."

# Confirm handoff
"Review all outputs. Confirm .haki/PROJECT.md, .haki/ROADMAP.md,
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md exist.
Prompt user to review the spec before running /swarm-dev-team."
```

---

## Quality Gates

| Phase | Gate | Criteria |
|-------|------|----------|
| 1 Requirements | ✅ Requirements Complete | Functional + non-functional requirements documented, acceptance criteria defined |
| 2 Strategy | ✅ Vision Clear | Vision, personas, user stories, and PROJECT.md exist |
| 3 Architecture | ✅ Design Complete | Architecture, API contracts, design system (or existing DESIGN.md) exist |
| 3 Design | ✅ Design System Ready | Component inventory, tokens, accessibility requirements documented |
| 4 Spec | ✅ Spec Approved | Spec review loop passed, spec file committed to git |
| 5 Planning | ✅ Plan Ready | ROADMAP.md exists with all tasks, task files created |

---

## Integration with Haki State Machine

| Haki State | Product Team Action |
|------------|---------------------|
| No `.haki/` | Run product team from scratch (full 5 phases) |
| Has ROADMAP, tasks ⏳ Pending | Ready for `/swarm-dev-team` — product team not needed |
| Has ROADMAP, tasks 🔴 Blocked | Use `/discuss` or product team to refine blocked items |
| New idea proposed | Run `/swarm-product-team` to define before `/swarm-dev-team` |

The product team does NOT replace brainstorming — it runs **after** brainstorming produces an approved direction, to formalize and plan that direction.
