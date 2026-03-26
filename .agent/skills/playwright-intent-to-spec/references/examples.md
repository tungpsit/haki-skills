# Examples

## Example 1: Simple business flow

### Input

Đăng nhập bằng user A, vào Orders, lọc Paid, kiểm tra nút Export khả dụng

### Output pattern

```ts
import { test, expect } from "@playwright/test";
// TODO: replace with the correct page object import for the Orders flow
import { OrdersPage } from "../pages/OrdersPage";

test.describe("Orders", () => {
  test("should allow exporting after filtering paid orders", async ({
    page,
  }) => {
    // Arrange
    const ordersPage = new OrdersPage(page);

    // TODO: clarify who "user A" is and how login is handled in this project
    // TODO: confirm the correct entry route or precondition for the Orders page
    await ordersPage.goto();

    // Act
    await ordersPage.filterByPaymentStatus("Paid");

    // Assert
    // TODO: confirm the exact method name if it differs in the existing page object
    await expect(ordersPage.exportButton).toBeEnabled();
  });
});
```

Notes:

- The spec uses POM calls only.
- Missing account details stay as TODOs.
- The assertion is allowed because the expected result is explicit: the Export button should be available.

## Example 2: Generative UI flow with ambiguous success state

### Input

Nhập vào prompt 'Một con mèo đang sưởi nắng ở ngoài sân' và nhấn nút tạo video

### Output pattern

```ts
import { test, expect } from "@playwright/test";
// TODO: replace with the correct page object import for the Google Labs video flow
import { VideoCreationPage } from "../pages/VideoCreationPage";

test.describe("Google Labs video creation", () => {
  test("should start or complete video generation from a text prompt", async ({
    page,
  }) => {
    // Arrange
    const videoCreationPage = new VideoCreationPage(page);
    const prompt = "Một con mèo đang sưởi nắng ở ngoài sân";

    // TODO: confirm the correct entry route or navigation flow before opening the page
    await videoCreationPage.goto();

    // Act
    await videoCreationPage.fillPrompt(prompt);
    await videoCreationPage.clickGenerateVideo();

    // Assert
    // TODO: confirm the actual success signal after clicking generate.
    // Possible examples:
    // - a "generation started" toast appears
    // - a loading status becomes visible
    // - a generated video card appears
    // - a success message is shown
    // TODO: replace the placeholder assertion with the real business-facing assertion
    // await expect(videoCreationPage.generatedVideoCard).toBeVisible();
  });
});
```

Notes:

- The prompt clearly states an action but not the exact pass condition.
- The spec keeps the ambiguity visible instead of guessing.

## Example 3: Auth-required flow with saved session

### Input

Đăng nhập admin, vào trang Inventory, thêm sản phẩm mới, kiểm tra sản phẩm hiển thị trong danh sách

### Phase 0 context

- Base URL: `http://localhost:3000`
- Browser navigated to `/inventory` → redirected to `/login` → **auth required detected**
- User logged in manually via browser → session saved to `e2e/.auth/user.json`
- After auth, snapshot of `/inventory` revealed: a table with product rows, an "Add Product" button (`getByRole('button', { name: 'Add Product' })`)

### Output pattern

```ts
import { test, expect } from "@playwright/test";
// TODO: replace with the correct page object import for the Inventory flow
import { InventoryPage } from "../pages/InventoryPage";

// Auth: storageState loaded via playwright.config.ts → no manual login needed
test.describe("Inventory — add product", () => {
  test("should display new product in the list after adding", async ({
    page,
  }) => {
    // Arrange
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();

    // Act
    await inventoryPage.clickAddProduct();
    // TODO: confirm which fields are required and the exact method for filling the form
    await inventoryPage.fillProductForm({
      name: "Test Product",
      // TODO: add other required fields observed in the form
    });
    await inventoryPage.submitForm();

    // Assert
    // Product should appear in the table
    await expect(
      page.getByRole("cell", { name: "Test Product" }),
    ).toBeVisible();
  });
});
```

Notes:

- Auth was handled in Phase 0 — no login code in the spec.
- The spec references `storageState` configured at project level (comment at top of describe block).
- The "Add Product" button was observed in the DOM snapshot, so no TODO for that locator.
- Form fields are still marked as TODOs because Phase 0 snapshot was on the list page, not the form.
- The assertion uses `getByRole('cell', ...)` because the snapshot showed a table structure.

## File naming guideline

When choosing a filename for the generated spec, slug the feature and behavior into a simple path under `tests/`, for example:

- `tests/orders-export-paid.spec.ts`
- `tests/google-labs-video-generation.spec.ts`
- `tests/inventory-add-product.spec.ts`

If the filename is still ambiguous, prefer a generic but descriptive name and keep the code itself focused.
