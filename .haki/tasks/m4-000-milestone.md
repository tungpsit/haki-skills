---
id: m4-000
title: "M4: Skill Quality Validation System"
type: milestone
status: completed
priority: 1
depends_on: []
created: 2026-04-12
created_by: claude
---

## Objective

Add automated validation for all skills — detect missing SKILL.md, duplicate names, broken @-links, and orphan directories.

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Write validate-skills.js script | ✅ |
| 2 | Run baseline validation — fix all issues | ✅ |
| 3 | Add taste-research/SKILL.md (was orphan) | ✅ |

## Notes
Baseline scan: 25 skills, 0 errors, 0 warnings. Found 1 orphan: taste-research (now fixed).
