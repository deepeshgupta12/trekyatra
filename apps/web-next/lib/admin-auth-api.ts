const BASE = "/api/v1/admin/auth";

export interface AdminLoginResponse {
  email: string;
  expires_at: string;
}

export interface AdminMeResponse {
  email: string;
}

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResponse> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Login failed.");
  }
  return res.json();
}

export async function adminLogout(): Promise<void> {
  await fetch(`${BASE}/logout`, { method: "POST", credentials: "include" });
}

export async function getAdminMe(): Promise<AdminMeResponse | null> {
  const res = await fetch(`${BASE}/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}
