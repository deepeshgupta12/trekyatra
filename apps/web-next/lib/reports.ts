const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export interface MediaOut {
  id: string;
  url: string;
  s3_key: string;
  width?: number;
  height?: number;
  file_size?: number;
}

export interface ReportOut {
  id: string;
  user_id?: string;
  trek_slug: string;
  title?: string;
  body: string;
  condition: "open" | "caution" | "closed" | "unknown";
  trek_date: string;
  status: "pending" | "approved" | "rejected";
  moderated_at?: string;
  created_at: string;
  media: MediaOut[];
}

export interface ConditionSummary {
  total_reports: number;
  open_pct: number;
  caution_pct: number;
  closed_pct: number;
  unknown_pct: number;
  last_report_date?: string;
}

export interface ReportPageOut {
  items: ReportOut[];
  condition_summary: ConditionSummary;
  total: number;
  page: number;
  has_more: boolean;
}

export interface ReportIn {
  trek_slug: string;
  title?: string;
  body: string;
  condition: "open" | "caution" | "closed" | "unknown";
  trek_date: string;
  photo_urls: string[];
}

export async function fetchReports(slug: string, page = 1): Promise<ReportPageOut> {
  const res = await fetch(`${apiBase}/api/v1/public/treks/${slug}/reports?page=${page}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
  return res.json();
}

export async function submitReport(payload: ReportIn): Promise<ReportOut> {
  const res = await fetch(`${apiBase}/api/v1/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Submit failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadPhoto(file: File): Promise<{ url: string; key: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${apiBase}/api/v1/reports/media/upload`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteReport(reportId: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/v1/reports/${reportId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export async function fetchModerationQueue(status = "pending", page = 1): Promise<ReportPageOut & { total: number }> {
  const res = await fetch(
    `${apiBase}/api/v1/admin/reports?status=${status}&page=${page}`,
    { credentials: "include", signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) throw new Error(`Moderation queue failed: ${res.status}`);
  return res.json();
}

export async function moderateReport(
  reportId: string,
  action: "approve" | "reject",
  reason?: string,
): Promise<ReportOut> {
  const res = await fetch(`${apiBase}/api/v1/admin/reports/${reportId}/moderate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, reason }),
  });
  if (!res.ok) throw new Error(`Moderation failed: ${res.status}`);
  return res.json();
}
