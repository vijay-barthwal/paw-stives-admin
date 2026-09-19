import { getAccessToken } from "@/lib/token"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type QueryValue = string | number | boolean | undefined | null

function buildQueryString(params?: Record<string, QueryValue>) {
  if (!params) return ""
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ""
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, QueryValue>; signal?: AbortSignal } = {}
): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(options.query)}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  const isJson = response.headers.get("content-type")?.includes("application/json")
  const data = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const message = (data && typeof data === "object" && "message" in data ? String((data as { message: unknown }).message) : null) ?? response.statusText
    throw new ApiError(response.status, message)
  }

  return data as T
}

const apiClient = {
  get: <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) => request<T>(path, { method: "GET", query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: "DELETE", body }),
}

export { apiClient, ApiError }
