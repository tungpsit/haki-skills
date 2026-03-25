import { test as base, type Page } from "@playwright/test";

/**
 * Extended test fixture.
 *
 * Add custom fixtures here (authenticated page, page objects, test data).
 * Import this instead of '@playwright/test' in your test files.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/base.fixture';
 */

// ─── Types ───────────────────────────────────────────────────────

type Fixtures = {
  /** A page that is already authenticated via stored session */
  authenticatedPage: Page;
};

// ─── Fixtures ────────────────────────────────────────────────────

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
