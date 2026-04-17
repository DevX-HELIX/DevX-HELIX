/**
 * client.ts
 * Thin typed fetch wrapper for the PolicyOps backend.
 * Handles base URL, JSON serialization, error normalization, and timeouts.
 */

const BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 30_000;

// ─── Normalised error ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      isJson && typeof body === "object" && body !== null && "error" in (body as Record<string, unknown>)
        ? String((body as Record<string, unknown>).error)
        : `HTTP ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }

  return body as T;
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function get<T>(
  path: string,
  params?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const combinedSignal = signal ?? controller.signal;

  try {
    const res = await fetch(buildUrl(path, params), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: combinedSignal,
    });
    return await parseResponse<T>(res);
  } finally {
    clearTimeout(timeout);
  }
}

export async function post<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const combinedSignal = signal ?? controller.signal;

  try {
    const res = await fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: combinedSignal,
    });
    return await parseResponse<T>(res);
  } finally {
    clearTimeout(timeout);
  }
}

export async function patch<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const combinedSignal = signal ?? controller.signal;

  try {
    const res = await fetch(buildUrl(path), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: combinedSignal,
    });
    return await parseResponse<T>(res);
  } finally {
    clearTimeout(timeout);
  }
}
