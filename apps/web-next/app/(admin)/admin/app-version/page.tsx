"use client";

import { useCallback, useEffect, useState } from "react";
import { Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchAppVersionConfig,
  updateAppVersionConfig,
  type AppVersionConfig,
} from "@/lib/admin-app-version";

const FIELD =
  "w-full bg-[#0c0e14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none";
const LABEL = "text-xs text-white/50 font-medium mb-1.5 block";

export default function AppVersionPage() {
  const [cfg, setCfg] = useState<AppVersionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCfg(await fetchAppVersionConfig("ios"));
    } catch {
      setMsg("Failed to load config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof AppVersionConfig>(key: K, value: AppVersionConfig[K]) {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);
    setMsg(null);
    try {
      const saved = await updateAppVersionConfig(
        {
          min_supported_version: cfg.min_supported_version,
          latest_version: cfg.latest_version,
          force_update_enabled: cfg.force_update_enabled,
          update_message: cfg.update_message,
          store_url: cfg.store_url,
          maintenance_mode: cfg.maintenance_mode,
          maintenance_message: cfg.maintenance_message,
        },
        "ios"
      );
      setCfg(saved);
      setMsg("Saved ✓");
    } catch {
      setMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-accent" /> App Version Gate — iOS
          </h1>
          <p className="text-white/50 text-sm">
            Force / soft update and maintenance kill-switch. Applies live — no app release needed.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button variant="hero" size="sm" className="w-fit" onClick={save} disabled={saving || !cfg}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {msg && <span className="text-xs text-white/60">{msg}</span>}
        </div>
      </div>

      {loading || !cfg ? (
        <div className="text-white/40 text-sm">Loading…</div>
      ) : (
        <div className="space-y-4">
          {cfg.maintenance_mode && (
            <div className="flex items-center gap-2 bg-red-400/10 border border-red-400/20 text-red-400 text-sm rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4" /> Maintenance mode is ON — all users are blocked.
            </div>
          )}

          <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm">Version gating</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Minimum supported version (force update below)</label>
                <input className={FIELD} value={cfg.min_supported_version} onChange={(e) => set("min_supported_version", e.target.value)} placeholder="1.0.0" />
              </div>
              <div>
                <label className={LABEL}>Latest version (soft prompt below)</label>
                <input className={FIELD} value={cfg.latest_version} onChange={(e) => set("latest_version", e.target.value)} placeholder="1.0.0" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={cfg.force_update_enabled} onChange={(e) => set("force_update_enabled", e.target.checked)} />
              Enable force update (hard-block below minimum version)
            </label>
            <div>
              <label className={LABEL}>Update message (shown in the prompt)</label>
              <textarea className={FIELD} rows={2} value={cfg.update_message ?? ""} onChange={(e) => set("update_message", e.target.value)} placeholder="A new version is available with the latest treks and fixes." />
            </div>
            <div>
              <label className={LABEL}>App Store URL</label>
              <input className={FIELD} value={cfg.store_url ?? ""} onChange={(e) => set("store_url", e.target.value)} placeholder="https://apps.apple.com/app/id6795408094" />
            </div>
          </div>

          <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm">Maintenance kill-switch</h2>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={cfg.maintenance_mode} onChange={(e) => set("maintenance_mode", e.target.checked)} />
              Maintenance mode — show a blocking screen to all users
            </label>
            <div>
              <label className={LABEL}>Maintenance message</label>
              <textarea className={FIELD} rows={2} value={cfg.maintenance_message ?? ""} onChange={(e) => set("maintenance_message", e.target.value)} placeholder="TrekYatra is briefly unavailable while we make improvements." />
            </div>
          </div>

          {cfg.updated_at && (
            <p className="text-white/30 text-xs">Last updated {new Date(cfg.updated_at).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
