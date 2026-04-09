# Design: Specs-Driven Design System cho Haki

**Date:** 2026-04-09
**Status:** Approved & Implemented
**Spec:** [.haki/specs/2026-04-09-specs-driven-design.md](./specs/2026-04-09-specs-driven-design.md)
**Task:** [.haki/tasks/m1-specs-driven-design-system.md](./tasks/m1-specs-driven-design-system.md)

---

## Problem

haki-skills hiện tại không có:
- `ROADMAP.md` cho chính dự án
- Specs, decisions, research docs được commit
- Cơ chế delta report loop
- Self-documentation

AI agent không có cách chuẩn để hiểu project context khi context bị reset.

---

## Solution

### `.haki/` Structure

```
.haki/                          # Committed ✓
├── ROADMAP.md                   # Wiki hub
├── specs/                       # Design specs
├── decisions/                   # ADRs
├── research/                   # Tech research
├── tasks/                      # Task docs
└── runtime/                    # Gitignored
    └── ui/, event logs, ...
```

### ROADMAP.md — 3 Phần Cố Định

1. **Project Context** — vision, tech stack, target users, constraints
2. **Milestones** — link đến milestone docs + task status
3. **Knowledge Base** — specs, decisions, research (sorted newest first)

### Delta Report Loop

**Trigger conditions:**
- Quyết định thiết kế mới hoặc constraint mới
- Milestone/task mới được tạo
- Task status thay đổi

**Report flow:**
1. Pre-update git snapshot: `git add .haki/ -m "brain: pre-update snapshot"`
2. Write doc(s) to `.haki/`
3. Update `ROADMAP.md` — add link under appropriate section
4. Commit changes
5. Notify user + rollback command

**Rollback:** `git reset HEAD~1`

### AI Write + Rollback

- AI ghi trực tiếp vào `.haki/`
- Pre-update snapshot đảm bảo rollback được
- User có thể rollback bằng 1 lệnh

---

## Implementation

| File | Change |
|---|---|
| `.gitignore` | Only ignore `.haki/runtime/` + `.haki/ui/` |
| `bin/install.js` | Create new `.haki/` structure on init |
| `brainstorming/SKILL.md` | Add step 9 (Delta Report) + `.haki/` paths |
| `.haki/ROADMAP.md` | Created — wiki hub for haki-skills |
| `.haki/decisions/2026-04-09-haki-brain-location-adr.md` | Created — ADR |

---

## Delta Decisions

| Decision | Choice | Rationale |
|---|---|---|
| `.brain/` location | `.haki/` (existing) | Giữ đúng hệ thống haki, không tạo directory mới |
| Git | Commit `.haki/` (trừ runtime/) | Source of truth, không gitignored |
| Delta trigger | B — decisions + milestones/tasks | Chỉ report khi có thay đổi thực sự |
| AI write | C — ghi trực tiếp + rollback | Đơn giản, hiệu quả |
| Delta detection | D — Hybrid | Skill-level report + proactive check |
