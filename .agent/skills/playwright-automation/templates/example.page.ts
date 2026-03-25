import { type Locator, type Page } from "@playwright/test";

/**
 * Page Object Model template.
 *
 * Rules:
 * - Locators defined in constructor (single source of truth)
 * - Actions as async methods (login, submitForm, etc.)
 * - No assertions inside page objects — assertions belong in tests
 * - Use getByRole/getByLabel/getByText over CSS selectors
 */
export class ExamplePage {
  // ─── Locators ────────────────────────────────────────────────

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resultsList: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Example Page" });
    this.searchInput = page.getByPlaceholder("Search...");
    this.searchButton = page.getByRole("button", { name: "Search" });
    this.resultsList = page.getByRole("list", { name: "Results" });
  }

  // ─── Navigation ──────────────────────────────────────────────

  async goto() {
    await this.page.goto("/example");
  }

  // ─── Actions ─────────────────────────────────────────────────

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  // ─── Getters (for assertions in tests) ───────────────────────

  getResultItems() {
    return this.resultsList.getByRole("listitem");
  }
}
