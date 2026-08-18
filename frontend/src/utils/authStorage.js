const AUTH_STORAGE_KEY = "consultant-management-session";

export function getStoredSession() {
  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const session = rawSession ? JSON.parse(rawSession) : null;

    if (!isValidSession(session)) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
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

function isValidSession(session) {
  if (!session?.token || !session?.email) {
    return false;
  }

  const expiresAt = readTokenExpiration(session.token);
  return expiresAt === null || expiresAt > Date.now();
}

function readTokenExpiration(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const decodedPayload = JSON.parse(window.atob(toBase64(payload)));
    return typeof decodedPayload.exp === "number" ? decodedPayload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function toBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return normalized + "=".repeat(paddingLength);
}
