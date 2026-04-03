---
name: swarm-product-team
description: Orchestrate a product team of specialized subagents to transform raw ideas into approved design specs and implementation plans — ready to hand off to swarm-dev-team for execution. Supports both greenfield and brownfield projects.
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
│   Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5│
└────────────────────────────┬─────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  🔍 Product     │ │  📋 Requirements │ │  📈 Product      │
│   Discovery      │ │     Analyst      │ │   Strategist     │
│  (Phase 0)       │ │   (Phase 1)      │ │   (Phase 2)      │
│  [brownfield]    │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                      │                      │
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                   ┌──────────────────────┐
                   │  📐 Product Architect │
                   │  🎨 UI/UX Designer   │  ← Phase 3 (parallel)
                   └──────────────────────┘
                               │
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

| Phase | Role | Responsibility | Project Type |
|-------|------|----------------|-------------|
| 0 | Product Discovery | Assess project state, determine which phases to run | Brownfield only |
| 1 | Requirements Analyst | Elicit, document, and clarify requirements from the raw idea | Both |
| 2 | Product Strategist | Define vision, personas, user stories, and success metrics | Both |
| 3 | Product Architect | System architecture, API contracts, data model, tech approach | Both |
| 3 | UI/UX Designer | Design system, component inventory, layout, accessibility | Both |
| 4 | Spec Writer | Consolidate all Phase 1–3 outputs into a single `*-design.md` document | Both |
| 5 | Implementation Planner | Break the spec into tasks, milestones, estimates → `.haki/ROADMAP.md` | Both |

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
├── discovery.md                 ← Phase 0: project state assessment (brownfield only)
├── reports/
│   ├── 00-product-discovery.md  ← Phase 0 (brownfield only)
│   ├── 01-requirements-analyst.md
│   ├── 02-product-strategist.md
│   ├── 03-product-architect.md
│   ├── 04-ui-ux-designer.md
│   ├── 05-spec-writer.md
│   └── 06-implementation-planner.md
├── research/                    ← Competitive analysis, market research (Phase 2)
├── tasks/                      ← Generated in Phase 5 from ROADMAP tasks
└── codebase/                    ← Discovery output (brownfield only)
    ├── STACK.md                 ← Languages, frameworks, build tools
    ├── ARCHITECTURE.md          ← Existing system patterns and data flow
    ├── CONVENTIONS.md          ← Code style, naming, testing patterns
    └── STRUCTURE.md            ← Directory tree, entry points, configs

docs/
├── ARCHITECTURE.md              ← From Phase 3 Product Architect
├── api-contract.md             ← From Phase 3 Product Architect
├── DESIGN.md                   ← From Phase 3 UI/UX Designer
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

### Phase 0: Product Discovery (Brownfield Only)

**Trigger:** Project has existing source code (`.haki/` may or may not exist).

**This phase is MANDATORY for existing projects.** It determines which phases to skip, reuse, or run.

#### 🔍 Subagent: Product Discovery Agent

**Instructions:**

1. **Scan project state:**

   Scan the following in order. Stop as soon as you have enough information.

   | Check | Command / Action | What to look for |
   |-------|-----------------|-----------------|
   | `.haki/` exists? | `ls .haki/` | PROJECT.md, ROADMAP.md, requirements.md, codebase/ |
   | DESIGN.md? | `find . -name "DESIGN.md" -not -path "*/node_modules/*"` | Design tokens, component library |
   | Source files | `find . -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" \| head -20` | Tech stack, patterns |
   | Package files | `find . -name "package.json" -o -name "pyproject.toml" -o -name "go.mod" \| head -5` | Build tools, frameworks |
   | README | `cat README.md 2>/dev/null \| head -50` | Project overview, setup |
   | Docs | `find docs -name "*.md" 2>/dev/null` | Existing documentation |

2. **Assess what's already done:**

   | File | Status | Implication |
   |------|--------|-------------|
   | `.haki/PROJECT.md` | ✅ Exists | Skip Phase 2 vision/strategy; reuse it |
   | `.haki/requirements.md` | ✅ Exists | Skip Phase 1; extend it with new idea |
   | `.haki/PRD.md` | ✅ Exists | Skip Phase 2 user stories; extend them |
   | `.haki/codebase/` | ✅ Exists | Skip codebase mapping in Phase 0 |
   | `DESIGN.md` | ✅ Exists | Phase 3 Designer extends it |
   | `DESIGN.md` | ❌ Missing | Phase 3 Designer proposes new design system |
   | `docs/ARCHITECTURE.md` | ✅ Exists | Phase 3 Architect reviews and extends |
   | `docs/api-contract.md` | ✅ Exists | Phase 3 Architect reviews and extends |
   | `docs/superpowers/specs/` | ✅ Has recent spec | Phase 4 Spec Writer references it |
   | `.haki/ROADMAP.md` | ✅ Exists | Phase 5 Planner extends it, adds new tasks |

3. **Map existing codebase (if `.haki/codebase/` does not exist):**

   Run 4 mappers in parallel:

   | Mapper | Output | Content |
   |--------|--------|---------|
   | Stack Mapper | `.haki/codebase/STACK.md` | Languages, frameworks, build tools, dependencies |
   | Architecture Mapper | `.haki/codebase/ARCHITECTURE.md` | System patterns, data flow, API design |
   | Conventions Mapper | `.haki/codebase/CONVENTIONS.md` | Code style, naming, testing patterns |
   | Structure Mapper | `.haki/codebase/STRUCTURE.md` | Directory tree, entry points, configs |

4. **Write discovery summary:**

   Write `.haki/discovery.md` with:
   - Project overview (1 paragraph)
   - What exists vs. what's missing
   - **Decision matrix: which phases to SKIP, REUSE, or RUN**
   - List of existing files to respect (conventions, design tokens, API contracts)

   **Decision matrix template:**
   ```
   | Artifact | Status | Action |
   |----------|--------|--------|
   | .haki/PROJECT.md | ✅ Exists | REUSE — skip Phase 2 |
   | .haki/requirements.md | ✅ Exists | EXTEND — add new idea to existing requirements |
   | .haki/PRD.md | ✅ Exists | EXTEND — add new user stories |
   | .haki/codebase/ | ✅ Exists | REUSE — skip mapping |
   | .haki/codebase/ | ❌ Missing | RUN — map in Phase 0 |
   | DESIGN.md | ✅ Exists | EXTEND — add new components |
   | DESIGN.md | ❌ Missing | PROPOSE — Designer creates in Phase 3 |
   | docs/ARCHITECTURE.md | ✅ Exists | REVIEW — Architect extends |
   | docs/api-contract.md | ✅ Exists | REVIEW — Architect extends |
   | docs/superpowers/specs/* | ✅ Has recent | REFERENCE — Spec Writer consolidates |
   | .haki/ROADMAP.md | ✅ Exists | EXTEND — add new tasks |
   | .haki/ROADMAP.md | ❌ Missing | CREATE — Planner generates in Phase 5 |
   ```

5. **Flag issues early:**
   - Inconsistent conventions → document in discovery.md
   - Missing design system → note that Designer must propose one
   - Complex entangled code → flag as risk in discovery.md

**Output:** Write report to `.haki/reports/00-product-discovery.md`
**Also create:** `.haki/discovery.md`, `.haki/codebase/*.md` (if missing)

**Brownfield golden rules:**
- Do NOT refactor working code just for style preferences
- Do NOT change tech stack unless there is a critical reason
- Prioritize CONSISTENCY with existing conventions
- Every change must have a rollback path
- Read `.haki/codebase/CONVENTIONS.md` before writing any new code

---

### Phase 1: Requirements Elicitation

**Skip if:** `.haki/requirements.md` exists AND covers the new idea.

#### 📋 Subagent: Requirements Analyst

**Haki skills to read first:**
- `.agent/skills/brainstorming/SKILL.md` — follow the brainstorming process for understanding the idea

**Haki context to load:**
- `.haki/discovery.md` (brownfield — Phase 0 output)
- `.haki/codebase/CONVENTIONS.md` (brownfield)

**Instructions:**

1. **Clarify the idea:**
   - If the user provided a raw idea, follow brainstorming process: ask ONE question at a time to refine
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

4. **For brownfield:** Extend existing `.haki/requirements.md` rather than replacing it.
   - Read the existing file first
   - Add a new section "### New Requirements for [Idea Name]" at the bottom
   - Mark any existing requirements that are affected by the new idea

5. **Output:**
   - Write `.haki/requirements.md` (new) or update it (brownfield with existing file)
   - Include:
     - Project overview (1 paragraph)
     - Functional requirements (numbered list)
     - Non-functional requirements
     - Constraints & assumptions
     - Acceptance criteria per feature
     - Open questions (items that need user input before proceeding)

**Output:** Write report to `.haki/reports/01-requirements-analyst.md`

---

### Phase 2: Product Strategy

**Skip if:** `.haki/PROJECT.md` and `.haki/prd.md` exist AND cover the new idea.

#### 📈 Subagent: Product Strategist

**Haki context to load:**
- `.haki/requirements.md` — from Phase 1
- `.haki/discovery.md` (brownfield — existing vision and personas)
- `.haki/codebase/CONVENTIONS.md` (brownfield)

**Instructions:**

1. **Vision statement:**
   - Write a concise vision: "For [target users], [product] is a [core benefit] that [key differentiator]."
   - 2–3 sentences max
   - For brownfield: review existing vision, extend if the new idea changes scope

2. **User personas:**
   - Define 2–4 primary personas (name, role, goals, pain points)
   - Focus on the most important user types
   - For brownfield: reuse existing personas unless the new idea targets new user types

3. **User stories:**
   - Write user stories in standard format: "As a [persona], I want [goal], so that [benefit]"
   - Prioritize with MoSCoW: Must have / Should have / Could have / Won't have (this sprint)
   - Map user stories to functional requirements from Phase 1
   - For brownfield: add new user stories to existing prd.md

4. **Success metrics:**
   - Define 3–5 KPIs or success metrics
   - How will you know this feature/project succeeded?

5. **Competitive landscape (lightweight):**
   - Briefly note 1–2 comparable products/features
   - What can we learn from their UX or approach?

6. **Create or update `.haki/PROJECT.md`:**
   - Consolidate: vision, scope, target users, key constraints, success criteria
   - This becomes the canonical project definition
   - For brownfield: extend existing PROJECT.md, don't replace it

7. **Also create or update:**
   - `.haki/vision.md` — standalone vision statement
   - `.haki/prd.md` — user stories with MoSCoW prioritization

**Output:** Write report to `.haki/reports/02-product-strategist.md`
**Also create/update:** `.haki/vision.md`, `.haki/prd.md`, `.haki/PROJECT.md`

---

### Phase 3: Architecture & Design (Parallel)

Spawn Product Architect and UI/UX Designer in parallel.

**Skip check for Architect:** Skip if `docs/ARCHITECTURE.md` and `docs/api-contract.md` exist AND cover the new idea.
**Skip check for Designer:** Designer ALWAYS runs — either to extend existing `DESIGN.md` or to propose a new one.

#### 📐 Subagent: Product Architect

**Haki skills to read first:**
- `.agent/skills/brainstorming/SKILL.md` — architecture section
- `.agent/skills/writing-plans/SKILL.md` — for understanding how plans are structured

**Haki context to load:**
- `.haki/requirements.md`
- `.haki/PROJECT.md`
- `.haki/prd.md`
- `.haki/codebase/ARCHITECTURE.md` (brownfield — existing architecture)
- `.haki/codebase/CONVENTIONS.md` (brownfield)
- `docs/ARCHITECTURE.md` (brownfield — if exists)
- `docs/api-contract.md` (brownfield — if exists)

**Instructions:**

1. **For brownfield with existing architecture:**
   - Read `docs/ARCHITECTURE.md` and `docs/api-contract.md`
   - Identify what needs to change to support the new idea
   - Document delta: what changes, what stays the same
   - Follow existing architectural patterns and conventions

2. **For greenfield or new subsystems:**
   - Choose pattern: monolith / modular monolith / microservices / SPA + API
   - Define layers: presentation → application → domain → infrastructure
   - Draw component diagram (C4 model: context, container, component)
   - Identify external services / integrations

3. **API contract design:**
   - Define all API endpoints (OpenAPI spec or markdown table)
   - Request/response schemas with TypeScript types
   - Error response format (standardized)
   - Pagination, filtering, sorting conventions
   - For brownfield: extend existing API contracts, don't replace

4. **Data model:**
   - Key entities and relationships
   - High-level ERD or schema sketch
   - Identify any complex domain logic
   - For brownfield: add new entities to existing model

5. **Tech approach:**
   - Recommended tech stack (if not already defined)
   - Key libraries and their roles
   - DevOps / infrastructure basics

6. **Save outputs:**
   - Create or update `docs/ARCHITECTURE.md`
   - Create or update `docs/api-contract.md`

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
- `.haki/codebase/CONVENTIONS.md` (brownfield)
- `DESIGN.md` or `design-system/` folder (if exists)

**Instructions:**

1. **Design system check (MANDATORY first step):**
   - Check if `DESIGN.md` exists anywhere in the project:
     ```bash
     find . -name "DESIGN.md" -not -path "*/node_modules/*" -not -path "*/.haki/*"
     ```
   - Check for design token files: `design-system/`, `tokens/`, `theme/`
   - If found: Load and follow existing design tokens, patterns, and conventions
   - If NOT found: Propose and create a new design system from scratch

2. **Design system (existing — extend):**
   - Review existing tokens and component library
   - Identify gaps: what components/patterns are missing for the new idea?
   - Design only the new components needed
   - Update `DESIGN.md` with new sections

3. **Design system (new — propose):**
   - Design tokens: colors, typography, spacing, shadows, border radius
   - Component library base: Button, Input, Select, Modal, Toast, Table, Card, Navigation
   - Each component: states (default, hover, focus, disabled, error), variants, responsive behavior
   - Accessibility: ARIA attributes, keyboard navigation, WCAG 2.1 AA target
   - Write full `DESIGN.md` to project root

4. **Layout & navigation:**
   - Page structure / routing map
   - Navigation pattern (sidebar, top nav, tabs)
   - Responsive breakpoints (mobile-first)
   - Loading / error / empty states

5. **Visual direction:**
   - Describe the look and feel (e.g., "clean SaaS dashboard", "playful mobile-first", "minimal editorial")
   - Reference any brand guidelines or competitor UI for inspiration
   - For brownfield: match existing visual language unless explicitly asked to rebrand

6. **Output:**
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
- `.haki/discovery.md` (brownfield — Phase 0 decision matrix)
- `.haki/reports/03-product-architect.md`
- `.haki/reports/04-ui-ux-designer.md`
- `DESIGN.md`
- `docs/ARCHITECTURE.md` (brownfield)
- `docs/api-contract.md` (brownfield)

**Instructions:**

1. **Consolidate all inputs:**
   - Merge technical architecture (from Architect) with design system (from Designer)
   - Ensure consistency between API contracts and UI data needs
   - Resolve any conflicts between Architect and Designer outputs
   - For brownfield: reference existing artifacts, only document the NEW parts

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
- `.haki/discovery.md` (brownfield — Phase 0)
- `.haki/reports/05-spec-writer.md`
- `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- `.haki/ROADMAP.md` (brownfield — if exists)

**Instructions:**

1. **For brownfield with existing ROADMAP.md:**
   - Read the existing ROADMAP.md
   - Identify where new tasks should be inserted
   - Add new milestones if the scope is large enough
   - Don't reorganize existing tasks — append new ones

2. **Task breakdown:**
   - Decompose the spec into discrete, actionable tasks
   - Each task: clear title, description, acceptance criteria
   - Group tasks into phases or milestones (2–4 milestones max)
   - Estimate effort: S / M / L / XL (relative, not hours)

3. **Dependency mapping:**
   - Identify which tasks block others
   - Sequence tasks accordingly
   - Flag any tasks that can run in parallel

4. **Milestone definition:**
   - Define 2–4 milestones with clear deliverables
   - Each milestone: name, target tasks, definition of "done"

5. **Generate `.haki/ROADMAP.md`:**
   - Use the project template structure:
     - Milestones with dates (TBD, user fills in)
     - Task list with status (all ⏳ Pending)
     - Priority ordering
   - Each task should reference the spec section it implements
   - For brownfield: extend existing ROADMAP.md, don't replace it

6. **Generate individual task files:**
   - For each NEW task in ROADMAP, create `.haki/tasks/<task-id>.md`
   - Follow the task template from `.agent/templates/task.md`

**Output:** Write report to `.haki/reports/06-implementation-planner.md`
**Also create:** `.haki/ROADMAP.md` (or update it), `.haki/tasks/*.md`

---

## Handoff to swarm-dev-team

After Phase 5 completes, the handoff package is ready:

```
✅ .haki/PROJECT.md          — Vision, scope, constraints
✅ .haki/ROADMAP.md           — Task breakdown, milestones
✅ .haki/requirements.md      — Full requirements
✅ docs/superpowers/specs/
    └── YYYY-MM-DD-<topic>-design.md  — Approved design spec
✅ docs/DESIGN.md             — Design system (created or extended)
✅ docs/ARCHITECTURE.md       — Architecture (created or extended)
✅ docs/api-contract.md       — API contracts (created or extended)
✅ .haki/reports/            — All agent reports for traceability
```

**To start development:**
```
/swarm-dev-team
```

---

## Invocation

### Quick Start

**For a new project:**
```
/swarm-product-team
# ... provide project name and idea description ...
```

**For an existing project:**
```
/swarm-product-team
# ... provide project name, idea description, and note it's an existing project ...
```

### Full Orchestration Prompt

**Greenfield (new project):**
```
Read `.agent/skills/swarm-product-team/SKILL.md`.

This is a GREENFIELD project.
Project name: [NAME]
Idea: [DESCRIPTION]

Execute the full product team workflow:
1. Phase 0: SKIP (greenfield — no existing codebase)
2. Phase 1: Requirements Analyst (elicits requirements from idea)
3. Phase 2: Product Strategist (vision, personas, user stories, PROJECT.md)
4. Phase 3: Product Architect + UI/UX Designer (parallel — architecture + design system)
5. Phase 4: Spec Writer (consolidate into approved *-design.md)
6. Phase 5: Implementation Planner (generate ROADMAP.md + task files)

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

**Brownfield (existing project):**
```
Read `.agent/skills/swarm-product-team/SKILL.md`.

This is a BROWNFIELD project.
Project name: [NAME]
Idea: [DESCRIPTION]
Existing .haki/ state: [describe what exists — PROJECT.md, ROADMAP.md, etc.]
Existing DESIGN.md: [exists at PATH / does not exist]
Existing docs: [describe — ARCHITECTURE.md, api-contract.md, etc.]

Execute the product team workflow with Phase 0 (Discovery):
1. Phase 0: Product Discovery — scan project, build decision matrix, map codebase
2. Phase 1–5: Run phases based on Phase 0 decision matrix (SKIP / REUSE / EXTEND / RUN)

Every agent MUST:
- Read its assigned haki skills BEFORE starting work
- Load context from Phase 0 discovery.md (especially the decision matrix)
- For brownfield: read .haki/codebase/CONVENTIONS.md before writing any new code
- Write its report to .haki/reports/NN-role.md using the report template
- Follow the Phase 0 decision matrix: SKIP artifacts that exist, only create what's missing

After Phase 5:
- Confirm all files are created or updated
- Report handoff package summary (note which files were CREATED vs EXTENDED)
- Prompt user to review SPEC.md before proceeding to /swarm-dev-team
```

### Step-by-Step (Manual Control)

```bash
# Phase 0 — brownfield only
"You are PRODUCT DISCOVERY AGENT. Read .agent/skills/swarm-product-team/SKILL.md Phase 0.
Scan this existing project: [describe the project].
Check: .haki/, DESIGN.md, docs/, source files, package files.
Build the decision matrix: which phases to SKIP, REUSE, EXTEND, or RUN.
Write .haki/discovery.md with your decision matrix.
Map the codebase: create .haki/codebase/STACK.md, ARCHITECTURE.md, CONVENTIONS.md, STRUCTURE.md.
Write report to .haki/reports/00-product-discovery.md."

# Phase 1 — skip if .haki/requirements.md exists and covers the idea
"You are REQUIREMENTS ANALYST. Read .agent/skills/swarm-product-team/SKILL.md Phase 1.
Load .haki/discovery.md (brownfield) to check existing requirements.
Analyze the idea: [idea description].
Write report to .haki/reports/01-requirements-analyst.md.
Create or update .haki/requirements.md."

# Phase 2 — skip if .haki/PROJECT.md and .haki/prd.md exist and cover the idea
"You are PRODUCT STRATEGIST. Read .agent/skills/swarm-product-team/SKILL.md Phase 2.
Load .haki/requirements.md, .haki/discovery.md (brownfield).
Write vision, personas, user stories.
Write report to .haki/reports/02-product-strategist.md.
Create or update .haki/PROJECT.md, .haki/vision.md, .haki/prd.md."

# Phase 3 — parallel; Designer ALWAYS runs
# Subagent 1: Product Architect
"You are PRODUCT ARCHITECT. Read .agent/skills/swarm-product-team/SKILL.md Phase 3 Architect.
Load .haki/requirements.md, .haki/PROJECT.md, .haki/discovery.md.
For brownfield: read docs/ARCHITECTURE.md, docs/api-contract.md, .haki/codebase/ARCHITECTURE.md.
Design architecture and API contracts.
Write report to .haki/reports/03-product-architect.md.
Create or update docs/ARCHITECTURE.md, docs/api-contract.md."

# Subagent 2: UI/UX Designer
"You are UI/UX DESIGNER. Read .agent/skills/swarm-product-team/SKILL.md Phase 3 Designer.
Load .haki/requirements.md, .haki/PROJECT.md, .haki/discovery.md.
MANDATORY: first check if DESIGN.md exists anywhere:
  find . -name 'DESIGN.md' -not -path '*/node_modules/*' -not -path '*/.haki/*'
If exists: extend it. If not: propose and create new DESIGN.md.
Write report to .haki/reports/04-ui-ux-designer.md."

# Phase 4
"You are SPEC WRITER. Read .agent/skills/swarm-product-team/SKILL.md Phase 4.
Load all Phase 1–3 reports and discovery.md.
Write consolidated spec to docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md.
Run spec review loop (max 3 iterations).
Write report to .haki/reports/05-spec-writer.md."

# Phase 5
"You are IMPLEMENTATION PLANNER. Read .agent/skills/swarm-product-team/SKILL.md Phase 5.
Load spec, requirements, PROJECT.md, discovery.md.
For brownfield: read existing .haki/ROADMAP.md, extend it with new tasks.
Generate ROADMAP.md (create or update) and task files.
Write report to .haki/reports/06-implementation-planner.md."

# Confirm handoff
"Review all Phase 0–5 outputs. Confirm .haki/PROJECT.md, .haki/ROADMAP.md,
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md, DESIGN.md exist.
Report which files were CREATED vs EXTENDED (brownfield).
Prompt user to review the spec before running /swarm-dev-team."
```

---

## Quality Gates

| Phase | Gate | Criteria |
|-------|------|----------|
| 0 Discovery | ✅ Project Assessed | Decision matrix written, codebase mapped (if needed) |
| 1 Requirements | ✅ Requirements Complete | Functional + non-functional requirements documented, acceptance criteria defined |
| 2 Strategy | ✅ Vision Clear | Vision, personas, user stories, and PROJECT.md exist |
| 3 Architecture | ✅ Architecture Ready | Architecture and API contracts created or extended |
| 3 Design | ✅ Design System Ready | Component inventory, tokens, accessibility requirements documented |
| 4 Spec | ✅ Spec Approved | Spec review loop passed, spec file committed to git |
| 5 Planning | ✅ Plan Ready | ROADMAP.md exists with all tasks, task files created |

---

## Integration with Haki State Machine

| Haki State | Product Team Action |
|------------|---------------------|
| No `.haki/` | Run Phase 0 → full 5 phases (greenfield) |
| Has `.haki/`, no `discovery.md` | Run Phase 0 (discovery) → then Phase 1–5 based on decision matrix |
| Has full `.haki/` (all phases done) | Run Phase 0 to assess → skip all phases if complete |
| Has partial `.haki/` | Run Phase 0 → decision matrix will identify what to skip/run |
| Has ROADMAP, tasks ⏳ Pending | Phase 0 will detect → skip to Phase 0 decision, likely minimal work |
| New idea on existing project | Run Phase 0 → extend existing artifacts per decision matrix |
| Has ROADMAP, tasks 🔴 Blocked | Use Phase 0 discovery to refine blocked items |

The product team does NOT replace brainstorming — it runs **after** brainstorming produces an approved direction, to formalize and plan that direction.
