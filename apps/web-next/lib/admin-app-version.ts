// Admin app-version-gate API — cookie auth (credentials: "include"), relative URLs.

const BASE = "/api/v1/admin/app/version-config";

export interface AppVersionConfig {
  platform: string;
  min_supported_version: string;
  latest_version: string;
  force_update_enabled: boolean;
  update_message: string | null;
  store_url: string | null;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  updated_at?: string | null;
}

export type AppVersionConfigUpdate = Partial<Omit<AppVersionConfig, "platform" | "updated_at">>;

export async function fetchAppVersionConfig(platform = "ios"): Promise<AppVersionConfig> {
  const res = await fetch(`${BASE}?platform=${platform}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch app version config");
  return res.json() as Promise<AppVersionConfig>;
}

export async function updateAppVersionConfig(
  patch: AppVersionConfigUpdate,
  platform = "ios"
): Promise<AppVersionConfig> {
  const res = await fetch(`${BASE}?platform=${platform}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update app version config");
  return res.json() as Promise<AppVersionConfig>;
}
