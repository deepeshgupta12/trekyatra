"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebhookRule {
  id: string;
  name?: string;
  trigger_event: string;
  condition?: Record<string, unknown>;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
}

const EVENT_NAMES = [
  "plan_wizard_completed", "lead_submitted", "user_signed_up", "trek_view",
  "trek_saved", "trek_plan_cta_clicked", "newsletter_subscribed", "page_view",
];

export default function WebhooksPage() {
  const [rules, setRules] = useState<WebhookRule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEvent, setFormEvent] = useState("plan_wizard_completed");
  const [formUrl, setFormUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchRules = () => {
    fetch("/api/v1/admin/cdp/webhooks", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { rules: WebhookRule[]; total: number }) => {
        setRules(d.rules ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  const handleCreate = () => {
    if (!formUrl.trim()) { alert("Webhook URL is required."); return; }
    setSaving(true);
    fetch("/api/v1/admin/cdp/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: formName || undefined, trigger_event: formEvent, webhook_url: formUrl }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        setShowForm(false);
        setFormName(""); setFormEvent("plan_wizard_completed"); setFormUrl("");
        fetchRules();
        setSaving(false);
      })
      .catch(() => setSaving(false));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this webhook rule?")) return;
    setDeleteId(id);
    fetch(`/api/v1/admin/cdp/webhooks/${id}`, { method: "DELETE", credentials: "include" })
      .then(() => { fetchRules(); setDeleteId(null); })
      .catch(() => setDeleteId(null));
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white mb-1">Webhook Rules</h1>
            <p className="text-white/50 text-sm">Trigger outbound HTTP webhooks on CDP events.</p>
          </div>
          <Button variant="hero" size="sm" onClick={() => setShowForm(!showForm)} className="w-fit">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Rule
          </Button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
            <h2 className="text-white font-semibold text-sm mb-4">New Webhook Rule</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Rule name (optional)</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Plan Completion Hook"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Trigger event *</label>
                <select
                  value={formEvent}
                  onChange={(e) => setFormEvent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {EVENT_NAMES.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Webhook URL *</label>
                <input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://hooks.example.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="hero" size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? "Saving…" : "Create Rule"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}
                className="border-white/20 text-white/60 hover:text-white">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Rules list */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8">
            <Webhook className="h-4 w-4 text-pine" />
            <h2 className="text-white font-semibold text-sm">{total} active rules</h2>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
          ) : rules.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-white/30 text-sm mb-2">No webhook rules configured.</p>
              <p className="text-white/20 text-xs">Create a rule to fire outbound HTTP calls when users complete key events.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {rules.map((rule) => (
                <div key={rule.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-white/3 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {rule.name && (
                        <span className="text-white font-medium text-sm">{rule.name}</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded border text-pine bg-pine/10 border-pine/20">
                        {rule.trigger_event}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${rule.is_active ? "text-pine bg-pine/10 border-pine/20" : "text-white/30 bg-white/5 border-white/10"}`}>
                        {rule.is_active ? "active" : "inactive"}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs truncate">{rule.webhook_url}</p>
                    <p className="text-white/20 text-xs mt-0.5">{new Date(rule.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={deleteId === rule.id}
                    className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-30 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
