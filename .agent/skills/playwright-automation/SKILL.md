---
name: playwright-automation
description: Use when setting up, writing, or running E2E tests with Playwright. Covers project init, Page Object Model, test patterns, and CI/CD integration. TypeScript only.
---

# Playwright E2E Automation

## Overview

Standardized E2E testing with Playwright Test runner. TypeScript only. TDD mandatory.

**Core principle:** Every user flow that matters to the business gets an automated test. No manual QA as the last line of defense.

## When to Use

- Init Playwright for a new project
- Write E2E tests for user flows (login, forms, CRUD, navigation)
- Visual regression testing
- CI/CD integration for automated test runs

**Not for:** Unit tests, component tests, API-only tests. This skill is E2E only.

## Setup Protocol

**ALWAYS follow this exact sequence when initializing Playwright:**

```bash
# 1. Install
bun add -d @playwright/test

# 2. Install browser
npx playwright install chromium

# 3. Copy config template (from this skill's templates/)
# 4. Create e2e/ directory structure
# 5. Create smoke test
# 6. Run smoke test to verify setup
npx playwright test
```

## Project Structure

```
e2e/
├── fixtures/              # Custom test fixtures
│   └── base.fixture.ts    # Extended test with auth, page objects
├── pages/                 # Page Object Model
│   ├── login.page.ts
│   └── dashboard.page.ts
├── tests/                 # Test specs
│   ├── auth.spec.ts
│   └── dashboard.spec.ts
└── helpers/               # Shared utilities
    └── test-data.ts
playwright.config.ts       # Root config
```

**Naming rules:**

- Tests: `[feature].spec.ts`
- Pages: `[page-name].page.ts`
- Fixtures: `[name].fixture.ts`

## Config Template

Use the template at `templates/playwright.config.ts`. Key settings:

- **Projects:** Chromium (desktop) + Mobile Chrome
- **Reporter:** HTML (always), list (CI)
- **Retries:** 0 local, 2 on CI
- **Screenshots:** on failure only
- **Video:** on first retry
- **Traces:** on first retry
- **webServer:** auto-start dev server

## Writing Tests — Rules

### 1. Page Object Model Required

For projects with > 3 test files, POM is mandatory.

<Good>
```typescript
// e2e/pages/login.page.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
readonly emailInput: Locator;
readonly passwordInput: Locator;
readonly submitButton: Locator;
readonly errorMessage: Locator;

constructor(private page: Page) {
this.emailInput = page.getByLabel('Email');
this.passwordInput = page.getByLabel('Password');
this.submitButton = page.getByRole('button', { name: 'Sign in' });
this.errorMessage = page.getByRole('alert');
}

async goto() {
await this.page.goto('/login');
}

async login(email: string, password: string) {
await this.emailInput.fill(email);
await this.passwordInput.fill(password);
await this.submitButton.click();
}
}

````
Locators in constructor, actions as methods, no raw selectors in tests
</Good>

<Bad>
```typescript
// Inline selectors scattered across tests
test('login', async ({ page }) => {
  await page.locator('#email-input').fill('test@test.com');
  await page.locator('div.form > button.btn-primary').click();
});
````

CSS selectors, no abstraction, brittle
</Bad>

### 2. Locator Priority

Use in this order (most preferred first):

1. `getByRole('button', { name: 'Submit' })` — accessible, resilient
2. `getByText('Welcome')` — visible text
3. `getByLabel('Email')` — form inputs
4. `getByPlaceholder('Enter email')` — fallback for inputs
5. `getByTestId('submit-btn')` — last resort, requires `data-testid`

**NEVER use** raw CSS selectors (`.class`, `#id`) unless absolutely necessary.

### 3. Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

test.describe("Authentication", () => {
  test("should login with valid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("user@example.com", "password123");

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome")).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("user@example.com", "wrong");

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText("Invalid");
  });
});
```

### 4. Wait Strategy

| ✅ Do                                        | ❌ Don't                          |
| -------------------------------------------- | --------------------------------- |
| `await expect(locator).toBeVisible()`        | `await page.waitForTimeout(3000)` |
| `await page.waitForURL('/dashboard')`        | `await page.waitForTimeout(1000)` |
| `await page.waitForLoadState('networkidle')` | Sleep-based waits                 |
| `await expect(locator).toHaveText('Done')`   | Polling loops                     |

### 5. Test Independence

Each test runs in isolation. No shared state between tests.

```typescript
// ✅ Each test has its own setup
test("edit profile", async ({ page }) => {
  // Login fresh
  await loginAs(page, "user@example.com");
  // Navigate fresh
  await page.goto("/profile");
  // Test
  // ...
});

// ❌ NEVER depend on previous test's state
test("view updated profile", async ({ page }) => {
  // Assumes previous test already logged in — WRONG
});
```

## Pattern Library

### Auth with Storage State

```typescript
// e2e/fixtures/base.fixture.ts — save auth state once
import { test as base } from "@playwright/test";

export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// Setup: run once to create storage state
// e2e/auth.setup.ts
import { test as setup } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
```

### API Mocking

```typescript
test("shows products from API", async ({ page }) => {
  await page.route("**/api/products", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: 1, name: "Product A", price: 100 },
        { id: 2, name: "Product B", price: 200 },
      ]),
    }),
  );

  await page.goto("/products");
  await expect(page.getByText("Product A")).toBeVisible();
  await expect(page.getByText("Product B")).toBeVisible();
});
```

### Visual Regression

```typescript
test("homepage visual", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png", {
    maxDiffPixelRatio: 0.01,
  });
});
```

### Form Validation

```typescript
test("validates required fields", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Email is required")).toBeVisible();
  await expect(page.getByText("Password is required")).toBeVisible();
});

test("validates email format", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Invalid email")).toBeVisible();
});
```

### Mobile Responsive

```typescript
import { devices } from "@playwright/test";

test.use(devices["iPhone 13"]);

test("mobile navigation works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
});
```

### File Upload

```typescript
test("upload avatar", async ({ page }) => {
  await page.goto("/profile");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles("e2e/fixtures/avatar.png");
  await expect(page.getByAltText("Avatar")).toBeVisible();
});
```

## Running Tests

```bash
# All tests
npx playwright test

# Specific file
npx playwright test e2e/tests/auth.spec.ts

# With tag
npx playwright test --grep @smoke

# UI mode (interactive debugging)
npx playwright test --ui

# Debug single test
npx playwright test --debug e2e/tests/auth.spec.ts

# View last report
npx playwright show-report
```

## CI/CD — GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Anti-Patterns

| ❌ Don't                          | ✅ Do                                       |
| --------------------------------- | ------------------------------------------- |
| `page.waitForTimeout(3000)`       | `await expect(locator).toBeVisible()`       |
| `page.locator('.btn-primary')`    | `page.getByRole('button', { name: '...' })` |
| Hard-code `http://localhost:3000` | Use `baseURL` from config                   |
| Tests depend on each other        | Each test fully independent                 |
| Skip `browser.close()`            | Always clean up                             |
| Test implementation details       | Test user-visible behavior                  |
| Giant test files (500+ lines)     | Split by feature, max 200 lines             |
| Inline selectors everywhere       | Page Object Model                           |

## TDD Integration

When generating tests for a new feature:

1. **RED** — Write test describing expected behavior → `npx playwright test` → FAIL
2. **GREEN** — Implement feature → `npx playwright test` → PASS
3. **REFACTOR** — Clean up test and code → tests still PASS

Test generation MUST follow TDD. Write the failing test first.

## When Stuck

| Problem           | Solution                                                 |
| ----------------- | -------------------------------------------------------- |
| Element not found | Check `await page.waitForLoadState('networkidle')` first |
| Flaky test        | Remove timing dependencies, use `expect` auto-retry      |
| Auth issues       | Use storage state pattern                                |
| Slow tests        | Parallelize, mock external APIs                          |
| Visual diff noise | Increase `maxDiffPixelRatio`, mask dynamic elements      |
