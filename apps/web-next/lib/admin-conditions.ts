// Admin conditions API — all calls use cookie auth (credentials: "include"), relative URLs.

const BASE = "/api/v1/admin/conditions";

export interface ConditionAdminRow {
  slug: string;
  title: string;
  trek_base_lat: number | null;
  trek_base_lng: number | null;
  coords_seeded: boolean;
  trail_status: string | null;
  permit_status: string | null;
  last_updated_at: string | null;
  weather_label: string | null;
}

export interface ConditionsListOut {
  total: number;
  seeded: number;
  refreshed: number;
  rows: ConditionAdminRow[];
}

export async function fetchConditionsList(): Promise<ConditionsListOut> {
  const res = await fetch(BASE, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch conditions list");
  return res.json() as Promise<ConditionsListOut>;
}

export async function seedAllCoordinates(): Promise<{ seeded: number; skipped: number }> {
  const res = await fetch(`${BASE}/seed-coordinates`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to seed coordinates");
  return res.json();
}

export async function dispatchRefreshAll(): Promise<{ task_id: string; status: string }> {
  const res = await fetch(`${BASE}/refresh-all`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to dispatch refresh-all task");
  return res.json();
}

export async function refreshSingleTrek(slug: string): Promise<void> {
  const res = await fetch(`${BASE}/${slug}/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to refresh ${slug}`);
}

export async function setTrekCoordinates(slug: string, lat: number, lng: number): Promise<void> {
  const res = await fetch(`${BASE}/${slug}/coordinates`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng }),
  });
  if (!res.ok) throw new Error(`Failed to set coordinates for ${slug}`);
}
