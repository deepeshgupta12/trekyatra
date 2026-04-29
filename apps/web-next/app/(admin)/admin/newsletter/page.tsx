"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Send, RefreshCw, Copy, Instagram, Twitter, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchNewsletterCampaigns,
  generateNewsletter,
  sendNewsletterCampaign,
  fetchSocialSnippets,
  repurposePage,
  type NewsletterCampaign,
  type SocialSnippet,
} from "@/lib/api";

// ── Status badge ─────────────────────────────────────────────────────────────

const campaignStatusStyle: Record<string, string> = {
  draft: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  sent:  "text-pine bg-pine/10 border border-pine/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${campaignStatusStyle[status] ?? "text-white/40 bg-white/5 border border-white/10"}`}>
      {status}
    </span>
  );
}

// ── Platform icon ─────────────────────────────────────────────────────────────

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "instagram") return <Instagram className="h-3.5 w-3.5 text-pink-400" />;
  if (platform === "twitter") return <Twitter className="h-3.5 w-3.5 text-blue-400" />;
  return <Mail className="h-3.5 w-3.5 text-amber-400" />;
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({ campaign, onClose }: { campaign: NewsletterCampaign; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-[#14161f] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <div>
            <p className="text-white font-semibold text-sm">{campaign.subject}</p>
            <p className="text-white/40 text-xs mt-0.5">{campaign.week_label}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xs px-2 py-1 border border-white/10 rounded-lg">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <iframe
            srcDoc={campaign.body_html}
            title="Newsletter preview"
            className="w-full min-h-[500px] bg-white"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

// ── Repurpose form ─────────────────────────────────────────────────────────────

function RepurposeForm({ onDone }: { onDone: () => void }) {
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRepurpose() {
    if (!slug.trim()) return;
    setLoading(true);
    setMsg(null);
    setError(null);
    try {
      const result = await repurposePage(slug.trim());
      setMsg(`${result.snippets_created} snippets generated for /${slug}`);
      setSlug("");
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Repurpose failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
      <h2 className="text-white font-semibold text-sm mb-3">Generate Social Snippets</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Page slug (e.g. kedarkantha-trek-guide)"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-accent/40"
        />
        <Button
          variant="hero"
          size="sm"
          onClick={handleRepurpose}
          disabled={loading || !slug.trim()}
          className="w-full sm:w-auto shrink-0"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Repurpose</span>
        </Button>
      </div>
      {msg && <p className="text-pine text-xs mt-2">{msg}</p>}
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "campaigns" | "snippets";

export default function NewsletterPage() {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [snippets, setSnippets] = useState<SocialSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<NewsletterCampaign | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      setCampaigns(await fetchNewsletterCampaigns({ limit: 50 }));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSnippets = useCallback(async () => {
    setLoading(true);
    try {
      setSnippets(await fetchSocialSnippets({ limit: 100 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "campaigns") loadCampaigns();
    else loadSnippets();
  }, [tab, loadCampaigns, loadSnippets]);

  async function handleGenerate() {
    setGenerating(true);
    setFeedback(null);
    setError(null);
    try {
      const result = await generateNewsletter();
      setFeedback(`Draft created — ${result.week_label}: "${result.subject}"`);
      loadCampaigns();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend(id: string) {
    setSendingId(id);
    setFeedback(null);
    setError(null);
    try {
      const result = await sendNewsletterCampaign(id);
      setFeedback(result.message);
      loadCampaigns();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSendingId(null);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Newsletter</h1>
          <p className="text-white/50 text-sm">Generate weekly digest campaigns and social repurposing snippets.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {tab === "campaigns" && (
            <Button variant="hero" size="sm" onClick={handleGenerate} disabled={generating} className="w-fit">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Mail className="h-3.5 w-3.5 mr-1.5" />}
              Generate This Week
            </Button>
          )}
          {feedback && (
            <p className="text-pine text-xs flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{feedback}
            </p>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white/3 rounded-xl p-1 w-fit">
        {(["campaigns", "snippets"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {t === "campaigns" ? "Campaigns" : "Social Snippets"}
          </button>
        ))}
      </div>

      {/* Campaigns tab */}
      {tab === "campaigns" && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Newsletter Campaigns</h2>
            <span className="text-white/30 text-xs">{campaigns.length} total</span>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-white/30 text-sm text-center">Loading…</div>
          ) : campaigns.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Mail className="h-8 w-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No campaigns yet. Click "Generate This Week" to create the first draft.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Week</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Subject</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Sent at</th>
                    <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3.5 text-white/60 text-xs font-mono">{c.week_label}</td>
                      <td className="px-4 py-3.5 text-white/80 text-sm max-w-[280px]">
                        <p className="truncate">{c.subject}</p>
                        {c.preview_text && (
                          <p className="text-white/30 text-xs truncate mt-0.5">{c.preview_text}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3.5 text-white/40 text-xs hidden md:table-cell">
                        {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreview(c)}
                            className="text-accent text-xs hover:underline"
                          >
                            Preview
                          </button>
                          {c.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-pine/30 text-pine hover:text-pine/80 text-xs px-3 py-1 h-auto"
                              onClick={() => handleSend(c.id)}
                              disabled={sendingId === c.id}
                            >
                              {sendingId === c.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3 mr-1" />
                              )}
                              Send
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Snippets tab */}
      {tab === "snippets" && (
        <div className="space-y-4">
          <RepurposeForm onDone={loadSnippets} />

          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Social Snippets</h2>
              <span className="text-white/30 text-xs">{snippets.length} total</span>
            </div>
            {loading ? (
              <div className="px-5 py-8 text-white/30 text-sm text-center">Loading…</div>
            ) : snippets.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Instagram className="h-8 w-8 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No snippets yet. Enter a page slug above to generate social copy.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {snippets.map((s) => (
                  <div key={s.id} className="px-5 py-4 hover:bg-white/2 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 mb-2">
                        <PlatformIcon platform={s.platform} />
                        <span className="text-xs font-medium text-white/60 capitalize">{s.platform}</span>
                        {s.copy_title && (
                          <span className="text-white/30 text-xs">— {s.copy_title}</span>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(s.copy, s.id)}
                        className="text-white/20 hover:text-white/60 transition-colors shrink-0"
                        aria-label="Copy snippet"
                      >
                        {copied === s.id ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-pine" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{s.copy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && <PreviewModal campaign={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
