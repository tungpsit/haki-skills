---
description: Create, run, and manage E2E tests with Playwright
---

# /haki:e2e [action]

Playwright E2E testing workflow. TypeScript only, TDD mandatory.

## Actions

| Action               | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `init`               | Set up Playwright in the current project          |
| `generate [feature]` | Generate E2E tests for a feature (TDD: RED first) |
| `run`                | Execute test suite                                |
| `report`             | Open HTML test report                             |

---

## Steps

### Action: `init`

1. **Read skill rules:**

   Read `.agent/skills/playwright-automation/SKILL.md` for conventions.

2. **Research latest Playwright version:**

   Read `.agent/skills/context7-research/SKILL.md` and use Context7 MCP:

   ```
   resolve-library-id: "@playwright/test"
   query-docs: "playwright test configuration setup typescript"
   ```

3. **Install dependencies:**
   // turbo

   ```bash
   bun add -d @playwright/test
   ```

4. **Install browser:**
   // turbo

   ```bash
   npx playwright install chromium
   ```

5. **Create directory structure:**
   // turbo

   ```bash
   mkdir -p e2e/fixtures e2e/pages e2e/tests e2e/helpers
   ```

6. **Copy templates from skill:**
   - Copy `playwright.config.ts` → project root
   - Copy `base.fixture.ts` → `e2e/fixtures/`
   - Adjust `baseURL` and `webServer` in config to match project

7. **Create smoke test** → `e2e/tests/smoke.spec.ts`:

   ```typescript
   import { test, expect } from "@playwright/test";

   test("app loads successfully", async ({ page }) => {
     await page.goto("/");
     await expect(page).toHaveTitle(/.+/);
   });
   ```

8. **Run smoke test to verify:**
   // turbo

   ```bash
   npx playwright test e2e/tests/smoke.spec.ts
   ```

9. **Add to .gitignore:**

   ```
   # Playwright
   /test-results/
   /playwright-report/
   /blob-report/
   /playwright/.cache/
   e2e/.auth/
   ```

---

### Action: `generate [feature]`

**TDD MANDATORY: Tests MUST fail first (RED phase).**

0. **Auto-detect existing specs:**
   - Scan `e2e/tests/` and `tests/` for existing `*.spec.ts` files matching `[feature]`
   - If **specs already exist** → skip to step 2 (Page Objects)
   - If **no specs found** → proceed to step 0a

   **0a. Generate spec from intent (via `playwright-intent-to-spec`):**
   - Read `.agent/skills/playwright-intent-to-spec/SKILL.md`
   - Ask user for a natural-language test description (Vietnamese or English)
   - Parse intent → identify critical ambiguities → **ask user to clarify** before generating
   - Generate draft `tests/[feature].spec.ts` following the skill's hard rules
   - Show generated spec for user review before continuing

1. **Analyze the feature:**
   - Check `.haki/specs/` or `.haki/tasks/` for feature description
   - If no spec exists (and step 0a was skipped), ask user to describe the user flow
   - Identify: pages visited, actions performed, expected outcomes

2. **Create Page Object(s)** if not already existing:
   - Follow POM pattern from skill templates
   - Use `getByRole` / `getByLabel` / `getByText` locators
   - Put in `e2e/pages/[page-name].page.ts`

3. **Write test file** → `e2e/tests/[feature].spec.ts`:
   - Import Page Objects
   - One `test.describe` per feature
   - Each test: one user behavior
   - Use `beforeEach` for shared navigation

4. **Run test → verify FAIL (RED):**
   // turbo

   ```bash
   npx playwright test e2e/tests/[feature].spec.ts
   ```

   - Test MUST fail because feature doesn't exist yet (or is incomplete)
   - If test passes → test is not testing the right thing. Rewrite.

5. **Report RED status:**
   - Show which tests failed and why
   - Confirm the failures are expected (feature missing, not test error)
   - Feature is now ready for implementation

6. **After feature is implemented → verify PASS (GREEN):**
   // turbo

   ```bash
   npx playwright test e2e/tests/[feature].spec.ts
   ```

---

### Action: `run`

1. **Detect project dev server:**
   - Check if dev server is running (port 3000, 3001, 5173, etc.)
   - If not running and `webServer` is configured in `playwright.config.ts` → Playwright will auto-start it

2. **Run all tests:**
   // turbo

   ```bash
   npx playwright test
   ```

3. **Parse and report results:**
   - Total passed / failed / skipped
   - List failed tests with error summary
   - If failures exist → suggest debugging:
     ```bash
     npx playwright test --ui           # Interactive UI mode
     npx playwright test --debug        # Step-through debugger
     npx playwright show-report         # View HTML report
     ```

---

### Action: `report`

1. **Open HTML report:**

   ```bash
   npx playwright show-report
   ```
