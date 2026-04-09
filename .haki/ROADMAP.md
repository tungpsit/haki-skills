# Project Roadmap — Haki Skills

> **Hub:** [.haki/](.haki/) là project brain — chứa toàn bộ docs, specs, decisions, research. Đọc file này trước để hiểu context dự án.

---

## Project Context

**Vision:** Haki Skills là một AI workflow system giúp AI coding agent làm việc theo specs-driven design. Mỗi bước trong quy trình đều được ghi lại vào `.haki/` và link vào `ROADMAP.md`.

**Tech Stack:** Node.js ≥ 18, Pure CJS, Event Sourcing (JSONL), Context7 MCP, Playwright, Vitest

**Target Users:**
- Developer dùng AI coding agents (Claude Code, Cursor, Codex, Gemini CLI, Antigravity)
- Các dự án muốn áp dụng specs-driven workflow

**Key Decisions:**

| Decision | Choice | Rationale |
|---|---|---|
| `.haki/` là project brain | `.haki/` (git committed) | Chứa specs, decisions, research, tasks — AI hiểu context qua `ROADMAP.md` |
| `.haki/runtime/` là gitignored | `.haki/runtime/` | Chỉ chứa event logs, temp state — không commit |
| Delta-based report | B — decisions + milestones/tasks | Chỉ report khi có thay đổi thực sự |
| AI ghi trực tiếp + rollback | C | AI ghi trực tiếp, user rollback bằng `git reset HEAD~1` |
| Delta detection | D — Hybrid (skill-level + proactive) | Mỗi skill có report step + AI chủ động check trước mỗi bước |

**Out of Scope:**
- UI của chính haki-skills project
- Static site generation cho docs
- Multi-language docs (phase 2)

**Contributing:**
- Repository: [github.com/tungpsit/haki-skills](https://github.com/tungpsit/haki-skills)
- Tests: `npm test`

---

## Milestones

### [M1: Specs-Driven Design System](./tasks/m1-specs-driven-design-system.md) — ✅ Completed

**Mục tiêu:** Biến haki-skills thành project tự self-document, AI hiểu context từ `.haki/ROADMAP.md`.

**Tasks:**
- [x] Update .gitignore — chỉ ignore `.haki/runtime/` và `.haki/ui/`
- [x] Update installer — tạo `.haki/` với cấu trúc mới
- [x] Update brainstorming skill — thêm report step + `.haki/` paths
- [x] Create `.haki/ROADMAP.md` — wiki hub cho chính dự án
- [x] Create ADR — `.haki/` là project brain
- [x] Update writing-plans skill — thêm report step + `.haki/` paths
- [x] Update executing-plans skill — thêm report step + `.haki/` paths
- [x] Review all skills — cập nhật đúng paths trong toàn bộ skills

---

### [M2: Layout + Screen Flow + FE Doc](./tasks/m2-layout-screen-flow-design.md) — ⏳ Pending

**Mục tiêu:** Tạo `haki:layout` skill cho layout design, screen flow, và FE documentation.

**Tasks:**
- [ ] Create `.agent/skills/layout-design/SKILL.md`
- [ ] Create `.agent/workflows/haki-layout.md`
- [ ] Update installer — thêm `layouts/` và `screens/` vào `.haki/`
- [ ] Create M2 task doc

---

## Knowledge Base

### Specs (newest first)

- [2026-04-09-layout-screen-flow-design](./specs/2026-04-09-layout-screen-flow-design.md) — `haki:layout` skill cho layout + screen flow + FE docs
- [2026-04-09-specs-driven-design](./specs/2026-04-09-specs-driven-design.md) — `.haki/` là project brain
- [2026-03-24-user-docs-generator-design](./specs/2026-03-24-user-docs-generator-design.md) — Workflow tạo user guide

### Decisions (newest first)

- [2026-04-09-haki-brain-location-adr](./decisions/2026-04-09-haki-brain-location-adr.md) — ADR: `.haki/` là project brain, `.haki/runtime/` gitignored

### Research (newest first)

_(Chưa có research doc nào)_

### Tasks (by milestone)

- [M1: Specs-Driven Design System](./tasks/m1-specs-driven-design-system.md)
