"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Target, Zap, Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MonetizationStats,
  AffiliateProduct,
  fetchMonetizationStats,
  fetchAdminAffiliateProducts,
  createAdminAffiliateProduct,
  deleteAdminAffiliateProduct,
} from "@/lib/api";

const INTENT_LABEL: Record<string, string> = {
  research: "Research",
  booking_ready: "Booking ready",
  inspiration: "Inspiration",
  buyer: "Buyer",
};

const MODULE_COLOR: Record<string, string> = {
  affiliate: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  lead: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  newsletter: "text-pine bg-pine/10 border border-pine/20",
  product: "text-purple-400 bg-purple-500/10 border border-purple-400/20",
};

const EMPTY_FORM = { title: "", affiliate_url: "", affiliate_program: "", description: "", price_range: "" };

export default function Monetization() {
  const [stats, setStats] = useState<MonetizationStats | null>(null);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchMonetizationStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
    fetchAdminAffiliateProducts().then(setProducts).catch(() => {});
  }, []);

  const kpis = stats
    ? [
        { label: "Total sessions", value: stats.total_sessions, icon: Target },
        { label: "Total conversions", value: stats.total_conversions, icon: Check },
        { label: "Intent types", value: Object.keys(stats.intent_distribution).length, icon: TrendingUp },
        { label: "Modules tracked", value: Object.keys(stats.conversion_by_module).length, icon: Zap },
      ]
    : [];

  async function handleCreate() {
    if (!form.title || !form.affiliate_url) return;
    setSaving(true);
    try {
      const created = await createAdminAffiliateProduct(form);
      setProducts((p) => [created, ...p]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setMsg("Product added.");
    } catch {
      setMsg("Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this affiliate product?")) return;
    try {
      await deleteAdminAffiliateProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch {
      setMsg("Delete failed.");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Monetization</h1>
          <p className="text-white/50 text-sm">Intent distribution, module conversion rates, and affiliate catalog.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button variant="hero" size="sm" className="w-fit" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add affiliate product
          </Button>
          {msg && <p className="text-xs text-white/50">{msg}</p>}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loadingStats
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#14161f] rounded-2xl border border-white/10 p-5 animate-pulse h-24" />
            ))
          : kpis.map((k) => (
              <div key={k.label} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
                <div className="bg-accent/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <k.icon className="h-4 w-4 text-accent" />
                </div>
                <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{k.value}</p>
                <p className="text-white/50 text-xs">{k.label}</p>
              </div>
            ))}
      </div>

      {/* Intent distribution + module conversion */}
      {stats && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Intent distribution</h2>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(stats.intent_distribution).length === 0 ? (
                <p className="text-white/30 text-xs">No sessions recorded yet.</p>
              ) : (
                Object.entries(stats.intent_distribution).map(([intent, count]) => {
                  const pct = stats.total_sessions > 0 ? Math.round((count / stats.total_sessions) * 100) : 0;
                  return (
                    <div key={intent} className="flex items-center gap-3">
                      <div className="w-24 text-white/60 text-xs">{INTENT_LABEL[intent] ?? intent}</div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-white/40 text-xs w-10 text-right">{count}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Conversion rate by module</h2>
            </div>
            <div className="divide-y divide-white/5">
              {Object.entries(stats.conversion_by_module).length === 0 ? (
                <p className="text-white/30 text-xs p-5">No conversion data yet.</p>
              ) : (
                Object.entries(stats.conversion_by_module).map(([module, rate]) => (
                  <div key={module} className="flex items-center justify-between px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${MODULE_COLOR[module] ?? "text-white/40 bg-white/5"}`}>
                      {module}
                    </span>
                    <span className="text-white/70 text-sm font-semibold">{(rate * 100).toFixed(1)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top converting pages */}
      {stats && stats.top_converting_pages.length > 0 && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden mb-8">
          <div className="px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Top pages by sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3 text-white/40 font-medium text-xs">Page slug</th>
                  <th className="text-left px-5 py-3 text-white/40 font-medium text-xs">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_converting_pages.map((p) => (
                  <tr key={p.page_slug} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 text-white/80 font-mono text-xs">{p.page_slug}</td>
                    <td className="px-5 py-3.5 text-white/50 text-xs">{p.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add affiliate product form */}
      {showForm && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
          <h2 className="text-white font-semibold text-sm mb-4">New affiliate product</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { key: "title", label: "Title *" },
              { key: "affiliate_url", label: "Affiliate URL *" },
              { key: "affiliate_program", label: "Program (e.g. Amazon)" },
              { key: "price_range", label: "Price range" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-white/40 mb-1 block">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-xs text-white/40 mb-1 block">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="hero" size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 text-white/60" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Affiliate product catalog */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Affiliate catalog</h2>
          <span className="text-white/30 text-xs">{products.length} products</span>
        </div>
        {products.length === 0 ? (
          <p className="text-white/30 text-xs p-5">No affiliate products yet. Add one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/8">
                  {["Title", "Program", "Price range", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5 text-white/80 text-xs font-medium">{p.title}</td>
                    <td className="px-4 py-3.5 text-white/50 text-xs">{p.affiliate_program ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/50 text-xs">{p.price_range ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.active ? "text-pine bg-pine/10 border border-pine/20" : "text-white/30 bg-white/5 border border-white/10"}`}>
                        {p.active ? "active" : "paused"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => handleDelete(p.id)} className="text-red-400/60 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
