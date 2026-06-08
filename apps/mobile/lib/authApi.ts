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

async function apiPost<T>(path: string, body: unknown, bearerToken?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`;
  const resp = await fetch(`${API_BASE}${path}`, {
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
  const resp = await fetch(`${API_BASE}${path}`, {
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
  // Exchange Google access_token via web auth endpoint, then get mobile tokens
  const webResp = await fetch(`${API_BASE}/api/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: googleAccessToken }),
  });
  if (!webResp.ok) throw new Error("Google sign-in failed");

  // Extract cookie from Set-Cookie header, then exchange for mobile token
  const setCookie = webResp.headers.get("set-cookie") ?? "";
  const tokenMatch = setCookie.match(/trekyatra_access_token=([^;]+)/);
  const sessionToken = tokenMatch?.[1];

  if (sessionToken) {
    const mobileResp = await fetch(`${API_BASE}/api/v1/auth/mobile/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `trekyatra_access_token=${sessionToken}`,
      },
      body: JSON.stringify({ device_id: deviceId, platform: Platform.OS }),
    });
    if (mobileResp.ok) {
      const tokens = await mobileResp.json();
      const userData = await webResp.json();
      return {
        ...tokens,
        user_id: userData.user?.id ?? "",
        email: userData.user?.email ?? null,
        full_name: userData.user?.full_name ?? null,
      };
    }
  }

  // Fallback: parse user from web response
  const userData = await webResp.json();
  throw new Error("Could not obtain mobile token after Google sign-in. Please try email sign-in.");
}
