/**
 * Centralized API client for the FastAPI backend.
 * The base URL comes from VITE_API_BASE_URL — never hardcode it elsewhere.
 * This module is the ONLY place that calls fetch() against the backend.
 */
export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export type ApiErrorKind =
  | "network" // server not reachable at all (down, wrong URL/port, firewall)
  | "cors" // server reachable, but browser blocked the response (CORS / private-network policy)
  | "mixed-content" // https page calling a plain http backend
  | "validation" // 422
  | "bad-request" // 400
  | "not-found" // 404
  | "model-unavailable" // 503
  | "server" // 500 and other 5xx
  | "http"; // anything else

export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  detail: unknown;
  fieldErrors: Record<string, string>;
  recoverable: boolean;

  constructor(kind: ApiErrorKind, status: number, message: string, detail: unknown, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
    this.recoverable = !["validation", "bad-request", "not-found"].includes(kind);
  }
}

function extractDetail(data: unknown): unknown {
  if (data && typeof data === "object" && "detail" in data) return (data as { detail: unknown }).detail;
  return data;
}

function buildError(status: number, data: unknown): ApiError {
  const detail = extractDetail(data);
  const text = typeof detail === "string" ? detail : "";
  if (status === 422) {
    const fieldErrors: Record<string, string> = {};
    const generic: string[] = [];
    if (Array.isArray(detail)) {
      for (const d of detail as Array<{ loc?: unknown[]; msg?: string }>) {
        const loc = (d.loc ?? []).filter((p) => p !== "body" && typeof p === "string") as string[];
        const key = loc[loc.length - 1];
        if (key && d.msg) fieldErrors[key] = d.msg;
        else if (d.msg) generic.push(d.msg);
      }
    }
    const n = Object.keys(fieldErrors).length;
    return new ApiError(
      "validation",
      422,
      `Validation error: the backend rejected ${n ? `${n} field(s)` : "the request"}${generic.length ? ` — ${generic.join("; ")}` : ""}. Review the highlighted fields.`,
      detail,
      fieldErrors,
    );
  }
  if (status === 400) return new ApiError("bad-request", 400, `Invalid request: ${text || "the backend rejected the inputs."}`, detail);
  if (status === 404) return new ApiError("not-found", 404, `Endpoint not found: ${text || "this route does not exist on the backend."}`, detail);
  if (status === 503)
    return new ApiError("model-unavailable", 503, `Model unavailable: ${text || "the backend is running but the model is not loaded or ready."}`, detail);
  if (status >= 500) return new ApiError("server", status, `Backend server error (HTTP ${status})${text ? `: ${text}` : ". Check the FastAPI logs."}`, detail);
  return new ApiError("http", status, text || `Request failed with status ${status}.`, detail);
}

/** fetch() failed without a response: figure out whether it's CORS, mixed content, or plain unreachable. */
async function diagnoseFetchFailure(): Promise<ApiError> {
  const pageHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  if (pageHttps && API_BASE_URL.startsWith("http:")) {
    const loopback = /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(API_BASE_URL);
    if (!loopback)
      return new ApiError(
        "mixed-content",
        0,
        `Blocked: this page is served over https but the backend URL (${API_BASE_URL}) is plain http. Use an https backend URL.`,
        null,
      );
  }
  try {
    // An opaque no-cors request succeeds if the server is up, even when CORS would block us.
    await fetch(`${API_BASE_URL}/openapi.json`, { mode: "no-cors", cache: "no-store" });
    return new ApiError(
      "cors",
      0,
      `CORS blocked: the backend at ${API_BASE_URL} is reachable, but it does not allow requests from ${typeof window !== "undefined" ? window.location.origin : "this origin"}. Add this origin to FastAPI's CORSMiddleware allow_origins.`,
      null,
    );
  } catch {
    return new ApiError(
      "network",
      0,
      `Network error: cannot reach ${API_BASE_URL}. Make sure uvicorn is running on that host/port and is reachable from this browser.`,
      null,
    );
  }
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
    throw await diagnoseFetchFailure();
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
