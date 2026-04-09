# Design: Layout + Screen Flow + FE Doc Skill

**Date:** 2026-04-09
**Status:** Approved
**Milestone:** M2

---

## Problem

Khi brainstorm về UI/app, sau khi design được approve:
- Không có cách chuẩn để output layout spec cho FE dev
- Layout từ Visual Companion không được capture vào doc
- Screen flow (navigation) không được formalize thành tài liệu
- Không có component inventory (props, states) cho FE

## Solution

Tạo **`haki:layout`** — skill + workflow cho layout design + screen flow + FE documentation.

---

## Architecture

### Files Created

| File | Purpose |
|---|---|
| `.agent/skills/layout-design/SKILL.md` | Skill definition + instructions |
| `.agent/workflows/haki-layout.md` | Workflow file cho `/haki:layout` CLI |

### Triggers

1. **CLI:** `/haki:layout [screen-name]` — gọi riêng bất kỳ lúc nào
2. **Auto:** Sau brainstorming nếu spec có UI — gợi ý: *"Có muốn tạo layout doc cho FE dev không?"*

### Output Locations

```
.haki/
├── layouts/                           # Main layout docs (git committed)
│   └── <app>-screen-flow.md
├── screens/                           # Per-screen docs (git committed)
│   └── <screen-name>.md
└── ...
```

---

## Main Layout Doc — `.haki/layouts/<app>-screen-flow.md`

```markdown
# <App Name> — Screen Flow & Layout Spec

## Navigation Flow

<!-- Mermaid diagram: full app navigation -->
flowchart TD
    A[Login] --> B[Dashboard]
    B --> C[Screen 1]
    C --> D[Screen 2]
    ...

## Layout Zones (Global)

| Zone | Description | Grid Area |
|---|---|---|
| Header | App bar, nav | grid-area: header |
| Sidebar | Navigation menu | grid-area: sidebar |
| Main | Content area | grid-area: main |

## Design Tokens

| Token | Value |
|---|---|
| Spacing unit | 4px |
| Typography scale | ... |
| Breakpoints | ... |

## Screens

| Screen | Doc | Auth | Purpose |
|---|---|---|---|
| Dashboard | [screens/dashboard.md](./screens/dashboard.md) | Required | ... |
| Login | [screens/login.md](./screens/login.md) | None | ... |
```

---

## Per-Screen Doc — `.haki/screens/<screen-name>.md`

```markdown
# <Screen Name>

## Metadata

**Purpose:** ...
**Auth:** Required / None
**Data:** ...

## Wireframe

<!-- ASCII/HTML layout zones -->
+--[ Header: Logo | Nav ]--+
|  [Sidebar]  |  [Main]   |
|              |           |
|              |           |
+----------------------------------+
|  [Footer]                  |
+---------------------------+

## Layout Grid

| Zone | Size | Responsive |
|---|---|---|
| Header | 56px fixed | Mobile: 48px |
| Sidebar | 240px | Collapsed on mobile |
| Main | flex-1 | Full width |

## Navigation

<!-- Mermaid: entry/exit points -->
flowchart LR
    A[Login] --> B[Dashboard]
    B --> C[This Screen]
    C --> D[Screen X]

## Component Inventory

| Component | Props | States |
|---|---|---|
| Button | label, variant, disabled | default, hover, active, disabled |
| Card | title, content, actions | default, hover |
| Form | fields, onSubmit | idle, submitting, error |

## States

| State | Description |
|---|---|
| Loading | Skeleton / spinner |
| Empty | Empty state illustration |
| Error | Error message + retry |
| Success | Success feedback |
```

---

## Integration với Hệ Sinh Thái

### Visual Companion (brainstorming)

- Tái sử dụng: HTML fragment classes, mockup infrastructure, session server
- Layout skill dùng chung `start-server.sh` + `.superpowers/brainstorm/` pattern
- Classes: `.mockup`, `.mock-nav`, `.mock-sidebar`, `.mock-button`, `.mock-input`, `.mock-card`

### ui-ux-pro-max

- Hỏi design tokens: spacing, typography, breakpoints, color tokens
- Kết quả ghi vào layout doc dưới `## Design Tokens` section

### user-docs-generator

- Dùng chung: screenshot capture rules, language config (`docs_language`)
- Assets: `{{docs_output_dir}}/assets/`

---

## Workflow: `/haki:layout [screen-name]`

1. **Hỏi context** — screen purpose, auth requirement, data sources (2-3 câu)
2. **Visual Companion** — vẽ wireframe với user (HTML mockup)
3. **Navigation** — hỏi entry/exit points, tạo Mermaid diagram
4. **Design tokens** — lookup từ ui-ux-pro-max, ghi vào doc
5. **Component inventory** — hỏi main components, props, states
6. **Output** — ghi `.haki/screens/<name>.md`
7. **Update main doc** — update `.haki/layouts/<app>-screen-flow.md`
8. **Link ROADMAP** — thêm link vào Knowledge Base

---

## Delta Report

Skill tự động:
1. Pre-update git snapshot
2. Write/verify layout docs
3. Update ROADMAP.md (Knowledge Base section)
4. Commit

---

## Deliverables

- `.agent/skills/layout-design/SKILL.md`
- `.agent/workflows/haki-layout.md`
- Installer: thêm `layouts/` và `screens/` vào `.haki/`
- M2 milestone trong ROADMAP.md
