const apiBase =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000")
    : "";

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase}/api/v1${path}`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Master CMS helpers
// ---------------------------------------------------------------------------

// Named sections stored in content_json.sections — values are HTML strings.
export interface TrekContentSections {
  why_this_trek?: string;
  route_overview?: string;
  itinerary?: string;
  best_time?: string;
  difficulty?: string;
  permits?: string;
  cost_estimate?: string;
  packing?: string;
  safety?: string;
  faqs?: string;
}

export interface CMSPage {
  id: string;
  slug: string;
  page_type: string;
  title: string;
  content_html: string;
  content_json: { sections?: TrekContentSections; [key: string]: unknown } | null;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_meta: Record<string, unknown> | null;
  brief_id: string | null;
  cluster_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchCMSPage(slug: string): Promise<CMSPage> {
  const url = `${apiBase}/api/v1/cms/pages/${slug}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CMS ${res.status}: /cms/pages/${slug}`);
  return res.json() as Promise<CMSPage>;
}

export async function fetchCMSPages(filters?: {
  status?: string;
  page_type?: string;
  limit?: number;
  offset?: number;
}): Promise<CMSPage[]> {
  const params = filters
    ? "?" + new URLSearchParams(
        Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, String(v)]))
      ).toString()
    : "";
  return apiFetch<CMSPage[]>(`/cms/pages${params}`);
}

export interface CMSPagePayload {
  slug?: string;
  page_type?: string;
  title?: string;
  content_html?: string;
  content_json?: { sections?: TrekContentSections } | null;
  status?: string;
  seo_title?: string | null;
  seo_description?: string | null;
}

export async function createCMSPage(data: CMSPagePayload & { slug: string; title: string; page_type: string }): Promise<CMSPage> {
  const res = await fetch("/api/v1/cms/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Create failed (${res.status})`);
  }
  return res.json() as Promise<CMSPage>;
}

export async function updateCMSPage(slug: string, data: CMSPagePayload): Promise<CMSPage> {
  const res = await fetch(`/api/v1/cms/pages/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Update failed (${res.status})`);
  }
  return res.json() as Promise<CMSPage>;
}
