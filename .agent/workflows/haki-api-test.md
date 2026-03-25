---
description: Create, run, and manage API integration tests with Vitest + fetch
---

# /haki:api-test [action]

API integration testing workflow. Vitest + fetch. TypeScript only. TDD mandatory.

## Actions

| Action                | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `init`                | Set up API test structure in the current project   |
| `generate [resource]` | Generate API tests for a resource (TDD: RED first) |
| `run`                 | Execute API test suite                             |
| `report`              | Show test results with coverage                    |

---

## Steps

### Action: `init`

1. **Read skill rules:**

   Read `.agent/skills/api-testing/SKILL.md` for conventions.

2. **Research latest Vitest version:**

   Read `.agent/skills/context7-research/SKILL.md` and use Context7 MCP:

   ```
   resolve-library-id: "vitest"
   query-docs: "vitest configuration setup typescript api testing"
   ```

3. **Install dependencies:**
   // turbo

   ```bash
   bun add -d vitest
   ```

4. **Create directory structure:**
   // turbo

   ```bash
   mkdir -p api-tests/tests api-tests/helpers api-tests/seed
   ```

5. **Copy templates from skill:**
   - Copy `vitest.api.config.ts` → `api-tests/`
   - Copy `api-client.ts` → `api-tests/helpers/`
   - Copy `seed-data.json` → `api-tests/seed/users.json`
   - Adjust `API_BASE_URL` to match project

6. **Create smoke test** → `api-tests/tests/health.api.test.ts`:

   ```typescript
   import { describe, test, expect } from "vitest";

   const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

   describe("API Health", () => {
     test("GET /health returns 200", async () => {
       const res = await fetch(`${BASE_URL}/health`);
       expect(res.status).toBe(200);
     });
   });
   ```

7. **Add npm script to package.json:**

   ```json
   {
     "scripts": {
       "test:api": "vitest run --config api-tests/vitest.api.config.ts",
       "test:api:watch": "vitest --config api-tests/vitest.api.config.ts"
     }
   }
   ```

8. **Run smoke test to verify:**
   // turbo

   ```bash
   npx vitest run --config api-tests/vitest.api.config.ts
   ```

---

### Action: `generate [resource]`

**TDD MANDATORY: Tests MUST fail first (RED phase).**

1. **Analyze the resource:**
   - Check API route files (Next.js `app/api/`, Express router, etc.)
   - Identify endpoints: GET, POST, PUT, PATCH, DELETE
   - Identify request/response shapes
   - Identify auth requirements

2. **Create seed data** if not already existing:
   - Add entry to `api-tests/seed/[resource].json`
   - Include: valid data, invalid data, edge cases

3. **Write test file** → `api-tests/tests/[resource].api.test.ts`:
   - Import `createApiClient` from helpers
   - Import seed data from JSON
   - One `describe` per resource
   - Tests for each endpoint:
     - ✅ Success case (200/201)
     - ✅ Validation error (400)
     - ✅ Not found (404)
     - ✅ Unauthorized (401) if protected

4. **Run test → verify FAIL (RED):**
   // turbo

   ```bash
   npx vitest run api-tests/tests/[resource].api.test.ts --config api-tests/vitest.api.config.ts
   ```

   - Tests MUST fail (endpoint not implemented yet)
   - If tests pass → not testing the right thing. Rewrite.

5. **Report RED status:**
   - Show which tests failed and why
   - Confirm failures are expected (endpoint missing)
   - Resource is now ready for implementation

6. **After endpoint is implemented → verify PASS (GREEN):**
   // turbo

   ```bash
   npx vitest run api-tests/tests/[resource].api.test.ts --config api-tests/vitest.api.config.ts
   ```

---

### Action: `run`

1. **Check dev server is running:**
   - If not running → warn user to start it first
   - Check `API_BASE_URL` env or default `http://localhost:3000/api`

2. **Run all API tests:**
   // turbo

   ```bash
   npx vitest run --config api-tests/vitest.api.config.ts
   ```

3. **Parse and report results:**
   - Total passed / failed / skipped
   - List failed tests with error summary
   - If failures → suggest debug with watch mode:
     ```bash
     npx vitest --config api-tests/vitest.api.config.ts
     ```

---

### Action: `report`

1. **Run tests with verbose output:**

   ```bash
   npx vitest run --config api-tests/vitest.api.config.ts --reporter=verbose
   ```

2. **Optional coverage:**

   ```bash
   npx vitest run --config api-tests/vitest.api.config.ts --coverage
   ```
