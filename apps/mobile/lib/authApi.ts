import { Platform } from "react-native";
import { getOrCreateDeviceId } from "./authStorage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export interface AuthUser {
  id: string;
  email: string | null;
  full_name: string | null;
  is_verified_email: boolean;
  subscription_plan: string;
}

export interface MobileAuthResult {
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
}

const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiPost<T>(path: string, body: unknown, bearerToken?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`;
  const resp = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    let detail = "Request failed";
    try {
      const data = await resp.json();
      detail = data.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }
  return resp.json() as Promise<T>;
}

async function apiGet<T>(path: string, bearerToken: string): Promise<T> {
  const resp = await fetchWithTimeout(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!resp.ok) throw new Error("Request failed");
  return resp.json() as Promise<T>;
}

export async function signIn(email: string, password: string): Promise<MobileAuthResult> {
  const deviceId = await getOrCreateDeviceId();
  return apiPost<MobileAuthResult>("/api/v1/auth/mobile/login", {
    email,
    password,
    device_id: deviceId,
    platform: Platform.OS,
  });
}

export async function signUp(
  email: string,
  password: string,
  fullName?: string
): Promise<MobileAuthResult> {
  const deviceId = await getOrCreateDeviceId();
  return apiPost<MobileAuthResult>("/api/v1/auth/mobile/signup", {
    email,
    password,
    full_name: fullName ?? null,
    device_id: deviceId,
    platform: Platform.OS,
  });
}

export async function getMe(bearerToken: string): Promise<AuthUser> {
  return apiGet<AuthUser>("/api/v1/auth/me", bearerToken);
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const deviceId = await getOrCreateDeviceId();
  const result = await apiPost<{ access_token: string }>("/api/v1/auth/mobile/token/refresh", {
    refresh_token: refreshToken,
    device_id: deviceId,
  });
  return result.access_token;
}

export async function signOutServer(bearerToken: string): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  // Delete device registration
  try {
    await fetch(`${API_BASE}/api/v1/mobile/device/${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
  } catch {}
}

export async function forgotPassword(email: string): Promise<void> {
  await apiPost("/api/v1/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiPost("/api/v1/auth/reset-password", { token, new_password: newPassword });
}

export async function signInWithGoogle(googleAccessToken: string): Promise<MobileAuthResult> {
  const deviceId = await getOrCreateDeviceId();
  return apiPost<MobileAuthResult>("/api/v1/auth/mobile/google", {
    access_token: googleAccessToken,
    device_id: deviceId,
    platform: Platform.OS,
  });
}
