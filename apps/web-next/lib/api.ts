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
  ymyl_flag: boolean;
  evidence_url: string | null;
  created_at: string;
}

export interface FactCheckTriggerResult {
  draft_id: string;
  claims_extracted: number;
  ymyl_claims: number;
  flagged_claims: number;
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

export async function triggerFactCheck(draftId: string): Promise<FactCheckTriggerResult> {
  const res = await fetch(`/api/v1/admin/drafts/${draftId}/fact-check`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Fact-check trigger failed (${res.status})`);
  return res.json() as Promise<FactCheckTriggerResult>;
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

// ---------------------------------------------------------------------------
// Monetization — leads and newsletter
// ---------------------------------------------------------------------------

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  trek_interest: string;
  message?: string;
  source_page: string;
  source_cluster?: string;
  cta_type?: string;
}

export interface LeadResponse {
  id: string;
  name: string;
  email: string;
  trek_interest: string;
  source_page: string;
  created_at: string;
}

export async function submitLead(payload: LeadPayload): Promise<LeadResponse> {
  const res = await fetch("/api/v1/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Lead submit failed (${res.status})`);
  }
  return res.json() as Promise<LeadResponse>;
}

export interface NewsletterPayload {
  email: string;
  name?: string;
  source_page: string;
  lead_magnet?: string;
}

export interface NewsletterResponse {
  id: string;
  email: string;
  source_page: string;
  already_subscribed: boolean;
  created_at: string;
}

export async function subscribeNewsletter(payload: NewsletterPayload): Promise<NewsletterResponse> {
  const res = await fetch("/api/v1/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Subscribe failed (${res.status})`);
  }
  return res.json() as Promise<NewsletterResponse>;
}

// ---------------------------------------------------------------------------
// Internal linking
// ---------------------------------------------------------------------------

export interface RelatedPage {
  id: string;
  slug: string;
  title: string;
  page_type: string;
}

export interface OrphanPage {
  id: string;
  slug: string;
  title: string;
  page_type: string;
  published_at: string | null;
  cms_page_id: string | null;
  cluster_id: string | null;
}

export interface AnchorSuggestion {
  text: string;
  reason: string;
}

export async function fetchRelatedPages(slug: string, limit = 5): Promise<RelatedPage[]> {
  return apiFetch<RelatedPage[]>(`/links/suggestions/${slug}?limit=${limit}`);
}

export async function triggerLinkSync(): Promise<{ synced: number; message: string }> {
  const res = await fetch("/api/v1/admin/links/sync", { method: "POST" });
  if (!res.ok) throw new Error(`Link sync failed (${res.status})`);
  return res.json();
}

export async function fetchOrphanPages(): Promise<{ pages: OrphanPage[]; count: number }> {
  return apiFetch<{ pages: OrphanPage[]; count: number }>("/admin/links/orphans");
}

export async function fetchAnchorSuggestions(slug: string): Promise<AnchorSuggestion[]> {
  return apiFetch<AnchorSuggestion[]>(`/admin/links/anchors/${slug}`);
}

// ---------------------------------------------------------------------------
// Admin leads
// ---------------------------------------------------------------------------

export interface AdminLead {
  id: string;
  name: string;
  email: string;
  trek_interest: string;
  source_page: string;
  status: string;
  assigned_operator_id: string | null;
  status_history: { status: string; changed_at: string; changed_by: string }[] | null;
  created_at: string;
}

export interface OperatorSpecialization {
  id: string;
  operator_id: string;
  trek_slug: string;
  priority: number;
}

export interface Operator {
  id: string;
  name: string;
  slug: string;
  region: string[] | null;
  trek_types: string[] | null;
  contact_email: string;
  phone: string | null;
  website_url: string | null;
  active: boolean;
  created_at: string;
  specializations: OperatorSpecialization[];
}

export interface OperatorCreate {
  name: string;
  slug: string;
  contact_email: string;
  region?: string[];
  trek_types?: string[];
  phone?: string;
  website_url?: string;
  active?: boolean;
}

export async function fetchOperators(activeOnly?: boolean): Promise<Operator[]> {
  const q = activeOnly ? "?active_only=true" : "";
  return apiFetch<Operator[]>(`/admin/operators${q}`);
}

export async function createOperator(payload: OperatorCreate): Promise<Operator> {
  const res = await fetch(`/api/v1/admin/operators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Create operator failed (${res.status})`);
  }
  return res.json();
}

export async function patchOperator(id: string, patch: Partial<Omit<OperatorCreate, "slug">>): Promise<Operator> {
  const res = await fetch(`/api/v1/admin/operators/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Patch operator failed (${res.status})`);
  }
  return res.json();
}

export async function deleteOperator(id: string): Promise<void> {
  const res = await fetch(`/api/v1/admin/operators/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete operator failed (${res.status})`);
}

export async function assignLeadOperator(leadId: string, operatorId: string): Promise<AdminLead> {
  const res = await fetch(`/api/v1/admin/leads/${leadId}/assign-operator`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operator_id: operatorId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Assign operator failed (${res.status})`);
  }
  return res.json();
}

export async function fetchAdminLeads(params?: { limit?: number; offset?: number; status?: string }): Promise<AdminLead[]> {
  const q = params
    ? "?" + new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
      )
    : "";
  return apiFetch<AdminLead[]>(`/admin/leads${q}`);
}

export async function patchLeadStatus(leadId: string, status: string): Promise<AdminLead> {
  const res = await fetch(`/api/v1/admin/leads/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Status update failed (${res.status})`);
  }
  return res.json() as Promise<AdminLead>;
}


// ---------------------------------------------------------------------------
// Content refresh engine (Step 23)
// ---------------------------------------------------------------------------

export interface StalePage {
  id: string;
  slug: string;
  title: string;
  page_type: string;
  freshness_interval_days: number;
  last_refreshed_at: string | null;
  do_not_refresh: boolean;
  days_stale: number | null;
}

export interface RefreshLog {
  id: string;
  page_id: string;
  triggered_by: string;
  trigger_at: string;
  completed_at: string | null;
  result: string;
  notes: string | null;
  created_at: string;
}

export interface RefreshTriggerResponse {
  queued: number;
  logs: RefreshLog[];
}

export async function fetchStalePages(limit = 50): Promise<StalePage[]> {
  return apiFetch<StalePage[]>(`/admin/refresh/stale?limit=${limit}`);
}

export async function triggerRefresh(pageIds: string[]): Promise<RefreshTriggerResponse> {
  const res = await fetch("/api/v1/admin/refresh/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page_ids: pageIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Refresh trigger failed (${res.status})`);
  }
  return res.json() as Promise<RefreshTriggerResponse>;
}

export async function fetchRefreshLogs(params?: { limit?: number; offset?: number }): Promise<RefreshLog[]> {
  const q = params
    ? "?" + new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
      )
    : "";
  return apiFetch<RefreshLog[]>(`/admin/refresh/logs${q}`);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface AnalyticsSummary {
  leads_last_30d: number;
  affiliate_clicks_last_30d: number;
  newsletter_subscribers_total: number;
  pages_published_total: number;
  pipeline_runs_last_30d: number;
  agent_runs_last_30d: number;
}

export interface AffiliateClickPayload {
  page_slug: string;
  affiliate_program: string;
  affiliate_link_url?: string;
  session_id?: string;
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>("/admin/analytics/summary");
}

export async function trackAffiliateClick(payload: AffiliateClickPayload): Promise<void> {
  await fetch("/api/v1/track/affiliate-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => undefined); // fire-and-forget; never throw
}

// ---------------------------------------------------------------------------
// Agent Runs
// ---------------------------------------------------------------------------

export interface AgentRun {
  id: number;
  agent_type: string;
  status: string;
  input_json: string | null;
  output_json: string | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchAgentRuns(params?: { limit?: number; status?: string }): Promise<AgentRun[]> {
  const q = params
    ? "?" + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    : "";
  return apiFetch<AgentRun[]>(`/admin/agent-runs${q}`);
}

// ---------------------------------------------------------------------------
// Cannibalization Detection
// ---------------------------------------------------------------------------

export interface CannibalizationIssue {
  id: string;
  page_a_id: string;
  page_b_id: string;
  page_a_slug: string;
  page_b_slug: string;
  page_a_title: string;
  page_b_title: string;
  shared_keywords: string[];
  severity: "low" | "medium" | "high";
  recommendation: "merge" | "redirect" | "differentiate";
  status: "open" | "accepted" | "dismissed" | "resolved";
  resolved_at: string | null;
  created_at: string;
}

export interface DetectCannibalizationResult {
  issues_found: number;
  new_issues: number;
}

export interface MergeResult {
  draft_id: string;
  brief_id: string;
  message: string;
}

export async function fetchCannibalizationIssues(params?: {
  severity?: string;
  status?: string;
  limit?: number;
}): Promise<CannibalizationIssue[]> {
  const q = params
    ? "?" + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    : "";
  return apiFetch<CannibalizationIssue[]>(`/admin/cannibalization${q}`);
}

export async function detectCannibalization(): Promise<DetectCannibalizationResult> {
  const res = await fetch(`${apiBase}/api/v1/admin/cannibalization/detect`, { method: "POST" });
  if (!res.ok) throw new Error(`API ${res.status}: detect cannibalization`);
  return res.json();
}

export async function resolveCannibalizationIssue(
  id: string,
  status: "accepted" | "dismissed" | "resolved"
): Promise<CannibalizationIssue> {
  const res = await fetch(`${apiBase}/api/v1/admin/cannibalization/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: resolve issue`);
  return res.json();
}

export async function triggerConsolidationMerge(id: string): Promise<MergeResult> {
  const res = await fetch(`${apiBase}/api/v1/admin/cannibalization/${id}/merge`, { method: "POST" });
  if (!res.ok) throw new Error(`API ${res.status}: trigger merge`);
  return res.json();
}

// ── Newsletter + Social Repurpose (Step 27) ──────────────────────────────────

export interface NewsletterCampaign {
  id: string;
  week_label: string;
  subject: string;
  preview_text: string | null;
  body_html: string;
  status: "draft" | "sent" | string;
  sent_at: string | null;
  created_at: string;
}

export interface GenerateCampaignResult {
  campaign_id: string;
  week_label: string;
  subject: string;
  message: string;
}

export interface SendCampaignResult {
  campaign_id: string;
  status: string;
  message: string;
}

export interface SocialSnippet {
  id: string;
  page_id: string | null;
  platform: "instagram" | "pinterest" | "twitter" | string;
  copy: string;
  copy_title: string | null;
  status: string;
  created_at: string;
}

export interface RepurposeResult {
  page_slug: string;
  snippets_created: number;
  snippet_ids: string[];
}

export async function fetchNewsletterCampaigns(params?: {
  status?: string;
  limit?: number;
}): Promise<NewsletterCampaign[]> {
  const q = params
    ? "?" + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    : "";
  return apiFetch<NewsletterCampaign[]>(`/admin/newsletter${q}`);
}

export async function generateNewsletter(): Promise<GenerateCampaignResult> {
  const res = await fetch(`${apiBase}/api/v1/admin/newsletter/generate`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API ${res.status}: generate newsletter`);
  }
  return res.json();
}

export async function sendNewsletterCampaign(id: string): Promise<SendCampaignResult> {
  const res = await fetch(`${apiBase}/api/v1/admin/newsletter/${id}/send`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API ${res.status}: send campaign`);
  }
  return res.json();
}

export async function fetchSocialSnippets(params?: {
  platform?: string;
  limit?: number;
}): Promise<SocialSnippet[]> {
  const q = params
    ? "?" + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      )
    : "";
  return apiFetch<SocialSnippet[]>(`/admin/newsletter/snippets/list${q}`);
}

export async function repurposePage(slug: string): Promise<RepurposeResult> {
  const res = await fetch(`${apiBase}/api/v1/admin/pages/${slug}/repurpose`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API ${res.status}: repurpose page`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Compliance (Step 28)
// ---------------------------------------------------------------------------

export interface ComplianceResultItem {
  rule: string;
  rule_type: string;
  status: "pass" | "fail" | "warn";
  note: string;
  suggestion: string | null;
}

export interface ComplianceCheckResult {
  draft_id: string;
  compliance_status: "passed" | "flagged";
  results: ComplianceResultItem[];
  checked_rules: number;
  failed_rules: number;
}

export interface ComplianceOverrideResult {
  draft_id: string;
  compliance_status: string;
  overridden_by: string;
  override_note: string;
  overridden_at: string;
}

export async function runComplianceCheck(draftId: string): Promise<ComplianceCheckResult> {
  const res = await fetch(`${apiBase}/api/v1/admin/drafts/${draftId}/compliance-check`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API ${res.status}: compliance check`);
  }
  return res.json();
}

export async function overrideCompliance(draftId: string, overrideNote: string): Promise<ComplianceOverrideResult> {
  const res = await fetch(`${apiBase}/api/v1/admin/drafts/${draftId}/compliance-override`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ override_note: overrideNote }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API ${res.status}: compliance override`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Hubs (Step 30)
// ---------------------------------------------------------------------------

export interface HubPage {
  id: string;
  slug: string;
  page_type: "seasonal_hub" | "cluster_hub" | "regional_hub";
  title: string;
  status: string;
  published_at: string | null;
  updated_at: string | null;
  seo_title: string | null;
  hero_image_url: string | null;
}

export interface HubRegenerateResult {
  slug: string;
  hub_type: string;
  message: string;
  page_id: string | null;
}

export async function fetchHubPages(hubType?: string): Promise<HubPage[]> {
  const qs = hubType ? `?hub_type=${encodeURIComponent(hubType)}` : "";
  const res = await fetch(`${apiBase}/api/v1/admin/hubs${qs}`);
  if (!res.ok) throw new Error(`API ${res.status}: fetch hubs`);
  return res.json();
}

export async function regenerateHub(slug: string): Promise<HubRegenerateResult> {
  const encodedSlug = slug.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${apiBase}/api/v1/admin/hubs/${encodedSlug}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API ${res.status}: regenerate hub`);
  }
  return res.json();
}

