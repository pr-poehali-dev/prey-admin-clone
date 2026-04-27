const AUTH_URL = "https://functions.poehali.dev/69c46be8-4862-4186-90fe-44bbb1b7c427";
const API_URL = "https://functions.poehali.dev/a444fc44-d6d5-4e9a-92a6-dabaad5269fb";

function getToken() {
  return localStorage.getItem("prey_token") || "";
}

export function getAdminInfo() {
  return {
    username: localStorage.getItem("prey_username") || "",
    role: localStorage.getItem("prey_role") || "",
  };
}

export async function login(username: string, password: string) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка входа");
  localStorage.setItem("prey_token", data.token);
  localStorage.setItem("prey_username", data.username);
  localStorage.setItem("prey_role", data.role);
  return data;
}

export function logout() {
  localStorage.removeItem("prey_token");
  localStorage.removeItem("prey_username");
  localStorage.removeItem("prey_role");
}

export function isAuthenticated() {
  return !!localStorage.getItem("prey_token");
}

async function apiGet(section: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams({ section, ...params }).toString();
  const res = await fetch(`${API_URL}?${q}`, {
    headers: { "X-Auth-Token": getToken() },
  });
  if (res.status === 401) { logout(); window.location.href = "/"; }
  return res.json();
}

async function apiPost(section: string, body: object) {
  const res = await fetch(`${API_URL}?section=${section}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { logout(); window.location.href = "/"; }
  return res.json();
}

async function apiPut(section: string, body: object) {
  const res = await fetch(`${API_URL}?section=${section}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { logout(); window.location.href = "/"; }
  return res.json();
}

export const api = {
  dashboard: () => apiGet("dashboard"),
  players: {
    list: (params: Record<string, string>) => apiGet("players", params),
    update: (body: object) => apiPut("players", body),
  },
  servers: {
    list: () => apiGet("servers"),
    create: (body: object) => apiPost("servers", body),
    update: (body: object) => apiPut("servers", body),
  },
  items: {
    list: (params: Record<string, string> = {}) => apiGet("items", params),
    create: (body: object) => apiPost("items", body),
    update: (body: object) => apiPut("items", body),
  },
  logs: {
    list: (params: Record<string, string> = {}) => apiGet("logs", params),
  },
};
