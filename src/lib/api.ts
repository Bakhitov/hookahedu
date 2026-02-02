import { getAuthToken } from "@/lib/auth";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function handleResponse(response: Response) {
  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      if (Array.isArray(data?.details) && data.details.length) {
        const detail = data.details
          .map((item: any) => {
            const path = Array.isArray(item.path) && item.path.length ? item.path.join(".") : null;
            return path ? `${path}: ${item.message}` : item.message;
          })
          .join(", ");
        message = detail || data.error || message;
      } else {
        message = data.error || message;
      }
    } catch (_error) {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
  return response.json();
}

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return handleResponse(response);
}

export async function apiSend(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  Object.entries(getAuthHeaders()).forEach(([key, value]) => headers.set(key, value));

  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  return handleResponse(response);
}

export function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
