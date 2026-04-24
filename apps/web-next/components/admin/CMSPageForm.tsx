"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Globe, RefreshCw, Plus, Trash2 } from "lucide-react";
import {
  createCMSPage, updateCMSPage, reparseCMSSections,
  type CMSPage, type CMSPagePayload, type TrekContentSections, type TrekFacts, type FAQItem,
} from "@/lib/api";

const PAGE_TYPES = [
  { value: "trek_guide", label: "Trek Guide" },
  { value: "packing_list", label: "Packing List" },
  { value: "seasonal", label: "Seasonal / Best Time" },
  { value: "comparison", label: "Comparison" },
  { value: "permit_guide", label: "Permit Guide" },
  { value: "beginner_roundup", label: "Beginner Roundup" },
  { value: "region_listing", label: "Region / Category" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
];

// Sections except faqs — faqs has its own dedicated Q&A editor
const SECTION_FIELDS: { key: keyof TrekContentSections; label: string; hint: string; rows: number }[] = [
  { key: "why_this_trek", label: "Why this trek", hint: "Intro paragraph — why this trek stands out.", rows: 5 },
  { key: "route_overview", label: "Route overview", hint: "High-level route summary, distance, elevation gain.", rows: 4 },
  { key: "itinerary", label: "Day-wise itinerary", hint: "Use markdown: **Day 1** – description", rows: 8 },
  { key: "best_time", label: "Best time to visit", hint: "Season-by-season breakdown.", rows: 5 },
  { key: "difficulty", label: "Difficulty & fitness", hint: "Who can do this trek, fitness requirements.", rows: 4 },
  { key: "permits", label: "Permits", hint: "Required permits, how to get them, cost.", rows: 4 },
  { key: "cost_estimate", label: "Cost estimate", hint: "Budget / mid / premium tiers.", rows: 4 },
  { key: "packing", label: "Packing & gear", hint: "Essential gear list. Use - bullet format.", rows: 5 },
  { key: "safety", label: "Safety tips", hint: "Key safety advice and emergency info.", rows: 5 },
];

interface Props {
  mode: "create" | "edit";
  existing?: CMSPage;
}

export default function CMSPageForm({ mode, existing }: Props) {
  const router = useRouter();
  const s = existing?.content_json?.sections ?? {};
  const tf = (existing?.content_json?.trek_facts ?? {}) as TrekFacts;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [pageType, setPageType] = useState(existing?.page_type ?? "trek_guide");
  const [status, setStatus] = useState(existing?.status ?? "draft");
  const [seoTitle, setSeoTitle] = useState(existing?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(existing?.seo_description ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(existing?.hero_image_url ?? "");
  const [trekFacts, setTrekFacts] = useState<TrekFacts>({
    duration: tf.duration ?? "",
    altitude: tf.altitude ?? "",
    difficulty: tf.difficulty ?? "",
    season: tf.season ?? "",
    permits: tf.permits ?? "",
    base: tf.base ?? "",
  });
  const [sections, setSections] = useState<Record<string, string>>(
    Object.fromEntries(SECTION_FIELDS.map((f) => [f.key, (s as Record<string, string>)[f.key] ?? ""]))
  );
  // Structured FAQs — each item has a question and HTML answer
  const [faqs, setFaqs] = useState<FAQItem[]>(
    existing?.content_json?.faqs ?? []
  );

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function autoSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    if (mode === "create") setSlug(autoSlug(v));
  }

  function addFaq() {
    setFaqs(prev => [...prev, { q: "", a: "" }]);
  }

  function removeFaq(i: number) {
    setFaqs(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateFaq(i: number, field: "q" | "a", value: string) {
    setFaqs(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function buildPayload(overrideStatus?: string): CMSPagePayload {
    const nonEmptySections = Object.fromEntries(
      Object.entries(sections).filter(([, v]) => v.trim() !== "")
    ) as TrekContentSections;
    const nonEmptyFacts = Object.fromEntries(
      Object.entries(trekFacts).filter(([, v]) => (v ?? "").trim() !== "")
    ) as TrekFacts;
    const validFaqs = faqs.filter(f => f.q.trim() !== "");
    const hasFacts = Object.keys(nonEmptyFacts).length > 0;
    const hasSections = Object.keys(nonEmptySections).length > 0;
    const hasFaqs = validFaqs.length > 0;
    return {
      title: title.trim(),
      slug: slug.trim(),
      page_type: pageType,
      status: overrideStatus ?? status,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDesc.trim() || null,
      hero_image_url: heroImageUrl.trim() || null,
      content_json: (hasSections || hasFacts || hasFaqs)
        ? {
            sections: hasSections ? nonEmptySections : undefined,
            trek_facts: hasFacts ? nonEmptyFacts : undefined,
            faqs: hasFaqs ? validFaqs : undefined,
          }
        : null,
    };
  }

  async function reparseFromDraft() {
    if (!existing?.slug) return;
    setError(null);
    setSuccess(null);
    setReparsing(true);
    try {
      const updated = await reparseCMSSections(existing.slug);
      const newSections = (updated.content_json?.sections ?? {}) as Record<string, string>;
      setSections(Object.fromEntries(
        SECTION_FIELDS.map((f) => [f.key, newSections[f.key] ?? sections[f.key] ?? ""])
      ));
      // Update FAQs if the re-parse returned structured items
      const newFaqs = updated.content_json?.faqs ?? [];
      if (newFaqs.length > 0) setFaqs(newFaqs);
      setSuccess("Sections and FAQs re-parsed from draft. Review and save.");
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reparse failed.");
    } finally {
      setReparsing(false);
    }
  }

  async function save(overrideStatus?: string) {
    setError(null);
    setSuccess(null);
    const isSaving = !overrideStatus;
    if (isSaving) setSaving(true); else setPublishing(true);
    try {
      const payload = buildPayload(overrideStatus);
      if (mode === "create") {
        const page = await createCMSPage(payload as Parameters<typeof createCMSPage>[0]);
        router.push(`/admin/cms/${page.slug}/edit`);
      } else {
        await updateCMSPage(existing!.slug, payload);
        if (overrideStatus === "published") {
          await Promise.all([
            fetch("/api/v1/cms/cache/invalidate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: existing!.slug }) }),
            fetch("/api/revalidate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: existing!.slug }) }),
          ]);
        }
        setStatus(overrideStatus ?? status);
        setSuccess(overrideStatus === "published" ? "Published and cache cleared." : "Saved.");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }

  const inputCls = "w-full bg-[#0c0e14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50";
  const labelCls = "block text-xs text-white/50 font-medium mb-1.5";

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm">Page details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input className={inputCls} value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Triund Trek: Complete Guide" />
          </div>
          <div>
            <label className={labelCls}>Slug *</label>
            <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="triund-trek" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Page type</label>
            <select className={inputCls} value={pageType} onChange={(e) => setPageType(e.target.value)}>
              {PAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm">SEO meta</h2>
        <div>
          <label className={labelCls}>SEO title</label>
          <input className={inputCls} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Triund Trek Guide 2025 — Routes, Permits & Tips" />
        </div>
        <div>
          <label className={labelCls}>SEO description</label>
          <textarea className={inputCls} rows={3} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="Plan your Triund trek with our complete guide..." />
        </div>
      </div>

      {/* Hero image */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm">Hero image</h2>
        <div>
          <label className={labelCls}>Hero image URL</label>
          <input className={inputCls} value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="https://cdn.example.com/hero.jpg" />
          <p className="text-white/25 text-xs mt-1">Full URL to the hero image shown at the top of the trek page.</p>
        </div>
        {heroImageUrl && (
          <img src={heroImageUrl} alt="Hero preview" className="w-full max-h-40 object-cover rounded-xl opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
      </div>

      {/* Trek facts strip */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm">Trek facts strip</h2>
        <p className="text-white/40 text-xs -mt-2">Shown in the sticky facts bar and info strip on the public page.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {(["duration", "altitude", "difficulty", "season", "permits", "base"] as (keyof TrekFacts)[]).map((key) => (
            <div key={key}>
              <label className={labelCls}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
              <input
                className={inputCls}
                value={trekFacts[key] ?? ""}
                onChange={(e) => setTrekFacts((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={key === "duration" ? "6 days" : key === "altitude" ? "12,500 ft" : key === "difficulty" ? "Moderate" : key === "season" ? "Dec – Apr" : key === "permits" ? "Required" : "Sankri"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Content sections</h2>
          <p className="text-white/40 text-xs mt-0.5">Markdown supported. Each section maps to a named block on the public page.</p>
        </div>
        <div className="p-5 space-y-6">
          {SECTION_FIELDS.map((f) => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <p className="text-white/30 text-xs mb-1.5">{f.hint}</p>
              <textarea
                className={inputCls}
                rows={f.rows}
                value={sections[f.key] ?? ""}
                onChange={(e) => setSections((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={`Write ${f.label.toLowerCase()} content here…`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* FAQ editor — structured Q&A pairs */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <div>
            <h2 className="text-white font-semibold text-sm">FAQs</h2>
            <p className="text-white/40 text-xs mt-0.5">Each question–answer pair renders as an accordion on the public page.</p>
          </div>
          <button
            type="button"
            onClick={addFaq}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-medium border border-accent/30 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add FAQ
          </button>
        </div>
        <div className="p-5 space-y-4">
          {faqs.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">No FAQs yet. Click "Add FAQ" or use "Re-parse sections" to auto-extract from the draft.</p>
          )}
          {faqs.map((item, i) => (
            <div key={i} className="bg-[#0c0e14] border border-white/8 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-white/40 font-medium pt-1">FAQ {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFaq(i)}
                  className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div>
                <label className={labelCls}>Question</label>
                <input
                  className={inputCls}
                  value={item.q}
                  onChange={(e) => updateFaq(i, "q", e.target.value)}
                  placeholder="What permits are required for this trek?"
                />
              </div>
              <div>
                <label className={labelCls}>Answer <span className="text-white/25">(HTML from auto-parse, or plain text)</span></label>
                <textarea
                  className={inputCls}
                  rows={4}
                  value={item.a}
                  onChange={(e) => updateFaq(i, "a", e.target.value)}
                  placeholder="A Forest Department permit is required. Obtain it at the ranger station before the trailhead."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Button variant="hero" size="sm" onClick={() => save()} disabled={saving || publishing || reparsing || !title || !slug}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === "create" ? "Create page" : "Save changes"}
        </Button>
        {mode === "edit" && existing?.status !== "published" && (
          <Button variant="outline" size="sm" className="border-pine/40 text-pine hover:text-white" onClick={() => save("published")} disabled={saving || publishing || reparsing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Publish
          </Button>
        )}
        {mode === "edit" && existing?.status === "published" && (
          <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white" onClick={() => save("published")} disabled={saving || publishing || reparsing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Save &amp; re-publish
          </Button>
        )}
        {mode === "edit" && existing?.brief_id && (
          <Button variant="outline" size="sm" className="border-white/10 text-white/50 hover:text-white" onClick={reparseFromDraft} disabled={saving || publishing || reparsing}>
            {reparsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-parse sections
          </Button>
        )}
        {error && <span className="text-red-400 text-xs">{error}</span>}
        {success && <span className="text-pine text-xs">{success}</span>}
      </div>
    </div>
  );
}
