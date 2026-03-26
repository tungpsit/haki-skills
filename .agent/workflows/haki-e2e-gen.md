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

   Read `.agent/skills/playwright-intent-to-spec/SKILL.md` — follow ALL hard rules, Phase 0, and the clarification protocol.

2. **Accept user intent:**

   The user provides a test description in Vietnamese (or English). If no intent is provided inline with the command, ask the user to describe the test flow.

3. **Site discovery (Phase 0):**

   Before parsing intent into a spec, run Phase 0 from the skill:

   a. **Get base URL** — ask the user or read from `playwright.config.ts`.

   b. **Launch browser** — navigate to the target page implied by the user's intent.

   c. **Detect auth** — check if the page redirected to a login screen or shows auth UI.

   d. **If auth required** — ask the user:

   ```
   Trang này yêu cầu đăng nhập. Bạn muốn tôi mở browser để bạn đăng nhập thủ công không?
   ```

   - If yes → open browser, wait for user to log in, save `storageState` to `e2e/.auth/user.json`.
   - If no → mark auth as TODO in the spec.

   e. **Snapshot page** — capture DOM structure for informed spec generation.

4. **Parse intent → identify ambiguities:**

   Break the intent into: actor, feature/page, actions, inputs, expected outcome.
   Identify **critical ambiguities** (unknown entry route, unknown user role, unknown success signal, unknown feature area).
   **Skip questions that Phase 0 already resolved** (e.g., route was observed, auth was handled).

5. **Clarify remaining critical ambiguities with user:**

   If any critical ambiguities remain after Phase 0, **ASK the user** before generating. Keep questions concise and numbered. Example:

   ```
   Tôi cần làm rõ trước khi tạo spec:
   1. Sau khi thêm sản phẩm, success signal là gì? (toast, redirect, row mới trong table, ...)
   ```

   Wait for user response before proceeding.

6. **Generate spec file:**

   Apply `playwright-intent-to-spec` rules:
   - Output exactly one `tests/*.spec.ts` file
   - Use POM boundaries — import page objects, don't invent implementations
   - Insert `TODO` comments for **minor** ambiguities (locator names, exact method names)
   - Use Arrange/Act/Assert structure
   - If auth session was saved, reference `storageState` in the spec or note it's configured at project level

7. **Present result:**

   Show the generated spec file. Ask user if any adjustments are needed before saving.
