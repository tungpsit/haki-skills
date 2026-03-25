import { defineConfig } from "vitest/config";

/**
 * Vitest config for API integration tests.
 *
 * Separate from unit test config — no DOM, longer timeout, API-specific setup.
 *
 * Usage:
 *   npx vitest run --config api-tests/vitest.api.config.ts
 */
export default defineConfig({
  test: {
    /* Enable globals (describe, test, expect without import) */
    globals: true,

    /* Node environment — no DOM needed */
    environment: "node",

    /* Only include API test files */
    include: ["api-tests/**/*.api.test.ts"],

    /* Longer timeout for network requests */
    testTimeout: 10_000,

    /* Hook timeout */
    hookTimeout: 15_000,

    /* Run tests sequentially (API tests may share state) */
    sequence: {
      concurrent: false,
    },

    /* Optional: global setup file for DB seeding, server start */
    // setupFiles: ['api-tests/setup.ts'],

    /* Resolve JSON imports */
    // alias: {},
  },
});
