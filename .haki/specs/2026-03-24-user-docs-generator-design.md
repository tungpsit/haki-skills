# Design: User Docs Generator

> Workflow + Skill để tự động tạo tài liệu hướng dẫn sử dụng cho project đang dùng haki-skills.

## Problem

Developer dùng haki-skills để build product (VD: ERP), nhưng không có cách chuẩn hoá để tạo user guide cho end user. Hiện tại docs phải viết tay, không có screenshot tự động, không có template.

## Solution

Thêm workflow `/haki:docs` + skill `user-docs-generator` vào haki-skills. Agent tự browse app, chụp screenshot, và generate docs theo template chuẩn 5 sections.

## Deliverables

| Item                  | Path trong haki-skills repo                  |
| --------------------- | -------------------------------------------- |
| Workflow              | `.agent/workflows/haki-docs.md`              |
| Skill                 | `.agent/skills/user-docs-generator/SKILL.md` |
| Template — module doc | `.agent/templates/user-docs-module.md`       |
| Template — index      | `.agent/templates/user-docs-index.md`        |

## Output Structure (trong project sử dụng)

```
.haki/generated/docs/user-guides/
├── index.md
├── assets/
│   ├── {module}-{nn}-{action}.png
│   └── ...
├── {module-slug}.md
└── ...
```

## Config

Thêm vào `.haki/config.json`:

```json
{
  "docs_language": "vi",
  "docs_output_dir": ".haki/generated/docs/user-guides"
}
```

## Workflow: `/haki:docs [module-name] [--all]`

### Trigger

- `/haki:docs inventory` → tạo docs cho module Inventory
- `/haki:docs --all` → detect tất cả modules, tạo docs cho từng cái

### Steps

1. **Detect modules** — từ arg, hoặc scan routes/menu nếu `--all`
2. **Quick Q&A** (3-4 câu, multiple choice) — target user, main flow, auth requirements
3. **Browse & Screenshot** (hybrid) — auto-capture via Chrome DevTools MCP, fallback hỏi user
4. **Generate docs** — 5 sections theo template, ngôn ngữ từ config
5. **Update index.md** — thêm/cập nhật entry, sort alphabet
6. **Summary** — hiện kết quả + next step

### `--all` mode

Loop step 1-6 cho từng module, dùng parallel subagents. Q&A dùng defaults hoặc hỏi 1 lần cho tất cả.

## Skill: `user-docs-generator`

### Writing Rules

- **Tone:** Thực hành, ngắn gọn, phi kỹ thuật (viết cho end user)
- **Screenshot:** Mỗi bước có ảnh, dùng ①②③ để map mô tả ↔ vùng ảnh
- **Mermaid:** Mỗi module ≥ 1 user flow diagram
- **Language:** Theo `docs_language` config
- **Naming:** File kebab-case, ảnh `{module}-{nn}-{action}.png`

### Screenshot Capture Rules

- Check dev server (try fetch localhost port)
- Nếu chạy → Chrome DevTools MCP: navigate, screenshot, lưu `assets/`
- Nếu auth wall / complex state → hỏi user screenshot path
- Nếu dev server off → placeholder `<!-- screenshot: [mô tả] -->`

## Template: `user-docs-module.md`

```markdown
# {Module Name}

## Tổng quan

{Mô tả ngắn: làm gì, ai dùng, khi nào dùng}

## Luồng thao tác

(Mermaid flowchart)

## Hướng dẫn từng bước

### Bước N: {Tên}

{Mô tả + ①②③ annotations}
![Bước N](assets/{module}-{nn}-{action}.png)

## Mô tả các trường

| Trường | Bắt buộc | Mô tả |

## Câu hỏi thường gặp

**Q:** ... **A:** ...
```

## Template: `user-docs-index.md`

```markdown
# Hướng dẫn sử dụng

| Module | Mô tả | Link |
| ------ | ----- | ---- |
```

## Decisions

- Output: Markdown (phase 1), static site wrapper (phase 2 — future)
- Screenshot: Hybrid — auto khi được, hỏi user khi không
- Scope: Per module + auto-index, `--all` cho batch
- Language: Configurable, default `vi`
