/**
 * Centralized API client for the FastAPI backend.
 * The base URL comes from VITE_API_BASE_URL — never hardcode it elsewhere.
 */
export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  detail: unknown;
  fieldErrors: Record<string, string>;
  recoverable: boolean;

  constructor(status: number, message: string, detail: unknown, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
    this.recoverable = status === 0 || status >= 500 || status === 429;
  }
}

function extractDetail(data: unknown): unknown {
  if (data && typeof data === "object" && "detail" in data) return (data as { detail: unknown }).detail;
  return data;
}

function buildError(status: number, data: unknown): ApiError {
  const detail = extractDetail(data);
  const fieldErrors: Record<string, string> = {};
  if (status === 422 && Array.isArray(detail)) {
    for (const d of detail as Array<{ loc?: unknown[]; msg?: string }>) {
      const loc = (d.loc ?? []).filter((p) => p !== "body");
      const key = String(loc[loc.length - 1] ?? "");
      if (key && d.msg) fieldErrors[key] = d.msg;
    }
  }
  const text = typeof detail === "string" ? detail : "";
  const messages: Record<number, string> = {
    400: text || "The backend rejected the request. Please check your inputs.",
    404: text || "This endpoint does not exist on the backend.",
    422: "Some values don't match what the model expects. Please review the highlighted fields.",
    500: text ? `Server error: ${text}` : "The backend hit an internal error. Please try again.",
    503: text || "The model is not ready yet. The backend may still be loading it — try again shortly.",
  };
  return new ApiError(status, messages[status] ?? (text || `Request failed with status ${status}.`), detail, fieldErrors);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      `Cannot reach the backend at ${API_BASE_URL}. Make sure the FastAPI server is running, reachable from this browser, and that CORS allows this site.`,
      null,
    );
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw buildError(res.status, data);
  return data as T;
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
