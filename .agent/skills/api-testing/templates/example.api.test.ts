import { beforeAll, describe, expect, test } from "vitest";
import { createApiClient } from "../helpers/api-client";
import usersData from "../seed/users.json";

/**
 * API test template.
 *
 * Rules:
 * - One describe block per resource
 * - Assert: status → body → headers (in that order)
 * - Each test independent (own data, own cleanup)
 * - Test happy path + error cases
 * - Load test data from seed/ JSON files
 */

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";
const api = createApiClient(BASE_URL);

describe("Users API", () => {
  let token: string;
  let createdUserId: string;

  // ─── Setup: Get auth token ───────────────────────────────────

  beforeAll(async () => {
    const { body } = await api.post("/auth/login", {
      email: usersData.adminUser.email,
      password: usersData.adminUser.password,
    });
    token = body.token;
  });

  // ─── GET /users ──────────────────────────────────────────────

  test("GET /users returns user list", async () => {
    const { status, body } = await api.get("/users", { token });

    expect(status).toBe(200);
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("id");
    expect(body[0]).toHaveProperty("email");
  });

  test("GET /users requires authentication", async () => {
    const { status } = await api.get("/users");
    expect(status).toBe(401);
  });

  // ─── POST /users ─────────────────────────────────────────────

  test("POST /users creates user with valid data", async () => {
    const newUser = {
      ...usersData.validUser,
      email: `test-${Date.now()}@example.com`, // Unique email
    };

    const { status, body } = await api.post("/users", newUser, { token });

    expect(status).toBe(201);
    expect(body).toHaveProperty("id");
    expect(body.name).toBe(newUser.name);
    expect(body.email).toBe(newUser.email);
    createdUserId = body.id;
  });

  test("POST /users rejects missing required fields", async () => {
    const { status, body } = await api.post("/users", {}, { token });

    expect(status).toBe(400);
    expect(body).toHaveProperty("errors");
  });

  test("POST /users rejects invalid email", async () => {
    const { status, body } = await api.post("/users", usersData.invalidUser, {
      token,
    });

    expect(status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  // ─── GET /users/:id ──────────────────────────────────────────

  test("GET /users/:id returns specific user", async () => {
    const { status, body } = await api.get(`/users/${createdUserId}`, {
      token,
    });

    expect(status).toBe(200);
    expect(body).toHaveProperty("id", createdUserId);
  });

  test("GET /users/:id returns 404 for non-existent", async () => {
    const { status } = await api.get("/users/non-existent-id", { token });
    expect(status).toBe(404);
  });

  // ─── DELETE /users/:id ────────────────────────────────────────

  test("DELETE /users/:id removes user", async () => {
    if (!createdUserId) return;
    const { status } = await api.delete(`/users/${createdUserId}`, { token });
    expect(status).toBe(204);
  });
});
