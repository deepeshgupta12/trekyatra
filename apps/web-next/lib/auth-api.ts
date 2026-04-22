export type UserResponse = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  is_verified_email: boolean;
  is_verified_mobile: boolean;
  primary_auth_method: string | null;
  created_at: string;
};

export type AuthResponse = {
  user: UserResponse;
  session_expires_at: string;
};

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    return await authFetch<UserResponse>("/auth/me");
  } catch {
    return null;
  }
}

export async function loginEmail(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/auth/login/email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function signupEmail(payload: {
  email: string;
  password: string;
  full_name?: string;
  display_name?: string;
}): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/auth/signup/email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutApi(): Promise<void> {
  await authFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export async function googleAuth(access_token: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ access_token }),
  });
}
