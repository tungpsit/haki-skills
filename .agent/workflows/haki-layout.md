---
name: haki:layout
description: Design UI layouts, screen flows, and FE documentation
---

# `/haki:layout` — Layout + Screen Flow + FE Doc

Design UI layouts and screen navigation flows, output structured documentation for frontend developers.

**Usage:** `/haki:layout [screen-name]`

If no screen name provided, prompts user for the screen to design.

## Prerequisites

- Project has `.haki/ROADMAP.md` (run `/haki:new-project` first if not)
- For design tokens: `.agent/skills/ui-ux-pro-max/` is available
- For Visual Companion: `.agent/skills/brainstorming/` visual companion infra is available

## Workflow

### 1. Identify Screen

- If `screen-name` arg provided → use it
- If not → ask user: "Screen nào bạn muốn thiết kế layout?"

### 2. Check Existing Docs

- Read `.haki/ROADMAP.md` — understand project context
- Check if `.haki/layouts/` exists → append to existing main doc
- Check if `.haki/screens/<name>.md` already exists → ask user: overwrite or update?

### 3. Context Gathering

Ask 3 questions:

1. **Purpose:** Screen này làm gì? Ai dùng?
2. **Auth:** Cần login không? Role nào?
3. **Data:** Hiển thị những data entity nào?

### 4. Wireframe (Visual Companion)

If user accepted Visual Companion:
- Start server and draw layout with user
- Iterate until approved
- Save wireframe as HTML comment or ASCII art in doc

If user declined:
- Draw ASCII wireframe directly in doc
- Ask for feedback, refine

### 5. Navigation Flow

Document:
- Entry points (from which screen/user action)
- Exit points (to which screen/action)
- Modal/dialog entry points
- State transitions

Output as Mermaid flowchart.

### 6. Design Tokens

Run ui-ux-pro-max lookups:
- Spacing system
- Typography scale
- Color tokens
- Breakpoints

Record in doc.

### 7. Component Inventory

For each main component:
- Name
- Props/interface
- States

### 8. Write Documentation

**Per-screen:** `.haki/screens/<screen-name>.md`
**Main doc:** `.haki/layouts/<app>-screen-flow.md` (create or update)

### 9. Delta Report

```
git add .haki/ -m "brain: pre-update snapshot"
→ Write/verify docs
→ Update .haki/ROADMAP.md (Knowledge Base section)
→ Commit
→ Notify user with rollback cmd
```

## Output

- Screen doc: `.haki/screens/<name>.md`
- Layout doc: `.haki/layouts/<app>-screen-flow.md`
- Linked in `.haki/ROADMAP.md`
