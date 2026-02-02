const ROLE_KEY = "authRole";
const AUTH_KEY = "authActive";

export function setAuth(role: string) {
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(AUTH_KEY, "1");
}

export function clearAuth() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthToken() {
  return null;
}

export function getAuthRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "1";
}
