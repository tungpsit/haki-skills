---
name: playwright-intent-to-spec
description: generate playwright typescript spec files from vietnamese natural-language ui test instructions for projects using a page object model. use when a user describes a browser flow, action, or expected behavior in plain language and wants only a tests/*.spec.ts output. preserve pom boundaries, avoid inventing missing details, keep locators and implementation details out of the spec unless explicitly provided, and insert clear todo comments wherever routes, accounts, page object names, method names, or assertions are ambiguous.
---

# Playwright Intent To Spec

## Overview

Convert short Vietnamese product-test prompts into a single Playwright + TypeScript spec file under `tests/`. Keep the spec aligned with an existing page-object-model codebase: the spec may instantiate and call page objects, but must not invent new page object implementations or leak locator logic into the test unless the user explicitly provided that detail.

Follow this workflow:

0. **Site discovery** — get the app's base URL, launch a browser, detect whether auth is required, and capture page structure.
1. Parse the user instruction into actor, feature/page, actions, inputs, and expected outcome.
2. Identify every missing detail that would require guessing.
3. **Clarify critical ambiguities with the user** before generating (see Clarification Protocol below).
4. Generate exactly one `tests/*.spec.ts` file.
5. Insert `TODO` comments for **minor** ambiguities instead of fabricating data.
6. Verify the finished spec against the hard rules below before replying.

---

## Phase 0: Site Discovery

> **MANDATORY before any spec generation.** The AI must see the actual website before writing test code.

### Step 0.1 — Get the base URL

Ask the user for the application's base URL if not already known:

```
Base URL của app là gì? (ví dụ: http://localhost:3000)
```

If the project has a `playwright.config.ts` with `baseURL` already configured, use that value and confirm with the user.

### Step 0.2 — Launch browser & navigate

Open the browser and navigate to the target page (entry route from the user's intent, or the base URL if no route was specified).

Use `browser_subagent` or Chrome DevTools MCP to:

- Navigate to the URL
- Take a snapshot of the page

### Step 0.3 — Detect auth requirement

After navigation, check if auth is required:

| Signal                                                | Means             |
| ----------------------------------------------------- | ----------------- |
| Page redirected to `/login`, `/signin`, `/auth`, etc. | Auth required     |
| Page shows login form (email/password fields)         | Auth required     |
| Page shows the expected content (no redirect)         | Auth NOT required |

**If auth is NOT required** → skip to Step 0.5.

**If auth IS required** → proceed to Step 0.4.

### Step 0.4 — Interactive auth & session save

Ask the user:

```
Trang này yêu cầu đăng nhập. Bạn có muốn tôi mở browser để bạn đăng nhập thủ công không?
Sau khi đăng nhập xong, tôi sẽ lưu session để dùng cho test.
```

If user agrees:

1. **Open browser** to the login page (use `browser_subagent` in headed mode or direct the user to the Chrome debug instance).
2. **Wait for user to complete login** — the user manually enters credentials and navigates past the login.
3. **User confirms** they are logged in (e.g., "xong rồi" / "done").
4. **Save storage state** to `e2e/.auth/user.json`:
   ```ts
   await page.context().storageState({ path: "e2e/.auth/user.json" });
   ```
5. **Confirm** to the user: _"Đã lưu session. Các lần navigate tiếp theo sẽ dùng session này."_
6. Ensure `e2e/.auth/` is in `.gitignore`.

If user declines or defers:

- Mark auth as a `TODO` in the generated spec.
- Continue without session.

### Step 0.5 — Capture page structure

Once on the target page (authenticated if needed):

1. **Take a DOM snapshot** — use `take_snapshot` or equivalent to capture the accessibility tree.
2. **Identify key elements**: navigation items, forms, buttons, tables, modals.
3. **Use this knowledge** to inform spec generation — match user intent to actual UI elements observed.

> The snapshot replaces guesswork. When the AI can see the page, it should use real element roles/labels instead of inserting TODOs for locators.

---

## Auth session management

### Storage location

Auth state is saved to: `e2e/.auth/user.json`

### Using saved auth in generated specs

Specs that require auth should reference the storage state via a Playwright project dependency or fixture:

**Option A: Project-level auth (preferred)**

```ts
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
});
```

**Option B: Fixture-based auth**

```ts
// In the spec file
import { test } from "../fixtures/base.fixture";

test("should see dashboard", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/dashboard");
  // ...
});
```

### .gitignore

Ensure `e2e/.auth/` is listed:

```
e2e/.auth/
```

---

## Output contract

- Return only one TypeScript spec file.
- Target path must live under `tests/`.
- Prefer a single fenced code block containing the file content.
- Write code, comments, and TODOs in English, even when the user prompt is in Vietnamese.
- If the user explicitly requests only raw code, omit any prose outside the code block.

## Hard rules

### 1) Scope

- Generate only a `*.spec.ts` file.
- Do not generate or modify page objects, fixtures, utilities, config, or test data files.
- Assume the project already uses POM and import existing page objects when their names are known.
- If the correct page object import path or class name is unknown, keep a placeholder import and add a `TODO`.

### 2) POM boundaries

- The spec may instantiate page objects and call page-object methods.
- Keep detailed locators and interaction logic out of the spec unless the user explicitly gave them.
- Keep assertions in the spec layer, not inside page objects.
- Do not reimplement a page-object method inline in the spec.

### 3) Inference discipline

Never invent any of the following:

- selectors or locator strategies
- URLs or routes
- account credentials or who `user A` is
- page object names, method names, or import paths when unknown
- success signals that were never stated or implied
- hidden waits, retries, or workarounds

When any of those are missing **and** the browser snapshot didn't reveal them, add a short actionable comment like:

```ts
// TODO: confirm the correct page object import for the Orders flow
```

> **Exception:** If Phase 0 captured the page structure and the AI can see the real element (e.g., a button labeled "Export"), it MAY use that observed label directly instead of a TODO.

### 4) Test structure

Use this shape by default:

```ts
import { test, expect } from "@playwright/test";
// page object imports

test.describe("<feature area>", () => {
  test("<behavior and expected result>", async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

For auth-required specs, use the `storageState` variant:

```ts
import { test, expect } from "@playwright/test";

// Auth: uses storageState from e2e/.auth/user.json (configured in playwright.config.ts)
test.describe("<feature area>", () => {
  test("<behavior and expected result>", async ({ page }) => {
    // Arrange — no manual login needed, session is pre-loaded
    // Act
    // Assert
  });
});
```

Additional structure rules:

- Generate one main test per user prompt unless the user explicitly asks for multiple cases.
- Use a concise `test.describe(...)` label for the feature area.
- Use a behavior-focused `test(...)` title that mentions the expected outcome when known.
- Prefer deterministic, readable steps.

### 5) Assertions

- If the expected result is clear, include at least one meaningful assertion.
- If the expected result is unclear, add a `TODO` in the Assert section instead of inventing a pass condition.
- Prefer business-facing assertions over implementation-heavy assertions.
- If a placeholder locator is unavoidable to illustrate the assertion site, mark it clearly with `TODO`.

### 6) Safety and quality

- Do not use `page.waitForTimeout()` unless the user explicitly asks for a time-based wait.
- Do not use `force: true` unless the user explicitly asks for a workaround.
- Do not use XPath unless the user explicitly asks for it.
- Do not hardcode secrets or credentials.
- Keep the spec minimal and compilable when possible, but never sacrifice correctness just to remove a TODO.

## Clarification protocol

After parsing the user intent (step 2), classify each ambiguity as **critical** or **minor**.

> **Note:** If Phase 0 already resolved an ambiguity (e.g., entry route was observed, auth was handled), do NOT ask the user about it again.

### Critical ambiguities → ASK the user

These block generation of a meaningful spec. **Stop and ask** before generating:

| Ambiguity                 | Example question                                                             |
| ------------------------- | ---------------------------------------------------------------------------- |
| Entry route unknown       | "Flow bắt đầu từ route nào? (`/login`, `/admin`, ...)"                       |
| User role/account unknown | "'user A' là account nào? Role gì?"                                          |
| Success signal unknown    | "Sau khi thực hiện, kết quả mong đợi là gì? (toast, redirect, row mới, ...)" |
| Feature area unclear      | "Mô tả này thuộc feature/page nào?"                                          |

Rules:

- Ask all critical questions in a **single numbered list** (don't ask one at a time).
- Ask in the **same language** as the user's prompt.
- Wait for the user's answers before generating the spec.
- If the user says "không biết" or defers, fall back to a `TODO` for that item.
- **Skip any question that Phase 0 already answered** (e.g., if the browser already navigated to the correct route, don't ask about the entry route).

### Minor ambiguities → insert TODO

These are implementation details that don't block a useful spec draft:

- which page object class to import
- exact page-object method names
- exact locator strategies (unless observed in Phase 0 snapshot)
- selector or assertion targets not provided

For these, insert a `TODO` comment in the generated spec and proceed.

## Ambiguity checklist

Before finalizing, verify all items below. Critical items must have been clarified or resolved by Phase 0. Minor items get TODOs:

- **[critical]** entry route or precondition — _may be resolved by Phase 0 navigation_
- **[minor]** which page object to import
- **[minor]** exact page-object method names
- **[critical]** which account or role should be used — _may be resolved by Phase 0 auth session_
- **[critical]** exact expected success state after the final action
- **[minor]** where the UI should display the result
- **[minor]** any selector or assertion target not provided by the user

## Default translation from user intent to spec

Interpret short Vietnamese prompts in this order:

1. **Context**: what feature or page is the flow about?
2. **Actor**: is there a user role like `user A`?
3. **Action**: what inputs are entered, clicked, or selected?
4. **Expected result**: what should become visible, enabled, created, or updated?
5. **Unknowns**: what would require guessing? → check Phase 0 snapshot first.

If the prompt contains actions but no expected result, still generate the spec and leave an assertion TODO.

## Reference patterns

Use the examples and starter templates in [references/examples.md](references/examples.md) to mirror the preferred tone, TODO style, and test skeleton.
