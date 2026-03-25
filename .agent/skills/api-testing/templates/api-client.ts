/**
 * Lightweight API client wrapper for tests.
 *
 * - Uses native `fetch` (Node 18+ / Bun)
 * - Never throws on 4xx/5xx — returns { status, body, headers }
 * - Supports auth token via options
 *
 * Usage:
 *   const api = createApiClient('http://localhost:3000/api');
 *   const { status, body } = await api.get('/users');
 */

interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
}

interface RequestOptions {
  token?: string;
  headers?: Record<string, string>;
}

export function createApiClient(baseUrl: string) {
  const BASE = baseUrl.replace(/\/$/, "");

  async function request<T = unknown>(
    method: string,
    path: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    if (options?.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    let body: T;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = (await res.json()) as T;
    } else {
      body = (await res.text()) as unknown as T;
    }

    return { status: res.status, body, headers: res.headers };
  }

  return {
    get: <T = unknown>(path: string, options?: RequestOptions) =>
      request<T>("GET", path, undefined, options),

    post: <T = unknown>(
      path: string,
      data?: unknown,
      options?: RequestOptions,
    ) => request<T>("POST", path, data, options),

    put: <T = unknown>(
      path: string,
      data?: unknown,
      options?: RequestOptions,
    ) => request<T>("PUT", path, data, options),

    patch: <T = unknown>(
      path: string,
      data?: unknown,
      options?: RequestOptions,
    ) => request<T>("PATCH", path, data, options),

    delete: <T = unknown>(path: string, options?: RequestOptions) =>
      request<T>("DELETE", path, undefined, options),
  };
}
