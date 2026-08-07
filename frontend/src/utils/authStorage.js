const AUTH_STORAGE_KEY = "consultant-management-session";

export function getStoredSession() {
  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return getStoredSession()?.token || "";
}

export function saveSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

