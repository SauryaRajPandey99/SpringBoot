import { getAuthToken } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export async function apiRequest(path, options = {}) {
  const { headers = {}, responseType = "json", skipAuth = false, ...fetchOptions } = options;
  const token = skipAuth ? "" : getAuthToken();
  const isFormData = fetchOptions.body instanceof FormData;
  const isJsonRequest = Boolean(fetchOptions.body) && !isFormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      ...(isJsonRequest ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  if (responseType === "blob") {
    if (!response.ok) {
      const message = await response.text().catch(() => "The server could not complete the request.");
      const error = new Error(message || "The server could not complete the request.");
      error.status = response.status;
      throw error;
    }

    return response.blob();
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
