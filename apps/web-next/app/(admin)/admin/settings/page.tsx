"use client";

import { useState } from "react";
import { Settings, Key, Globe, Bell, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-6 mb-5">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="text-white font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, defaultValue, type = "text", mono = false }: { label: string; defaultValue: string; type?: string; mono?: boolean }) {
  return (
    <div className="mb-4">
      <label className="text-white/40 text-xs mb-1.5 block">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className={`w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white/80 focus:border-accent outline-none text-sm ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function Toggle({ label, sub, defaultChecked }: { label: string; sub: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/8 last:border-0">
      <div>
        <p className="text-white/80 text-sm">{label}</p>
        <p className="text-white/40 text-xs">{sub}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-accent" : "bg-white/20"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export default function AdminSettings() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Settings</h1>
        <p className="text-white/50 text-sm">Pipeline configuration and API keys.</p>
      </div>

      <Section icon={Bot} title="AI Pipeline">
        <Toggle label="Auto-generate briefs" sub="Automatically create briefs for new discovered topics" defaultChecked />
        <Toggle label="Auto-draft on brief approval" sub="Trigger ContentWriter agent when a brief is approved" />
        <Toggle label="Auto fact-check drafts" sub="Run FactChecker after each draft is generated" defaultChecked />
        <Toggle label="Auto-suggest internal links" sub="Run LinkSuggestor when an article is published" defaultChecked />
      </Section>

      <Section icon={Key} title="API Keys">
        <Field label="OpenAI API Key" defaultValue="sk-●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●" type="password" mono />
        <Field label="Google Search Console Client ID" defaultValue="●●●●●●●●.apps.googleusercontent.com" mono />
        <Field label="Ahrefs API Key" defaultValue="ahrefs_●●●●●●●●●●●●●●●●" type="password" mono />
        <Button variant="hero" size="sm">Save API keys</Button>
      </Section>

      <Section icon={Globe} title="Site">
        <Field label="Site URL" defaultValue="https://trekyatra.com" />
        <Field label="Site name" defaultValue="TrekYatra" />
        <Field label="Default author" defaultValue="TrekYatra Editorial" />
        <Button variant="hero" size="sm">Save site settings</Button>
      </Section>

      <Section icon={Bell} title="Alerts">
        <Toggle label="Pipeline error alerts" sub="Email when an agent errors out" defaultChecked />
        <Toggle label="Weekly performance digest" sub="Summary email every Monday morning" defaultChecked />
        <Toggle label="New high-opportunity topic" sub="Notify when a topic scores above 90" />
      </Section>
    </div>
  );
}
