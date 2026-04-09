# M2: Layout + Screen Flow + FE Doc Skill

**Milestone:** M2
**Status:** ⏳ Pending
**Spec:** [.haki/specs/2026-04-09-layout-screen-flow-design.md](../specs/2026-04-09-layout-screen-flow-design.md)

---

## Mục tiêu

Tạo `haki:layout` — skill + workflow cho layout design, screen flow navigation, và FE documentation. Output chuẩn cho FE dev triển khai UI.

---

## Tasks

| # | Task | Status |
|---|---|---|
| 1 | Create `.agent/skills/layout-design/SKILL.md` | ✅ |
| 2 | Create `.agent/workflows/haki-layout.md` | ✅ |
| 3 | Update installer — thêm `layouts/` + `screens/` vào `.haki/` | ✅ |
| 4 | Create M2 task doc | ✅ |

---

## Scope

- Layout skill + workflow file
- Output: `.haki/layouts/<app>-screen-flow.md` + `.haki/screens/<name>.md`
- Integration: Visual Companion, ui-ux-pro-max, user-docs-generator
- Trigger: CLI (`/haki:layout`) + auto sau brainstorm

## Out of Scope

- Component library implementation
- Actual FE code generation
- Design tool integration (Figma, etc.)
