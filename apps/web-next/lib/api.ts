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

// Structured trek facts stored in content_json.trek_facts — set via CMSPageForm.
export interface TrekFacts {
  duration?: string;
  altitude?: string;
  difficulty?: string;
  season?: string;
  permits?: string;
  base?: string;
}

// Structured FAQ items stored in content_json.faqs
export interface FAQItem {
  q: string;
  a: string;
}

export interface CMSPage {
  id: string;
  slug: string;
  page_type: string;
  title: string;
  content_html: string;
  content_json: { sections?: TrekContentSections; trek_facts?: TrekFacts; faqs?: FAQItem[]; [key: string]: unknown } | null;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_meta: Record<string, unknown> | null;
  hero_image_url: string | null;
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

// ---------------------------------------------------------------------------
// Fact-check claims
// ---------------------------------------------------------------------------

export interface FactCheckClaim {
  id: string;
  draft_id: string;
  draft_title: string;
  claim_text: string;
  claim_type: string;
  confidence_score: number;
  flagged_for_review: boolean;
  created_at: string;
}

export async function fetchFactCheckClaims(flaggedOnly = false): Promise<FactCheckClaim[]> {
  return apiFetch<FactCheckClaim[]>(`/admin/fact-check/claims?flagged_only=${flaggedOnly}&limit=100`);
}

export async function patchFactCheckClaim(id: string, flaggedForReview: boolean): Promise<FactCheckClaim> {
  const res = await fetch(`/api/v1/admin/fact-check/claims/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flagged_for_review: flaggedForReview }),
  });
  if (!res.ok) throw new Error(`Claim update failed (${res.status})`);
  return res.json() as Promise<FactCheckClaim>;
}

export async function clearPipelineRuns(): Promise<{ deleted_runs: number; deleted_stages: number }> {
  const res = await fetch("/api/v1/admin/pipeline/runs/clear", { method: "DELETE" });
  if (!res.ok) throw new Error(`Clear runs failed (${res.status})`);
  return res.json();
}

export async function clearAgentRuns(): Promise<{ deleted: number }> {
  const res = await fetch("/api/v1/admin/agent-runs/clear", { method: "DELETE" });
  if (!res.ok) throw new Error(`Clear agent runs failed (${res.status})`);
  return res.json();
}

// ---------------------------------------------------------------------------

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
  content_json?: { sections?: TrekContentSections; trek_facts?: TrekFacts; faqs?: FAQItem[] } | null;
  status?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  hero_image_url?: string | null;
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

export async function reparseCMSSections(slug: string): Promise<CMSPage> {
  const res = await fetch(`/api/v1/cms/pages/${slug}/reparse-sections`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Reparse failed (${res.status})`);
  }
  return res.json() as Promise<CMSPage>;
}

// ---------------------------------------------------------------------------
// Pipeline orchestration helpers
// ---------------------------------------------------------------------------

export interface PipelineStage {
  id: string;
  stage_name: string;
  status: string;
  agent_run_id: number | null;
  error_detail: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface PipelineRun {
  id: string;
  pipeline_type: string;
  status: string;
  current_stage: string | null;
  start_stage: string;
  end_stage: string;
  input_json: string | null;
  output_json: string | null;
  error_detail: string | null;
  created_at: string;
  completed_at: string | null;
  stages: PipelineStage[];
}

export interface PipelineTriggerResponse {
  pipeline_run_id: string;
  status: string;
  message: string;
}

export async function fetchPipelineRuns(limit = 20): Promise<PipelineRun[]> {
  return apiFetch<PipelineRun[]>(`/admin/pipeline/runs?limit=${limit}`);
}

export async function fetchPipelineRun(runId: string): Promise<PipelineRun> {
  return apiFetch<PipelineRun>(`/admin/pipeline/runs/${runId}`);
}

export async function triggerPipeline(payload: {
  seed_topics?: string[];
  start_stage?: string;
  end_stage?: string;
  brief_id?: string;
  draft_id?: string;
}): Promise<PipelineTriggerResponse> {
  const res = await fetch("/api/v1/admin/pipeline/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Trigger failed (${res.status})`);
  }
  return res.json() as Promise<PipelineTriggerResponse>;
}

export async function resumePipelineRun(runId: string): Promise<PipelineTriggerResponse> {
  const res = await fetch(`/api/v1/admin/pipeline/runs/${runId}/resume`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Resume failed (${res.status})`);
  }
  return res.json() as Promise<PipelineTriggerResponse>;
}

export async function cancelPipelineRun(runId: string): Promise<PipelineRun> {
  const res = await fetch(`/api/v1/admin/pipeline/runs/${runId}/cancel`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Cancel failed (${res.status})`);
  }
  return res.json() as Promise<PipelineRun>;
}
