---
name: api-testing
description: Use when setting up, writing, or running API integration tests. Vitest + fetch, manual assertions, seed data from JSON. TypeScript only.
---

# API Integration Testing

## Overview

Standardized API testing with Vitest and native `fetch`. TypeScript only. TDD mandatory.

**Core principle:** Every API endpoint gets tested for happy path AND error cases. Status code alone is not enough — assert the response body.

## When to Use

- Test REST API endpoints (CRUD operations)
- Verify response status, body, headers
- Test authentication flows (JWT, API key, session)
- Test error handling (400, 401, 403, 404, 500)
- Test pagination, filtering, sorting
- Contract testing (response shape validation)

**Not for:** E2E browser tests (use `playwright-automation`), security pentesting, load/stress testing.

## Stack

| Tool                | Purpose                                     |
| ------------------- | ------------------------------------------- |
| **Vitest**          | Test runner, assertions, lifecycle hooks    |
| **fetch**           | Native HTTP client (Node 18+, Bun built-in) |
| **JSON seed files** | Test data                                   |

Zero extra HTTP client deps — no axios, supertest, or got.

## Project Structure

```
api-tests/
├── tests/
│   ├── auth.api.test.ts
│   ├── users.api.test.ts
│   └── products.api.test.ts
├── helpers/
│   ├── api-client.ts       # Base fetch wrapper
│   └── auth.ts             # Token helpers
├── seed/
│   ├── users.json          # Test user data
│   └── products.json       # Test product data
└── vitest.api.config.ts    # API-only vitest config
```

**Naming rules:**

- Tests: `[resource].api.test.ts`
- Helpers: descriptive name in `helpers/`
- Seed data: `[resource].json` in `seed/`

## Config

Use the template at `templates/vitest.api.config.ts`. Key settings:

- **globals:** true (no need to import `describe`, `test`, `expect`)
- **environment:** `node` (no DOM)
- **testTimeout:** 10_000ms
- **include:** `api-tests/**/*.api.test.ts`
- **setupFiles:** optional global setup (seed database, get auth token)

## API Client Helper

Use the template `templates/api-client.ts`. Provides:

```typescript
const api = createApiClient("http://localhost:3000/api");

// GET
const res = await api.get("/users");

// POST with body
const res = await api.post("/users", { name: "John", email: "john@test.com" });

// With auth token
const res = await api.get("/me", { token: "jwt-token-here" });

// PUT, PATCH, DELETE
const res = await api.put("/users/1", { name: "Updated" });
const res = await api.patch("/users/1", { name: "Patched" });
const res = await api.delete("/users/1");
```

Returns `{ status, body, headers }` — always parsed, never throws on 4xx/5xx.

## Writing Tests — Rules

### 1. Assert Order

Always assert in this order:

1. **Status code** — is it 200, 201, 400, 404?
2. **Response body** — does it contain expected data?
3. **Headers** (optional) — Content-Type, pagination headers

<Good>
```typescript
test('GET /users returns user list', async () => {
  const { status, body } = await api.get('/users');

expect(status).toBe(200);
expect(body).toBeInstanceOf(Array);
expect(body.length).toBeGreaterThan(0);
expect(body[0]).toHaveProperty('id');
expect(body[0]).toHaveProperty('email');
});

````
Status → body shape → body content
</Good>

<Bad>
```typescript
test('GET /users works', async () => {
  const res = await fetch(`${BASE_URL}/users`);
  expect(res.ok).toBe(true); // Only checks status, ignores body
});
````

Vague name, no body assertion
</Bad>

### 2. Test Independence

Each test creates its own data and cleans up. No test depends on another.

```typescript
describe("Users API", () => {
  let createdUserId: string;

  test("POST /users creates user", async () => {
    const { status, body } = await api.post("/users", {
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
    });

    expect(status).toBe(201);
    expect(body).toHaveProperty("id");
    createdUserId = body.id;
  });

  afterAll(async () => {
    // Clean up
    if (createdUserId) {
      await api.delete(`/users/${createdUserId}`);
    }
  });
});
```

### 3. Test Both Happy Path and Errors

Every endpoint needs at minimum:

- ✅ Success case (200/201)
- ✅ Validation error (400)
- ✅ Not found (404)
- ✅ Unauthorized (401) if protected

```typescript
describe("POST /users", () => {
  test("creates user with valid data", async () => {
    const { status, body } = await api.post("/users", validUserData);
    expect(status).toBe(201);
    expect(body).toHaveProperty("id");
  });

  test("rejects missing required fields", async () => {
    const { status, body } = await api.post("/users", {});
    expect(status).toBe(400);
    expect(body).toHaveProperty("errors");
  });

  test("rejects duplicate email", async () => {
    const { status } = await api.post("/users", existingUserData);
    expect(status).toBe(409);
  });
});
```

### 4. Seed Data from JSON

Load test data from `seed/` files:

```typescript
import usersData from "../seed/users.json";

const testUser = usersData.validUser;
const invalidUser = usersData.invalidUser;
```

Seed file format:

```json
{
  "validUser": {
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123!"
  },
  "invalidUser": {
    "name": "",
    "email": "not-an-email"
  },
  "adminUser": {
    "name": "Admin",
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": "admin"
  }
}
```

### 5. Authentication Pattern

```typescript
describe("Protected endpoints", () => {
  let token: string;

  beforeAll(async () => {
    const { body } = await api.post("/auth/login", {
      email: "test@example.com",
      password: "password123",
    });
    token = body.token;
  });

  test("GET /me returns current user", async () => {
    const { status, body } = await api.get("/me", { token });

    expect(status).toBe(200);
    expect(body).toHaveProperty("email");
  });

  test("GET /me rejects without token", async () => {
    const { status } = await api.get("/me");
    expect(status).toBe(401);
  });

  test("GET /me rejects invalid token", async () => {
    const { status } = await api.get("/me", { token: "invalid" });
    expect(status).toBe(401);
  });
});
```

## Pattern Library

### CRUD Operations

```typescript
describe("Products CRUD", () => {
  const product = { name: "Widget", price: 9.99, category: "tools" };
  let productId: string;

  test("POST creates product", async () => {
    const { status, body } = await api.post("/products", product, { token });
    expect(status).toBe(201);
    expect(body.name).toBe(product.name);
    productId = body.id;
  });

  test("GET retrieves product", async () => {
    const { status, body } = await api.get(`/products/${productId}`);
    expect(status).toBe(200);
    expect(body.name).toBe(product.name);
  });

  test("PUT updates product", async () => {
    const { status, body } = await api.put(
      `/products/${productId}`,
      {
        ...product,
        price: 19.99,
      },
      { token },
    );
    expect(status).toBe(200);
    expect(body.price).toBe(19.99);
  });

  test("DELETE removes product", async () => {
    const { status } = await api.delete(`/products/${productId}`, { token });
    expect(status).toBe(204);
  });

  test("GET deleted product returns 404", async () => {
    const { status } = await api.get(`/products/${productId}`);
    expect(status).toBe(404);
  });
});
```

### Pagination

```typescript
test("GET /products supports pagination", async () => {
  const { status, body, headers } = await api.get("/products?page=1&limit=10");

  expect(status).toBe(200);
  expect(body.data).toBeInstanceOf(Array);
  expect(body.data.length).toBeLessThanOrEqual(10);
  expect(body).toHaveProperty("total");
  expect(body).toHaveProperty("page", 1);
  expect(body).toHaveProperty("limit", 10);
});
```

### File Upload

```typescript
test("POST /upload handles file", async () => {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob(["test content"], { type: "text/plain" }),
    "test.txt",
  );

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  expect(res.status).toBe(201);
  const body = await res.json();
  expect(body).toHaveProperty("url");
});
```

## Running Tests

```bash
# All API tests
npx vitest run --config api-tests/vitest.api.config.ts

# Watch mode
npx vitest --config api-tests/vitest.api.config.ts

# Specific file
npx vitest run api-tests/tests/users.api.test.ts --config api-tests/vitest.api.config.ts

# With coverage
npx vitest run --config api-tests/vitest.api.config.ts --coverage
```

## CI/CD — GitHub Actions

```yaml
name: API Tests
on: [push, pull_request]

jobs:
  api-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run db:migrate
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
      - run: bun run dev &
      - run: sleep 5
      - run: npx vitest run --config api-tests/vitest.api.config.ts
        env:
          API_BASE_URL: http://localhost:3000/api
```

## Anti-Patterns

| ❌ Don't                      | ✅ Do                            |
| ----------------------------- | -------------------------------- |
| Hard-code tokens / URLs       | Use env vars, `beforeAll` login  |
| Assert only `res.ok`          | Assert status + body + shape     |
| Tests depend on order         | Each test self-contained         |
| Test only happy path          | Test errors: 400, 401, 404       |
| Use production data           | Use JSON seed files              |
| `await res.json()` everywhere | Use `api-client.ts` helper       |
| Huge test files (500+ lines)  | Split by resource, max 200 lines |
| Ignore cleanup                | `afterAll` / `afterEach` cleanup |

## TDD Integration

When generating tests for a new API endpoint:

1. **RED** — Write test describing expected request/response → `npx vitest run` → FAIL
2. **GREEN** — Implement endpoint → `npx vitest run` → PASS
3. **REFACTOR** — Clean up handler and test → tests still PASS

Test generation MUST follow TDD. Write the failing test first.

## When Stuck

| Problem               | Solution                                    |
| --------------------- | ------------------------------------------- |
| `fetch` not available | Use Node 18+ or Bun (built-in)              |
| Connection refused    | Dev server not running, check `BASE_URL`    |
| Auth token expired    | Refresh in `beforeAll`, not per-test        |
| Flaky timing          | Check server startup, add retry logic in CI |
| Test data conflicts   | Use unique identifiers (`Date.now()`, UUID) |
