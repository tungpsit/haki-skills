# ADR: `.haki/` — Project Brain Location

**Date:** 2026-04-09
**Status:** Accepted
**Context:** haki-skills v0.2.5+ — AI workflow system cho specs-driven development

---

## Problem

haki-skills hiện tại dùng `.haki/` làm runtime directory (hoàn toàn gitignored). Không có:
- `ROADMAP.md` cho chính dự án
- Specs, decisions, research docs được commit
- Cơ chế delta report loop
- Self-documentation

Kết quả: AI agent không có cách chuẩn để hiểu project context khi context bị reset. Kiến thức dự án không được lưu trữ.

---

## Decision

**`.haki/` được chia thành 2 phần:**

| Phần | Git | Mục đích |
|---|---|---|
| `.haki/` (root) | **Committed** | Chứa toàn bộ project docs |
| `.haki/runtime/` | **Gitignored** | Chứa runtime data (event logs, temp state) |

**Cấu trúc committed docs:**
```
.haki/
├── ROADMAP.md          # Wiki hub — link đến mọi thứ
├── specs/              # Design specs
├── decisions/          # Architecture Decision Records
├── research/           # Tech stack research
└── tasks/             # Individual task docs
```

**`.gitignore` changes:**
```gitignore
# Haki runtime artifacts (do NOT commit)
/.haki/runtime/
/.haki/ui/
```

---

## Consequences

### Positive
- AI hiểu project context từ `.haki/ROADMAP.md` kể cả khi context reset
- Kiến thức dự án được lưu trữ vĩnh viễn trong git history
- Delta report loop đảm bảo docs luôn updated
- Rollback mechanism đơn giản (`git reset HEAD~1`)

### Negative
- Installer phải tạo cấu trúc mới khi init
- Existing `.haki/specs/` (cũ, gitignored) cần migrate
- Mỗi skill phải thêm report step vào workflow

---

## Rollback

Nếu cần rollback:
```bash
git reset HEAD~1
```

---

## References

- Spec: [.haki/specs/2026-04-09-specs-driven-design.md](./specs/2026-04-09-specs-driven-design.md)
- Related: [.haki/tasks/m1-specs-driven-design-system.md](./tasks/m1-specs-driven-design-system.md)
