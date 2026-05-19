// NEXT_PUBLIC_API_BASE must be set to https://www.trekyatra.co.in in production.
// All /api/ paths are routed to the api component by DO App Platform at network level.
const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

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
  // Multilingual fields (Step 37)
  language: string;
  translations: Record<string, string> | null;
  source_page_id: string | null;
  // Premium content gating (Step 40)
  is_premium: boolean;
  is_gated: boolean;
  // Trek guide metadata (Step 46 — only set for page_type = "trek_guide")
  trek_name: string | null;
  trek_state: string | null;
  trek_difficulty: string | null;
  trek_duration: string | null;
  trek_season: string | null;
  trek_suitability: string | null;
}

// ---------------------------------------------------------------------------
// Subscription helpers (Step 40)
// ---------------------------------------------------------------------------

export interface SubscriptionStatus {
  has_subscription: boolean;
  plan: string;
  status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiFetch<SubscriptionStatus>("/subscriptions/status");
}

export async function createSubscriptionCheckout(
  interval: "monthly" | "annual"
): Promise<{ checkout_url: string; test_mode: boolean }> {
  const res = await fetch("/api/v1/subscriptions/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interval,
      success_url: `${window.location.origin}/account/premium?checkout=success`,
      cancel_url: `${window.location.origin}/premium?checkout=cancelled`,
    }),
  });
  if (!res.ok) throw new Error(`Checkout failed (${res.status})`);
  return res.json();
}

export async function cancelSubscription(): Promise<{ message: string }> {
  const res = await fetch("/api/v1/subscriptions/cancel", { method: "POST" });
  if (!res.ok) throw new Error(`Cancel failed (${res.status})`);
  return res.json();
}

export async function fetchCMSPage(slug: string, lang?: string): Promise<CMSPage> {
  const params = lang && lang !== "en" ? `?lang=${lang}` : "";
  const url = `${apiBase}/api/v1/cms/pages/${slug}${params}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CMS ${res.status}: /cms/pages/${slug}`);
  return res.json() as Promise<CMSPage>;
}

// ---------------------------------------------------------------------------
// Trip planning (Step 39)
// ---------------------------------------------------------------------------

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  notes?: string | null;
}

export interface TripPlanOutput {
  trek_slug: string | null;
  trek_title: string;
  itinerary: ItineraryDay[];
  cost_estimate: string | null;
  gear_essentials: string[];
  permit_note: string | null;
  operator_suggestion: string | null;
  best_month: string | null;
  difficulty: string | null;
}

export interface TripPlan {
  id: string;
  session_id: string;
  user_id: string | null;
  inputs: Record<string, unknown>;
  output: TripPlanOutput | null;
  trek_slug: string | null;
  fallback_used: boolean;
  created_at: string;
}

export interface PlanGeneratePayload {
  session_id: string;
  region?: string | null;
  duration_days?: number | null;
  experience?: string | null;
  month?: string | null;
  budget_inr?: number | null;
  group_size?: string | null;
  email?: string | null;
}

export async function generatePlan(payload: PlanGeneratePayload): Promise<TripPlan> {
  const res = await fetch(`/api/v1/plan/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Plan generation failed (${res.status})`);
  return res.json();
}

export async function fetchPlan(planId: string): Promise<TripPlan> {
  return apiFetch<TripPlan>(`/plan/${planId}`);
}

export async function emailPlan(planId: string, email: string): Promise<void> {
  const res = await fetch(`/api/v1/plan/${planId}/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Email plan failed (${res.status})`);
}

export interface TranslateResult {
  source_slug: string;
  target_language: string;
  page_id: string | null;
  page_slug: string | null;
  message: string;
  fallback: boolean;
}

export async function triggerTranslation(slug: string, target_language: string): Promise<TranslateResult> {
  const res = await fetch(`/api/v1/admin/cms/${slug}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_language }),
  });
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`);
  return res.json() as Promise<TranslateResult>;
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
  quality?: number;
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
  logo_url: string | null;
  description_long: string | null;
  rating_avg: number;
  review_count: number;
  active: boolean;
  created_at: string;
  specializations: OperatorSpecialization[];
}

// Public view — no contact_email
export interface OperatorPublic {
  id: string;
  name: string;
  slug: string;
  region: string[] | null;
  trek_types: string[] | null;
  phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  description_long: string | null;
  rating_avg: number;
  review_count: number;
  active: boolean;
  created_at: string;
  specializations: OperatorSpecialization[];
}

export interface OperatorReview {
  id: string;
  operator_id: string;
  user_id: string | null;
  rating: number;
  body: string | null;
  created_at: string;
}

export interface OperatorAgreement {
  id: string;
  operator_id: string;
  lead_fee_inr: number;
  revenue_share_pct: number | null;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface InquiryPayload {
  name: string;
  email: string;
  phone?: string;
  trek_interest: string;
  message?: string;
  operator_slug?: string;
}

export interface OperatorCreate {
  name: string;
  slug: string;
  contact_email: string;
  region?: string[];
  trek_types?: string[];
  phone?: string;
  website_url?: string;
  logo_url?: string;
  description_long?: string;
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

// ---------------------------------------------------------------------------
// Public operator marketplace helpers (Step 38)
// ---------------------------------------------------------------------------

export async function fetchPublicOperators(region?: string): Promise<OperatorPublic[]> {
  const q = region ? `?region=${encodeURIComponent(region)}` : "";
  const url = `${apiBase}/api/v1/operators${q}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!res.ok) throw new Error(`Operators ${res.status}`);
  return res.json();
}

export async function fetchPublicOperator(slug: string): Promise<OperatorPublic> {
  const url = `${apiBase}/api/v1/operators/${slug}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!res.ok) throw new Error(`Operator ${res.status}: ${slug}`);
  return res.json();
}

export async function fetchOperatorReviews(slug: string): Promise<OperatorReview[]> {
  const url = `${apiBase}/api/v1/operators/${slug}/reviews`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!res.ok) throw new Error(`Reviews ${res.status}`);
  return res.json();
}

export async function submitReview(slug: string, payload: { rating: number; body?: string }): Promise<OperatorReview> {
  const res = await fetch(`/api/v1/operators/${slug}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Submit review failed (${res.status})`);
  return res.json();
}

export async function submitInquiry(payload: InquiryPayload): Promise<{ id: string; status: string }> {
  const res = await fetch(`/api/v1/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Inquiry failed (${res.status})`);
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

// ---------------------------------------------------------------------------
// Email Sequences (Step 31)
// ---------------------------------------------------------------------------

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  subject: string;
  delay_days: number;
  created_at: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  step_count: number;
  enrollment_count: number;
  steps?: EmailSequenceStep[];
}

export interface SeedSequencesResult {
  seeded: number;
  message: string;
}

export async function fetchEmailSequences(): Promise<EmailSequence[]> {
  const res = await fetch(`${apiBase}/api/v1/admin/email-sequences`);
  if (!res.ok) throw new Error(`API ${res.status}: fetch email sequences`);
  return res.json();
}

export async function fetchEmailSequence(id: string): Promise<EmailSequence> {
  const res = await fetch(`${apiBase}/api/v1/admin/email-sequences/${id}`);
  if (!res.ok) throw new Error(`API ${res.status}: fetch email sequence`);
  return res.json();
}

export async function seedEmailSequences(): Promise<SeedSequencesResult> {
  const res = await fetch(`${apiBase}/api/v1/admin/email-sequences/seed`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`API ${res.status}: seed email sequences`);
  return res.json();
}


// ---------------------------------------------------------------------------
// Revenue (Step 32)
// ---------------------------------------------------------------------------

export interface ClusterRevenueRow {
  cluster_id: string | null;
  cluster_name: string | null;
  total_revenue_inr: number;
  total_clicks: number;
  total_leads: number;
}

export interface PageTypeRevenueRow {
  page_type: string | null;
  total_revenue_inr: number;
  total_clicks: number;
  total_leads: number;
}

export interface DecayingPageRow {
  page_id: string | null;
  page_type: string | null;
  affiliate_clicks_last_7: number;
  affiliate_clicks_prev_7: number;
  decay_pct: number;
}

export interface RevenueConfig {
  id: string;
  key: string;
  value_float: number;
  updated_at: string;
}

export interface ExecutiveSummaryResponse {
  id: string;
  week_label: string;
  content_md: string;
  sent_at: string | null;
  created_at: string;
}

export async function fetchRevenueByCluster(): Promise<ClusterRevenueRow[]> {
  const res = await fetch(`${apiBase}/api/v1/admin/revenue/by-cluster`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchRevenueByPageType(): Promise<PageTypeRevenueRow[]> {
  const res = await fetch(`${apiBase}/api/v1/admin/revenue/by-page-type`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchDecayingPages(): Promise<DecayingPageRow[]> {
  const res = await fetch(`${apiBase}/api/v1/admin/revenue/decaying-pages`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function aggregateRevenue(days = 7): Promise<{ aggregated: number; period_start: string; period_end: string }> {
  const res = await fetch(`${apiBase}/api/v1/admin/revenue/aggregate?days=${days}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchRevenueConfig(): Promise<RevenueConfig[]> {
  const res = await fetch(`${apiBase}/api/v1/admin/revenue/config`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function patchRevenueConfig(key: string, value_float: number): Promise<RevenueConfig> {
  const res = await fetch(`${apiBase}/api/v1/admin/revenue/config/${key}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ value_float }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchExecutiveSummaries(): Promise<ExecutiveSummaryResponse[]> {
  const res = await fetch(`${apiBase}/api/v1/admin/revenue/summaries`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function triggerExecutiveSummary(): Promise<{ task_id: string; status: string }> {
  const res = await fetch(`${apiBase}/api/v1/admin/revenue/summaries/generate`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Account / Bookmarks / Alerts / Profile (Step 33)
// ---------------------------------------------------------------------------

export interface BookmarkResponse {
  id: string;
  user_id: string;
  cms_page_id: string | null;
  trek_slug: string | null;
  created_at: string;
  slug: string | null;
  title: string | null;
  page_type: string | null;
  hero_image_url: string | null;
}

export interface BookmarkCheckResponse {
  bookmarked: boolean;
  bookmark_id: string | null;
}

export interface DownloadResponse {
  id: string;
  user_id: string;
  product_id: string | null;
  filename: string;
  downloaded_at: string;
  order_id: string | null;
  download_url: string | null;
}

export interface TrekAlertResponse {
  id: string;
  user_id: string;
  trek_slug: string;
  alert_type: string;
  active: boolean;
  created_at: string;
}

export interface UserProfileResponse {
  id: string;
  user_id: string;
  fitness_level: string | null;
  trek_experience: string | null;
  preferred_regions: string[] | null;
  budget_range: string | null;
  submitted_at: string | null;
  updated_at: string;
}

export interface UserProfileUpdate {
  fitness_level?: string;
  trek_experience?: string;
  preferred_regions?: string[];
  budget_range?: string;
}

export async function fetchBookmarks(): Promise<BookmarkResponse[]> {
  const res = await fetch(`${apiBase}/api/v1/account/bookmarks`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function addBookmark(cms_page_id: string): Promise<BookmarkResponse> {
  const res = await fetch(`${apiBase}/api/v1/account/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ cms_page_id }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function removeBookmark(cms_page_id: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/v1/account/bookmarks/${cms_page_id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
}

export async function addBookmarkBySlug(
  trek_slug: string,
  title?: string,
  hero_image_url?: string,
): Promise<BookmarkResponse> {
  const res = await fetch(`${apiBase}/api/v1/account/bookmarks/by-slug`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ trek_slug, title, hero_image_url }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function removeBookmarkBySlug(trek_slug: string): Promise<void> {
  const res = await fetch(
    `${apiBase}/api/v1/account/bookmarks/by-slug/${encodeURIComponent(trek_slug)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
}

export async function checkBookmark(trek_slug: string): Promise<BookmarkCheckResponse> {
  const res = await fetch(
    `${apiBase}/api/v1/account/bookmarks/check/${encodeURIComponent(trek_slug)}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchDownloads(): Promise<DownloadResponse[]> {
  const res = await fetch(`${apiBase}/api/v1/account/downloads`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchAlerts(): Promise<TrekAlertResponse[]> {
  const res = await fetch(`${apiBase}/api/v1/account/alerts`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function addAlert(trek_slug: string, alert_type = "any"): Promise<TrekAlertResponse> {
  const res = await fetch(`${apiBase}/api/v1/account/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ trek_slug, alert_type }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function removeAlert(trek_slug: string, alert_type = "any"): Promise<void> {
  const res = await fetch(`${apiBase}/api/v1/account/alerts/${encodeURIComponent(trek_slug)}?alert_type=${alert_type}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
}

export async function fetchUserProfile(): Promise<UserProfileResponse> {
  const res = await fetch(`${apiBase}/api/v1/account/profile`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Digital Products + Checkout (Step 34)
// ---------------------------------------------------------------------------

export interface DigitalProduct {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_inr: number;
  file_path: string | null;
  preview_image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  sales_count: number;
}

export interface ProductCreate {
  slug: string;
  title: string;
  description?: string;
  price_inr: number;
  file_path?: string;
  preview_image_url?: string;
  active?: boolean;
}

export interface ProductPatch {
  title?: string;
  description?: string;
  price_inr?: number;
  file_path?: string;
  preview_image_url?: string;
  active?: boolean;
}

export interface UserOrder {
  id: string;
  user_id: string;
  product_id: string;
  provider_order_id: string;
  amount_inr: number;
  status: string;
  test_mode: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface CheckoutCreateResponse {
  order_id: string;
  provider_order_id: string;
  amount_inr: number;
  product_title: string;
  key_id: string | null;
  test_mode: boolean;
}

export interface CheckoutVerifyResponse {
  order_id: string;
  product_title: string;
  download_url: string;
  already_paid: boolean;
}

export async function fetchProducts(): Promise<DigitalProduct[]> {
  return apiFetch<DigitalProduct[]>("/products");
}

export async function fetchProduct(slug: string): Promise<DigitalProduct> {
  return apiFetch<DigitalProduct>(`/products/${slug}`);
}

export async function createCheckoutOrder(product_slug: string): Promise<CheckoutCreateResponse> {
  const res = await fetch(`${apiBase}/api/v1/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ product_slug }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Checkout failed (${res.status})`);
  }
  return res.json();
}

export async function verifyPayment(payload: {
  order_id: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}): Promise<CheckoutVerifyResponse> {
  const res = await fetch(`${apiBase}/api/v1/checkout/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Verify failed (${res.status})`);
  }
  return res.json();
}

export async function fetchAdminProducts(): Promise<DigitalProduct[]> {
  const res = await fetch(`${apiBase}/api/v1/admin/products`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function createAdminProduct(data: ProductCreate): Promise<DigitalProduct> {
  const res = await fetch(`${apiBase}/api/v1/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Create failed (${res.status})`);
  }
  return res.json();
}

export async function updateAdminProduct(id: string, data: ProductPatch): Promise<DigitalProduct> {
  const res = await fetch(`${apiBase}/api/v1/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Update failed (${res.status})`);
  }
  return res.json();
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/v1/admin/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
}

// --- Recommendations (Step 35) ---

export interface RecommendationItem {
  id: string;
  slug: string;
  title: string;
  page_type: string;
  hero_image_url: string | null;
  seo_description: string | null;
  published_at: string | null;
}

export interface SimilarPagesResponse {
  page_slug: string;
  items: RecommendationItem[];
}

export interface RecommendationsResponse {
  personalised: boolean;
  items: RecommendationItem[];
}

export async function fetchSimilarPages(slug: string, limit = 5): Promise<SimilarPagesResponse> {
  return apiFetch<SimilarPagesResponse>(`/pages/${slug}/similar?limit=${limit}`);
}

export async function fetchPersonalisedRecommendations(limit = 6): Promise<RecommendationsResponse> {
  return apiFetch<RecommendationsResponse>(`/account/recommendations?limit=${limit}`);
}

export async function fetchAnonymousRecommendations(limit = 6): Promise<RecommendationsResponse> {
  return apiFetch<RecommendationsResponse>(`/recommendations?limit=${limit}`);
}

export async function fetchAdminOrders(params?: { status?: string; limit?: number }): Promise<UserOrder[]> {
  const q = params
    ? "?" + new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )
    : "";
  const res = await fetch(`${apiBase}/api/v1/admin/orders${q}`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function upsertUserProfile(data: UserProfileUpdate): Promise<UserProfileResponse> {
  const res = await fetch(`${apiBase}/api/v1/account/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Step 36 — Intent & Monetization
// ---------------------------------------------------------------------------

export interface IntentResponse {
  session_id: string;
  intent: "research" | "booking_ready" | "inspiration" | "buyer";
  confidence: number;
  recommended_module: "affiliate" | "lead" | "newsletter" | "product";
  ab_variant?: string | null;
}

export interface AffiliateProduct {
  id: string;
  title: string;
  description: string | null;
  affiliate_url: string;
  affiliate_program: string | null;
  category: string[];
  price_range: string | null;
  active: boolean;
  created_at: string | null;
}

export interface MonetizationStats {
  intent_distribution: Record<string, number>;
  conversion_by_module: Record<string, number>;
  top_converting_pages: Array<{ page_slug: string; sessions: number }>;
  total_sessions: number;
  total_conversions: number;
}

export async function fetchIntent(slug: string, sessionId?: string): Promise<IntentResponse> {
  const params = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
  return apiFetch<IntentResponse>(`/intent/${slug}${params}`);
}

export async function trackConversion(slug: string, sessionId: string): Promise<void> {
  await fetch(`${apiBase}/api/v1/intent/${slug}/convert?session_id=${encodeURIComponent(sessionId)}`, {
    method: "POST",
    signal: AbortSignal.timeout(3000),
  });
}

export async function fetchPublicAffiliateProducts(limit = 10): Promise<AffiliateProduct[]> {
  return apiFetch<AffiliateProduct[]>(`/affiliate-products?limit=${limit}`);
}

export async function fetchMonetizationStats(): Promise<MonetizationStats> {
  const res = await fetch(`${apiBase}/api/v1/admin/monetization/stats`, {
    credentials: "include",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchAdminAffiliateProducts(): Promise<AffiliateProduct[]> {
  const res = await fetch(`${apiBase}/api/v1/admin/affiliate-products`, {
    credentials: "include",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function createAdminAffiliateProduct(data: Partial<AffiliateProduct>): Promise<AffiliateProduct> {
  const res = await fetch(`${apiBase}/api/v1/admin/affiliate-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function updateAdminAffiliateProduct(id: string, data: Partial<AffiliateProduct>): Promise<AffiliateProduct> {
  const res = await fetch(`${apiBase}/api/v1/admin/affiliate-products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function deleteAdminAffiliateProduct(id: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/v1/admin/affiliate-products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) throw new Error(`API ${res.status}`);
}

// ---------------------------------------------------------------------------
// Step 44 — Search analytics
// ---------------------------------------------------------------------------

export interface SearchLogPayload {
  query: string;
  results_count?: number;
  session_id?: string;
  clicked_slug?: string;
  clicked_page_type?: string;
}

export interface SearchSuggestion {
  slug: string;
  title: string;
  page_type: string;
  hero_image_url: string | null;
  seo_description: string | null;
}

/** Fire-and-forget: log a search query + optional click. Never throws. */
export async function logSearchEvent(payload: SearchLogPayload): Promise<void> {
  await fetch("/api/v1/search/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {}); // fire-and-forget — never block the UI
}

/** Fetch CMS-powered autocomplete suggestions across all page types. */
export async function fetchSearchSuggestions(q: string, limit = 6): Promise<SearchSuggestion[]> {
  if (q.length < 2) return [];
  const res = await fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

/** Fire-and-forget: record a public page view for popularity weighting. */
export async function trackPageView(pageSlug: string, pageType?: string, sessionId?: string): Promise<void> {
  await fetch("/api/v1/track/page-view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page_slug: pageSlug, page_type: pageType, session_id: sessionId }),
  }).catch(() => {});
}

export interface ComparisonItem {
  id: string;
  user_id: string;
  name: string;
  slugs: string[];
  created_at: string;
  updated_at: string;
}

/** Fetch saved comparisons for the current user. */
export async function fetchComparisons(): Promise<ComparisonItem[]> {
  const res = await fetch("/api/v1/account/comparisons", { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

/** Save a new comparison list. */
export async function saveComparison(name: string, slugs: string[]): Promise<ComparisonItem> {
  const res = await fetch("/api/v1/account/comparisons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, slugs }),
  });
  if (!res.ok) throw new Error("Failed to save comparison");
  return res.json();
}

/** Delete a saved comparison by ID. */
export async function deleteComparison(id: string): Promise<void> {
  await fetch(`/api/v1/account/comparisons/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}
