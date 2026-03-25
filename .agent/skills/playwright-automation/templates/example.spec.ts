import { expect, test } from "@playwright/test";
import { ExamplePage } from "../pages/example.page";

/**
 * E2E test template.
 *
 * Rules:
 * - One describe block per feature
 * - Tests are independent (no shared state)
 * - Use Page Object Model for locators
 * - Assert user-visible behavior, not implementation
 * - Use auto-retrying expect() over manual waits
 */

test.describe("Example Feature", () => {
  let examplePage: ExamplePage;

  test.beforeEach(async ({ page }) => {
    examplePage = new ExamplePage(page);
    await examplePage.goto();
  });

  test("should display page heading", async () => {
    await expect(examplePage.heading).toBeVisible();
  });

  test("should return results for valid search", async () => {
    await examplePage.search("playwright");

    const items = examplePage.getResultItems();
    await expect(items).toHaveCount(3); // Update expected count
    await expect(items.first()).toContainText("Playwright");
  });

  test("should show empty state for no results", async () => {
    await examplePage.search("zzz-no-match");

    await expect(examplePage.getResultItems()).toHaveCount(0);
    await expect(
      examplePage["page"].getByText("No results found"),
    ).toBeVisible();
  });
});
