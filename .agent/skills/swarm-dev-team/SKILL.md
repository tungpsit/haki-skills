---
name: swarm-dev-team
description: Spawn a full software development team as parallel subagents, each with specialized roles and haki skills. Supports both greenfield and brownfield projects. Produces structured reports for tracking and review.
---

# Swarm Dev Team

Orchestrate a complete software development team using Claude Code subagents. Each agent assumes a specialized role, leverages specific haki skills/workflows, and produces a standardized report.

**Works with:** Existing haki workflows (`/haki:*`), haki-tools CLI, and all `.agent/skills/`.

---

## When to Use

- Starting a new feature or project that spans multiple concerns (DB, backend, frontend, testing, security, docs, DevOps)
- Applying structured team development to an existing codebase (brownfield)
- When you need traceable reports per role for review and auditing

## Prerequisites

- Haki installed in the project (`npx haki-skills --for claude`)
- `.haki/PROJECT.md` and `.haki/ROADMAP.md` exist (run `/haki:new-project` first)
- For brownfield: `.haki/codebase/` exists (run `/haki:map-codebase` first)

---

## Team Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 🎯 TECH LEAD (You / Orchestrator)        │
│   /haki:next → Discovery → Plan → Dispatch → Review     │
└────────────────────────────┬─────────────────────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
        ▼                    ▼                     ▼
┌──────────────┐   ┌──────────────┐   ┌───────────────┐
│ 📐 Architect │   │ 🗄️ DB Eng.   │   │ 🔬 Researcher │
│  (Phase 1)   │   │  (Phase 2)   │   │  (Phase 1)    │
└──────┬───────┘   └──────┬───────┘   └───────────────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐    ← Parallel
│ ⚙️ Backend   │   │ 🎨 Frontend  │
│  (Phase 3)   │   │  (Phase 3)   │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐    ← Parallel
│ 🧪 QA / Test │   │ 🔒 Security  │
│  (Phase 4)   │   │  (Phase 4)   │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐    ← Parallel
│ 📝 Tech Docs │   │ 🚀 DevOps   │
│  (Phase 5)   │   │  (Phase 5)   │
└──────────────┘   └──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  📊 DASHBOARD (auto-generated)   │
└──────────────────────────────────┘
```

---

## Report Directory Structure

All agent reports are stored under `.haki/reports/`. This directory is created automatically.

```
.haki/
├── reports/
│   ├── 00-discovery.md              ← Brownfield only: codebase analysis
│   ├── 01-architect.md              ← Architecture decisions & diagrams
│   ├── 02-researcher.md             ← Tech stack research (Context7)
│   ├── 03-db-engineer.md            ← Schema design & migrations
│   ├── 04-backend-dev.md            ← Backend implementation report
│   ├── 05-frontend-dev.md           ← Frontend implementation report
│   ├── 06-qa-engineer.md            ← Test results & coverage
│   ├── 07-security-engineer.md      ← Security audit findings
│   ├── 08-tech-writer.md            ← Documentation status
│   ├── 09-devops-engineer.md        ← CI/CD & deployment report
│   └── DASHBOARD.md                 ← Aggregated team dashboard
├── PROJECT.md
├── ROADMAP.md
├── tasks/
├── research/
└── codebase/                        ← From /haki:map-codebase
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

- **Received from:** [Previous agent/phase]
- **Files read:** [List of files consumed]
- **Haki context:** [PROJECT.md, ROADMAP.md, task files, codebase maps used]

---

## Objectives

- [x] Objective 1 — completed
- [x] Objective 2 — completed
- [ ] Objective 3 — skipped (reason)

---

## Tasks Executed

### Task 1: [Name]

- **Status:** ✅ Done | ⚠️ Partial | ❌ Failed | ⏭️ Skipped
- **Haki skill used:** [skill name from .agent/skills/]
- **Haki workflow used:** [workflow name, if any]
- **Files changed:**

| File | Action | Description |
|------|--------|-------------|
| `path/to/file` | Created | Brief description |
| `path/to/file` | Modified | Brief description |

- **Details:** [What was done]
- **Issues found:** [Any problems discovered]

### Task 2: [Name]
...

---

## Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| [metric] | [val] | [val] | [val] |

---

## Issues & Risks

| # | Severity | Description | Recommendation | Status |
|---|----------|-------------|----------------|--------|
| 1 | 🔴 Critical | ... | ... | Open |
| 2 | 🟡 Medium | ... | ... | Resolved |
| 3 | 🟢 Low | ... | ... | Open |

---

## Output

- **Total files created:** [N]
- **Total files modified:** [N]
- **Handoff notes:** [What the next agent needs to know]

---

## Recommendations

1. [Actionable recommendation]
2. [Actionable recommendation]
```

---

## Phase Execution

### Phase 0: Discovery (Brownfield Only)

**Trigger:** Project has existing source code.

**Action:** Run `/haki:map-codebase` which spawns 4 parallel mapper subagents:

| Mapper | Output | Content |
|--------|--------|---------|
| Stack | `.haki/codebase/STACK.md` | Languages, frameworks, build tools, deps |
| Architecture | `.haki/codebase/ARCHITECTURE.md` | System patterns, data flow, API design |
| Conventions | `.haki/codebase/CONVENTIONS.md` | Code style, naming, testing patterns |
| Structure | `.haki/codebase/STRUCTURE.md` | Directory tree, entry points, configs |

After mapping, also scan for issues:

```bash
# Find TODOs, FIXMEs, HACKs
grep -rn "TODO\|FIXME\|HACK\|XXX\|DEPRECATED" --include="*.ts" --include="*.tsx" --include="*.py" --include="*.go" . | head -50

# Count test files
find . -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.*" | wc -l

# Check git history
git log --oneline -20 2>/dev/null
```

Write discovery summary to `.haki/reports/00-discovery.md` using the report template.

**Brownfield golden rules:**
- Do NOT refactor working code just for style preferences
- Do NOT change tech stack unless there is a critical reason
- Prioritize CONSISTENCY with existing codebase conventions
- Every change must have a rollback path
- Read `.haki/codebase/CONVENTIONS.md` before writing any code

---

### Phase 1: Architecture & Research (Parallel)

Spawn two subagents in parallel:

#### 📐 Subagent: System Architect

**Haki skills to read first:**
- `.agent/skills/writing-plans/SKILL.md`
- `.agent/skills/brainstorming/SKILL.md`

**Haki context to load:**
- `.haki/PROJECT.md` — project vision and constraints
- `.haki/ROADMAP.md` — task breakdown
- `.haki/codebase/ARCHITECTURE.md` — existing architecture (brownfield)
- `.haki/codebase/CONVENTIONS.md` — existing conventions (brownfield)

**Instructions:**

1. **Architecture design:**
   - Choose architectural pattern (monolith / modular monolith / microservices)
   - Define layer architecture (presentation → application → domain → infrastructure)
   - Draw system diagrams (C4 model: context, container, component)
   - For brownfield: map as-is → define to-be → plan migration path

2. **API contract design:**
   - Define all API endpoints (OpenAPI spec or markdown table)
   - Request/response schemas with TypeScript types
   - Error response format (standardized)
   - Pagination, filtering, sorting conventions

3. **Coding conventions (greenfield only):**
   - Project folder structure
   - Naming conventions
   - Error handling strategy
   - Logging strategy
   - For brownfield: document EXISTING conventions, do not invent new ones

4. **Create base config files (greenfield only):**
   - `tsconfig.json` / `pyproject.toml` / equivalent
   - Linter config (ESLint/Biome/Ruff)
   - `.env.example`

**Output:** Write report to `.haki/reports/01-architect.md`
**Also save:** `docs/ARCHITECTURE.md`, `docs/api-contract.md`

#### 🔬 Subagent: Tech Researcher

**Haki skills to read first:**
- `.agent/skills/context7-research/SKILL.md`

**Haki workflow:** Follow `/haki:research` protocol exactly.

**Instructions:**

1. For every library in the chosen tech stack, use Context7 MCP:
   - Resolve library ID
   - Query docs for latest version, install command, config format
   - Check peer dependency compatibility

2. Research integration patterns between chosen libraries

3. Save verified stack to `.haki/research/STACK.md`

**Output:** Write report to `.haki/reports/02-researcher.md`

---

### Phase 2: Database Engineering

#### 🗄️ Subagent: Database Engineer

**Haki skills to read first:**
- `.agent/skills/test-driven-development/SKILL.md`
- `.agent/skills/subagent-driven-development/SKILL.md`

**Haki context to load:**
- `.haki/reports/01-architect.md` — architecture decisions
- `.haki/reports/02-researcher.md` — verified library versions
- `.haki/codebase/STACK.md` — existing DB setup (brownfield)

**Instructions:**

1. **Data modeling:**
   - Analyze entities and relationships from ROADMAP requirements
   - Design ERD (Entity Relationship Diagram)
   - Normalize to 3NF; denormalize intentionally for performance
   - Define index strategy

2. **Schema implementation:**
   - Create migration files in dependency order
   - Define constraints: PK, FK, UNIQUE, CHECK, NOT NULL
   - Add audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`
   - Soft delete via `deleted_at` timestamp
   - For brownfield: create NEW migrations only, NEVER edit existing ones

3. **Seed data:**
   - Development seed files
   - Test fixtures

4. **Performance:**
   - Composite indexes for frequent query patterns
   - Identify potential N+1 query patterns

**TDD approach:** Write migration → verify it runs → write seed → verify data integrity.

**Output:** Write report to `.haki/reports/03-db-engineer.md`

---

### Phase 3: Implementation (Parallel)

Spawn two subagents in parallel. Both MUST follow TDD.

#### ⚙️ Subagent: Backend Developer

**Haki skills to read first:**
- `.agent/skills/subagent-driven-development/SKILL.md` — follow the implementer prompt
- `.agent/skills/test-driven-development/SKILL.md` — TDD cycle is mandatory
- `.agent/skills/systematic-debugging/SKILL.md` — for when tests fail unexpectedly
- `.agent/skills/verification-before-completion/SKILL.md` — verify before marking done

**Haki workflow integration:**
- For each task from ROADMAP, the plan in `.haki/tasks/[task-id].md` defines the steps
- Follow the TDD cycle from the task plan: write test → RED → implement → GREEN → commit
- Update task file's "Implementation Details" and "Execution Results" sections after completion

**Haki context to load:**
- `.haki/reports/01-architect.md` — API contracts, architecture
- `.haki/reports/03-db-engineer.md` — DB schema, models
- `.haki/tasks/[task-id].md` — task plan with TDD steps
- `.haki/codebase/CONVENTIONS.md` — existing code style (brownfield)

**Instructions:**

1. **Project setup (greenfield):**
   - Initialize project with verified tech stack from researcher report
   - Install dependencies using exact versions from `.haki/research/STACK.md`
   - Configure project structure per architect report

2. **Core infrastructure:**
   - Database connection & ORM setup
   - Authentication & authorization middleware (JWT/OAuth2)
   - Request validation middleware (Zod/Joi/Pydantic)
   - Global error handler with standardized error format
   - Structured logging middleware
   - Rate limiting, CORS, health check endpoint

3. **Business logic (per task):**
   - Follow Clean Architecture layers:
     - Controllers/Handlers → Services/Use Cases → Repositories → Entities
   - Implement each API endpoint per contract from architect
   - Transaction management for complex operations
   - TDD: every function has a test BEFORE implementation

4. **For brownfield:**
   - Match existing code patterns exactly
   - Add new endpoints following existing router conventions
   - Do NOT restructure existing code

**Quality gates:**
- All tests pass
- No linting errors
- No `any` types (TypeScript)
- Every public function has JSDoc/TSDoc

**Output:** Write report to `.haki/reports/04-backend-dev.md`
**Also update:** `.haki/tasks/[task-id].md` with Implementation Details + Execution Results

#### 🎨 Subagent: Frontend Developer

**Haki skills to read first:**
- `.agent/skills/subagent-driven-development/SKILL.md`
- `.agent/skills/test-driven-development/SKILL.md`
- Read UI skill based on config: `node .agent/bin/haki-tools.cjs config get ui_design_skill --raw`
  - If `ui-ux-pro-max` → read `.agent/skills/ui-ux-pro-max/SKILL.md`
  - If `taste-skill` → read `.agent/skills/taste-skill/SKILL.md` + variant skill
- `.agent/skills/verification-before-completion/SKILL.md`

**Haki context to load:**
- `.haki/reports/01-architect.md` — API contracts, component architecture
- `.haki/reports/02-researcher.md` — verified frontend library versions
- `.haki/tasks/[task-id].md` — task plan with TDD steps
- `.haki/codebase/CONVENTIONS.md` — existing UI patterns (brownfield)

**Instructions:**

1. **Project setup (greenfield):**
   - Initialize frontend with verified versions
   - Configure build tools, Tailwind/CSS, path aliases
   - Apply chosen UI design skill for design tokens and component style

2. **Design system & components:**
   - Create design tokens (colors, spacing, typography, shadows)
   - Build base components: Button, Input, Select, Modal, Toast, Table, Card
   - Each component must have: TypeScript props, variants, ARIA attributes, responsive design
   - Loading/error/empty states for every data-fetching component

3. **Pages & features (per task):**
   - Implement routing structure
   - API integration using TanStack Query / SWR
   - Form handling with validation (React Hook Form + Zod)
   - Optimistic updates for better UX

4. **Performance & UX:**
   - Code splitting & lazy loading
   - Skeleton loaders, error boundaries
   - Dark mode support (if specified)

5. **For brownfield:**
   - Match existing component patterns
   - Use existing design system/tokens
   - Do NOT introduce new UI libraries unless approved

**Output:** Write report to `.haki/reports/05-frontend-dev.md`
**Also update:** `.haki/tasks/[task-id].md` with Implementation Details + Execution Results

---

### Phase 4: Quality & Security (Parallel)

#### 🧪 Subagent: QA / Test Engineer

**Haki skills to read first:**
- `.agent/skills/test-driven-development/SKILL.md`
- `.agent/skills/api-testing/SKILL.md`
- `.agent/skills/playwright-automation/SKILL.md`
- `.agent/skills/playwright-intent-to-spec/SKILL.md`
- `.agent/skills/systematic-debugging/SKILL.md`
- `.agent/skills/verification-before-completion/SKILL.md`

**Haki workflows to use:**
- `/haki:api-test init` → set up API test infrastructure
- `/haki:api-test generate [resource]` → generate API tests per resource
- `/haki:e2e init` → set up Playwright infrastructure
- `/haki:e2e generate [feature]` → generate E2E tests per feature

**Instructions:**

1. **Review existing tests:**
   - Scan all `*.test.*` and `*.spec.*` files
   - Identify untested code paths using coverage reports
   - Check for testing anti-patterns (read `.agent/skills/test-driven-development/testing-anti-patterns.md`)

2. **Unit test gaps:**
   - Add tests for edge cases: null inputs, boundary values, error scenarios
   - Target: ≥ 80% code coverage

3. **API integration tests:**
   - Use `/haki:api-test` workflow to generate tests for each API resource
   - Test: success (200/201), validation error (400), not found (404), unauthorized (401)

4. **E2E tests:**
   - Use `/haki:e2e` workflow to set up Playwright
   - Generate specs for critical user journeys using `/haki:e2e-gen`
   - Critical paths: registration → login → core feature → logout

5. **Performance baseline:**
   - API response time benchmarks
   - Frontend Lighthouse audit script

**Metrics to report:**

| Metric | Value | Target |
|--------|-------|--------|
| Unit test coverage | X% | ≥ 80% |
| API tests passing | X/Y | 100% |
| E2E tests passing | X/Y | 100% |
| Lint errors | N | 0 |

**Output:** Write report to `.haki/reports/06-qa-engineer.md`

#### 🔒 Subagent: Security Engineer

**Haki skills to read first:**
- `.agent/skills/systematic-debugging/SKILL.md` — root cause analysis methodology
- `.agent/skills/verification-before-completion/SKILL.md`

**Instructions:**

1. **OWASP Top 10 audit:**
   - Injection (SQL, NoSQL, OS Command)
   - Broken authentication
   - Sensitive data exposure
   - Broken access control
   - XSS (Cross-Site Scripting)
   - Security misconfiguration
   - Using components with known vulnerabilities

2. **Authentication hardening:**
   - Password hashing review (bcrypt/argon2 with proper rounds)
   - JWT security (expiry, refresh rotation, blacklisting)
   - RBAC/ABAC implementation review
   - Brute force protection

3. **Data protection:**
   - Input sanitization audit
   - Output encoding
   - File upload security
   - PII handling

4. **Infrastructure security:**
   - Security headers (CSP, HSTS, X-Frame-Options)
   - CORS policy review
   - Dependency vulnerability scan:
     ```bash
     npm audit 2>/dev/null || bun audit 2>/dev/null || pip audit 2>/dev/null
     ```
   - Secrets management review (.env files, hardcoded secrets)

5. **Fix critical issues immediately.** Log all findings with severity.

**Output:** Write report to `.haki/reports/07-security-engineer.md`

---

### Phase 5: Documentation & DevOps (Parallel)

#### 📝 Subagent: Technical Writer

**Haki skills to read first:**
- `.agent/skills/user-docs-generator/SKILL.md`
- `.agent/skills/output-skill/SKILL.md` — full output enforcement

**Haki workflow to use:**
- `/haki:docs --all` — generate user guides for all modules

**Instructions:**

1. **README.md:**
   - Project overview, features, tech stack
   - Quick start guide (< 5 minutes to run)
   - Contributing guidelines

2. **Developer documentation:**
   - `docs/GETTING_STARTED.md` — detailed setup
   - `docs/ARCHITECTURE.md` — from architect report
   - `docs/API.md` — API reference from contracts
   - `docs/DATABASE.md` — schema documentation
   - `docs/DEPLOYMENT.md` — deployment guide

3. **Code documentation:**
   - JSDoc/TSDoc for all public functions
   - Inline comments for complex logic

4. **User documentation:**
   - Run `/haki:docs --all` to generate user guides with screenshots
   - Output in `.haki/generated/docs/user-guides/`

5. **ADRs (Architecture Decision Records):**
   - Extract decisions from `.haki/reports/01-architect.md`
   - Write to `docs/adr/NNN-decision-title.md`

**Output:** Write report to `.haki/reports/08-tech-writer.md`

#### 🚀 Subagent: DevOps Engineer

**Haki skills to read first:**
- `.agent/skills/verification-before-completion/SKILL.md`

**Instructions:**

1. **Containerization:**
   - Dockerfile (multi-stage build, non-root user, minimal base image)
   - docker-compose.yml (app + DB + Redis + reverse proxy)
   - `.dockerignore`

2. **CI/CD pipeline:**
   - `.github/workflows/ci.yml`:
     - Lint & format check
     - Unit tests + coverage
     - Integration tests (API tests from QA)
     - Security scan (Trivy/Snyk)
     - Build Docker image
     - E2E tests
     - Deploy (staging/production)

3. **Environment management:**
   - `.env.example` with all variables documented
   - Environment-specific configs (dev/staging/prod)

4. **Monitoring & observability:**
   - Health check endpoints
   - Structured JSON logging config
   - Error tracking setup (Sentry config)

5. **Developer scripts:**
   - `scripts/setup.sh` — one-command dev environment setup
   - `scripts/seed.sh` — database seeding
   - `Makefile` with common commands

**Output:** Write report to `.haki/reports/09-devops-engineer.md`

---

## Dashboard Generation

After ALL agents complete, generate `.haki/reports/DASHBOARD.md`:

```markdown
# 📊 Swarm Team Dashboard

**Project:** [from .haki/PROJECT.md]
**Generated:** [ISO 8601 timestamp]
**Overall Status:** 🟢 All Clear | 🟡 Has Warnings | 🔴 Has Blockers

---

## Team Summary

| # | Agent | Status | Tasks | Files Changed | Issues | Duration |
|---|-------|--------|-------|---------------|--------|----------|
| 0 | 🔍 Discovery | 🟢 | 4/4 | 4 created | 0 | ~2min |
| 1 | 📐 Architect | 🟢 | 3/3 | 5 created | 0 | ~3min |
| 2 | 🔬 Researcher | 🟢 | 1/1 | 1 created | 0 | ~2min |
| 3 | 🗄️ DB Engineer | 🟢 | 4/4 | 8 created | 1 🟡 | ~3min |
| 4 | ⚙️ Backend | 🟢 | N/N | X files | 0 | ~Xmin |
| 5 | 🎨 Frontend | 🟢 | N/N | X files | 0 | ~Xmin |
| 6 | 🧪 QA | 🟡 | N/N | X files | 2 🟡 | ~Xmin |
| 7 | 🔒 Security | 🟢 | N/N | X files | 1 🟢 | ~Xmin |
| 8 | 📝 Docs | 🟢 | N/N | X files | 0 | ~Xmin |
| 9 | 🚀 DevOps | 🟢 | N/N | X files | 0 | ~Xmin |

---

## Quality Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Test coverage | X% | ≥ 80% | ✅/❌ |
| API tests | X/Y pass | 100% | ✅/❌ |
| E2E tests | X/Y pass | 100% | ✅/❌ |
| Security critical | N | 0 | ✅/❌ |
| Lint errors | N | 0 | ✅/❌ |
| Docs coverage | X% | 100% | ✅/❌ |

---

## Open Issues (aggregated from all reports)

| # | Agent | Severity | Description | Recommendation |
|---|-------|----------|-------------|----------------|
| ... | ... | ... | ... | ... |

---

## Files Changed (total)

- **Created:** [N] files
- **Modified:** [N] files
- **Deleted:** [N] files

---

## Recommendations (top priority)

1. [From security report — highest severity first]
2. [From QA report]
3. [From architect report]

---

## Next Steps

- [ ] Review all reports in `.haki/reports/`
- [ ] Address open issues by severity
- [ ] Run `/haki:next` to continue with remaining ROADMAP tasks
```

---

## Invocation

### Quick Start (Recommended)

For a new project:
```
/haki:new-project
# ... answer questions, get PROJECT.md + ROADMAP.md ...
# Then:
/swarm-team
```

For an existing project:
```
/haki:map-codebase
# ... wait for codebase analysis ...
/haki:new-project
# ... answer questions ...
/swarm-team
```

### Full Orchestration Prompt

```
Read `.agent/skills/swarm-dev-team/SKILL.md`.

This is a [NEW | EXISTING] project.
Project: [NAME]
Description: [DESCRIPTION]
Tech stack: [TECH STACK or "decide based on requirements"]

Execute the full swarm team workflow:
1. Phase 0: Discovery (if existing project — use /haki:map-codebase)
2. Phase 1: Architect + Researcher (parallel subagents)
3. Phase 2: DB Engineer
4. Phase 3: Backend + Frontend (parallel subagents)
5. Phase 4: QA + Security (parallel subagents)
6. Phase 5: Docs + DevOps (parallel subagents)
7. Generate DASHBOARD.md

Every agent MUST:
- Read its assigned haki skills BEFORE starting work
- Load context from previous agent reports
- Follow TDD (test first) for all implementation
- Write its report to .haki/reports/NN-role.md using the report template
- Update .haki/tasks/[task-id].md with Implementation Details + Execution Results

For brownfield: read .haki/codebase/CONVENTIONS.md and match existing patterns.
```

### Step-by-Step (Manual Control)

If you prefer to run each phase manually with review between phases:

```bash
# Phase 0 (brownfield only)
/haki:map-codebase

# Phase 1 — parallel
# Subagent 1: "You are SYSTEM ARCHITECT. Read .agent/skills/swarm-dev-team/SKILL.md Phase 1 Architect section. Load .haki/PROJECT.md and .haki/ROADMAP.md. Write report to .haki/reports/01-architect.md"
# Subagent 2: "You are TECH RESEARCHER. Run /haki:research for the full tech stack. Write report to .haki/reports/02-researcher.md"

# Review Phase 1 reports before continuing...

# Phase 2
# "You are DB ENGINEER. Read .agent/skills/swarm-dev-team/SKILL.md Phase 2. Load reports 01 and 02. Write report to .haki/reports/03-db-engineer.md"

# Phase 3 — parallel
# Subagent 1: "You are BACKEND DEVELOPER. Read .agent/skills/swarm-dev-team/SKILL.md Phase 3 Backend section..."
# Subagent 2: "You are FRONTEND DEVELOPER. Read .agent/skills/swarm-dev-team/SKILL.md Phase 3 Frontend section..."

# Phase 4 — parallel
# Subagent 1: "You are QA ENGINEER. Use /haki:api-test and /haki:e2e workflows..."
# Subagent 2: "You are SECURITY ENGINEER..."

# Phase 5 — parallel
# Subagent 1: "You are TECHNICAL WRITER. Use /haki:docs --all..."
# Subagent 2: "You are DEVOPS ENGINEER..."

# Generate dashboard
# "Read all .haki/reports/*.md and generate .haki/reports/DASHBOARD.md using the dashboard template from the skill."
```

---

## Integration with Haki State Machine

This skill integrates with haki's existing state machine:

| Haki State | Swarm Action |
|------------|-------------|
| No `.haki/` | Run `/haki:new-project` first |
| Has PROJECT.md, no ROADMAP | Run `/haki:new-project` to completion |
| Has ROADMAP, tasks ⏳ Pending | Run `/haki:discuss` per task, then swarm |
| Has ROADMAP, tasks 💬 Discussed | Run `/haki:plan` per task, then swarm |
| Has ROADMAP, tasks 📋 Planned | **Ready for swarm** — run `/swarm-team` |
| All tasks ✅ Complete | Run `/haki:new-milestone` for next phase |

The swarm skill does NOT replace haki workflows — it **orchestrates them at scale** by assigning specialized roles to subagents and adding a reporting layer.

---

## Quality Gates

Each phase must pass before the next begins:

| Phase | Gate | Criteria |
|-------|------|----------|
| 0 Discovery | ✅ Codebase Mapped | All 4 codebase docs exist in `.haki/codebase/` |
| 1 Architecture | ✅ Design Complete | API contracts defined, architecture documented |
| 1 Research | ✅ Stack Verified | All libraries verified via Context7 |
| 2 Database | ✅ Schema Ready | Migrations run successfully, seeds load |
| 3 Backend | ✅ APIs Working | All endpoints match contract, tests pass |
| 3 Frontend | ✅ UI Functional | Components render, responsive, accessible |
| 4 QA | ✅ Coverage Met | ≥ 80% unit, API tests pass, E2E pass |
| 4 Security | ✅ No Criticals | Zero critical/high severity findings |
| 5 Docs | ✅ Docs Complete | README + API docs + user guides exist |
| 5 DevOps | ✅ Pipeline Green | CI/CD runs end-to-end successfully |