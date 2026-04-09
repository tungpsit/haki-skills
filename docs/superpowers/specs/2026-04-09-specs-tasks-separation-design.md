# Design: Phân rõ Specs vs Tasks

**Date:** 2026-04-09
**Status:** Draft
**Type:** Refactoring

---

## Problem

Specs và tasks đang chứa thông tin trùng lặp:
- **Spec doc:** Problem, Solution, Architecture, Tasks table, Scope
- **Task doc:** Problem, Solution, Tasks table, Scope, Deliverables — gần như copy spec

→ Lãng phí effort khi viết, dễ lệch nội dung khi update.

---

## Solution

**Specs = WHAT + WHY (immutable)** — Design decisions, architecture, approach. Không sửa sau khi approved. Là source of truth.

**Tasks = WHO + WHEN + STATUS (mutable)** — Chỉ chứa task list + status. Tham chiếu đến spec, không lặp lại nội dung.

---

## Task Doc Template

```markdown
# <Milestone Title>

**Milestone:** <ID>
**Status:** ⏳ Pending / ✅ Completed
**Spec:** [.haki/specs/<file>](../specs/<file>)

---

## Tasks

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | ... | ⏳ | ... |
| 2 | ... | ✅ | ... |

## Notes

_(Execution notes, blockers, learnings. Optional.)_
```

**Đã loại bỏ:** Problem, Solution, Architecture, Scope, Deliverables, Delta Decisions.

---

## Files to Update

| File | Action |
|---|---|
| `.haki/tasks/m1-specs-driven-design-system.md` | Refactor to lean template |
| `.haki/tasks/m2-layout-screen-flow-design.md` | Refactor to lean template |
| `.haki/ROADMAP.md` | Tasks section: keep as-is (already lean) |
| `brainstorming/SKILL.md` | Report step: task doc = lean reference |
| `writing-plans/SKILL.md` | Output: specs + tasks riêng, no duplication |
| `executing-plans/SKILL.md` | Update task status, not spec |
