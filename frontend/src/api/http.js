import { getAuthToken } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export async function apiRequest(path, options = {}) {
  const token = options.skipAuth ? "" : getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload.message ||
      payload.error ||
      "The server could not complete the request.";
    const error = new Error(message);
    error.status = response.status;
    error.fieldErrors = payload.fieldErrors || {};
    throw error;
  }

  return payload;
}

