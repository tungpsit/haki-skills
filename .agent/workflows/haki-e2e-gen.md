---
description: Generate E2E test specs from natural-language descriptions using playwright-intent-to-spec
---

# /haki:e2e-gen

Generate Playwright TypeScript spec files from Vietnamese natural-language test descriptions.

## Usage

```
/haki:e2e-gen <test intent in Vietnamese>
```

Example:

```
/haki:e2e-gen Đăng nhập bằng admin, vào trang Inventory, thêm sản phẩm mới, kiểm tra sản phẩm hiển thị trong danh sách
```

---

## Steps

1. **Read skill rules:**

   Read `.agent/skills/playwright-intent-to-spec/SKILL.md` — follow ALL hard rules and the clarification protocol.

2. **Accept user intent:**

   The user provides a test description in Vietnamese (or English). If no intent is provided inline with the command, ask the user to describe the test flow.

3. **Parse intent → identify ambiguities:**

   Break the intent into: actor, feature/page, actions, inputs, expected outcome.
   Identify **critical ambiguities** (unknown entry route, unknown user role, unknown success signal, unknown feature area).

4. **Clarify critical ambiguities with user:**

   If any critical ambiguities are found, **ASK the user** before generating. Keep questions concise and numbered. Example:

   ```
   Tôi cần làm rõ trước khi tạo spec:
   1. "admin" đăng nhập qua route nào? (/login, /admin/login, ...)
   2. Sau khi thêm sản phẩm, success signal là gì? (toast, redirect, row mới trong table, ...)
   ```

   Wait for user response before proceeding.

5. **Generate spec file:**

   Apply `playwright-intent-to-spec` rules:
   - Output exactly one `tests/*.spec.ts` file
   - Use POM boundaries — import page objects, don't invent implementations
   - Insert `TODO` comments for **minor** ambiguities (locator names, exact method names)
   - Use Arrange/Act/Assert structure

6. **Present result:**

   Show the generated spec file. Ask user if any adjustments are needed before saving.
