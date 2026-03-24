---
description: Generate user guides with screenshots for project modules
---

# /haki:docs [module-name] [--all]

Create end-user documentation for a module with screenshots, flow diagrams, and step-by-step guides.

## Steps

1. **Read skill instructions:**
   - Read: `.agent/skills/user-docs-generator/SKILL.md`
   - Read config: `docs_language` and `docs_output_dir` from `.haki/config.json`
   - Default language: `vi`, default dir: `.haki/docs/user-guides`

2. **Resolve module(s):**

   **If `--all`:**
   - Scan codebase for modules: check route structure (`app/`, `pages/`, `src/app/`), sidebar/nav menus, or `ROADMAP.md` feature list
   - Present detected module list to user for confirmation
   - Loop steps 3-6 for each confirmed module (use parallel subagents when possible)
   - For `--all` mode: skip Q&A, use sensible defaults (target=all users, flow=CRUD, auth=login required)

   **If `[module-name]` provided:** use it directly

   **If no args:** ask user to pick or describe the module

3. **Quick Q&A** (one question at a time, multiple choice):
   - "Module này dành cho ai?" → admin / end user / cả hai
   - "Flow chính?" → CRUD (list→create→edit→delete) / wizard multi-step / dashboard / custom (mô tả)
   - "Auth/role?" → public / login required / role-specific (chỉ rõ role)
   - "Lưu ý thêm?" → open-ended, optional — user có thể skip

4. **Browse & Screenshot** (hybrid):

   a. Check dev server:

   ```
   Try fetch localhost:3000 (hoặc port từ config/package.json)
   ```

   b. Nếu dev server chạy:
   - Dùng Chrome DevTools MCP (hoặc browser_subagent) để navigate đến route của module
   - Chụp screenshot từng bước trong flow chính
   - Lưu vào `{docs_output_dir}/assets/{module-slug}-{nn}-{action}.png`
   - VD: `inventory-01-list.png`, `inventory-02-create-form.png`

   c. Nếu không browse được (auth wall, complex state, multi-step setup):
   - Hỏi user: "Tôi không truy cập được trang [X]. Bạn có thể cung cấp screenshot không? Đặt file vào `{docs_output_dir}/assets/` và cho tôi biết tên file."

   d. Nếu dev server không chạy:
   - Viết docs với placeholder: `<!-- screenshot: [mô tả bước này] -->`
   - Thông báo user có thể chạy lại `/haki:docs [module]` khi dev server ready để bổ sung ảnh

5. **Generate documentation:**
   - Read template: `.agent/templates/user-docs-module.md`
   - Fill 5 sections:
     1. **Tổng quan** — từ Q&A answers + code analysis
     2. **Luồng thao tác** — Mermaid flowchart từ user flow chính
     3. **Hướng dẫn từng bước** — mỗi bước có mô tả + screenshot reference
     4. **Mô tả các trường** — bảng fields từ form analysis hoặc code
     5. **Câu hỏi thường gặp** — từ common patterns + edge cases
   - Viết bằng ngôn ngữ từ `docs_language` config
   - Lưu vào `{docs_output_dir}/{module-slug}.md`

6. **Update index:**
   - Read hoặc tạo `{docs_output_dir}/index.md` từ template `.agent/templates/user-docs-index.md`
   - Thêm/cập nhật entry cho module vừa tạo
   - Sort entries theo alphabet

7. **Show summary:**

   ```
   ✅ User Guide Created: {Module Name}
      📄 {docs_output_dir}/{module-slug}.md
      🖼️ {N} screenshots captured
      📋 Index updated

   ▶ Next: /haki:docs [next-module] or review the generated doc
   ```
