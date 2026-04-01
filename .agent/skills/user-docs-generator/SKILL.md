---
name: user-docs-generator
description: "Generate end-user documentation for project modules. Creates visual guides with screenshots, Mermaid flow diagrams, step-by-step instructions, field references, and FAQ sections."
---

# User Docs Generator

Write end-user documentation that helps someone new to the system learn to use it independently. This skill is triggered by the `/haki:docs` workflow.

## Core Principles

### Write for End Users, Not Developers

- **No technical jargon.** Say "nhấn nút Thêm mới" not "trigger the POST /api/items endpoint"
- **Assume zero context.** The reader has never seen this screen before
- **Action-oriented.** Every paragraph should help the user DO something
- **Short sentences.** Max 20 words per sentence when possible

### Every Step Needs a Visual

- Each step in the guide MUST reference a screenshot
- Use ①②③ numbered annotations in text to point to areas on the screenshot
- Example: "① Nhấn nút **Thêm mới** ở góc trên bên phải → ② Điền thông tin vào form → ③ Nhấn **Lưu**"

### Language

- Read `docs_language` from `.haki/config.json` (default: `vi`)
- Write ALL content in the configured language
- Keep field names/button labels in their original language (as shown in the UI)

## Documentation Structure (5 Sections)

### Section 1: Tổng quan (Overview)

3-5 sentences answering:

- Module này làm gì?
- Ai sử dụng? (role/persona)
- Khi nào sử dụng?
- Truy cập từ đâu? (menu path)

### Section 2: Luồng thao tác (User Flow)

- Mermaid `flowchart TD` diagram
- Show the happy path with decision points
- Keep it simple: max 8-10 nodes
- Use clear Vietnamese/English labels (per docs_language)

### Section 3: Hướng dẫn từng bước (Step-by-step)

For each step:

1. Heading: `### Bước N: {Tên hành động}`
2. 1-3 sentences describing what to do, using ①②③ annotations
3. Screenshot: `![Bước N](assets/{module}-{nn}-{action}.png)`
4. Optional: callout box for warnings/tips using blockquote

### Section 4: Mô tả các trường (Field Reference)

Markdown table for each form in the module:

| Trường       | Bắt buộc | Mô tả                           |
| ------------ | -------- | ------------------------------- |
| Tên sản phẩm | ✅       | Tên hiển thị trên đơn hàng      |
| Mã SKU       | ❌       | Mã nội bộ, tự sinh nếu để trống |

- Only include fields the user can interact with
- Note validations/constraints (max length, format, etc.)

### Section 5: Câu hỏi thường gặp (FAQ)

3-5 Q&A pairs covering:

- Common mistakes / confusion points
- "What happens if I...?" scenarios
- Relationship with other modules (if any)

## Screenshot Capture Rules

### Auto-capture (via Chrome DevTools MCP / browser_subagent)

1. Navigate to the module's main page
2. Capture list/dashboard view → `{module}-01-list.png`
3. Open create/add form → `{module}-02-create.png`
4. Fill sample data → `{module}-03-filled.png`
5. Show success state → `{module}-04-success.png`
6. Capture detail/edit view → `{module}-05-detail.png`

Adjust based on actual flow (wizard, dashboard, etc.).

### Fallback

- Auth wall → ask user for screenshots
- Complex state → ask user to navigate there, then capture
- Dev server off → use placeholder: `<!-- screenshot: [description] -->`

### Image Naming Convention

```
{module-slug}-{nn}-{action}.png
```

- `nn`: zero-padded step number (01, 02, ...)
- `action`: kebab-case verb (list, create, edit, delete, detail, filter, export)

## File Naming

- Module docs: `{module-slug}.md` (kebab-case, lowercase)
- Index: `index.md`
- Assets dir: `assets/`
- All under configured `docs_output_dir` (default: `.haki/generated/docs/user-guides`)

## Quality Checklist

Before finalizing a module doc, verify:

- [ ] All 5 sections present
- [ ] Mermaid diagram renders correctly
- [ ] Every step has a screenshot reference (or placeholder)
- [ ] Field reference table covers all form fields
- [ ] FAQ has ≥ 3 entries
- [ ] Language matches `docs_language` config
- [ ] Index.md updated with new module entry
