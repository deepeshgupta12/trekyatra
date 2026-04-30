"use client";

import { useEffect, useState } from "react";
import { Mail, ChevronDown, ChevronRight, RefreshCw, Layers, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmailSequence,
  fetchEmailSequences,
  fetchEmailSequence,
  seedEmailSequences,
} from "@/lib/api";

const statusStyle: Record<string, string> = {
  active: "text-pine bg-pine/10 border border-pine/20",
  completed: "text-white/40 bg-white/5 border border-white/10",
  paused: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
};

export default function EmailSequencesPage() {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [stepDetails, setStepDetails] = useState<Record<string, EmailSequence>>({});

  async function load() {
    setLoading(true);
    try {
      const data = await fetchEmailSequences();
      setSequences(data);
    } catch {
      // pass
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSeed() {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const result = await seedEmailSequences();
      setSeedMsg(result.seeded > 0 ? `Seeded ${result.seeded} sequence(s).` : "All sequences already exist.");
      await load();
    } catch {
      setSeedMsg("Seed failed — check backend logs.");
    } finally {
      setSeeding(false);
    }
  }

  async function toggleExpand(seqId: string) {
    const next = new Set(expanded);
    if (next.has(seqId)) {
      next.delete(seqId);
    } else {
      next.add(seqId);
      if (!stepDetails[seqId]) {
        try {
          const detail = await fetchEmailSequence(seqId);
          setStepDetails((prev) => ({ ...prev, [seqId]: detail }));
        } catch {
          // pass
        }
      }
    }
    setExpanded(next);
  }

  const totalEnrollments = sequences.reduce((s, seq) => s + seq.enrollment_count, 0);
  const totalSteps = sequences.reduce((s, seq) => s + seq.step_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Email Sequences</h1>
          <p className="text-white/50 text-sm">Automated nurture flows for newsletter subscribers.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button variant="hero" size="sm" className="w-fit" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Seeding..." : "Seed Default Sequences"}
          </Button>
          {seedMsg && <p className="text-xs text-white/50">{seedMsg}</p>}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: Layers, label: "Sequences", value: sequences.length },
          { icon: Clock, label: "Total Steps", value: totalSteps },
          { icon: Users, label: "Enrollments", value: totalEnrollments },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <div className="bg-accent/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{value}</p>
            <p className="text-white/50 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Sequences list */}
      {loading ? (
        <div className="text-white/40 text-sm py-12 text-center">Loading sequences…</div>
      ) : sequences.length === 0 ? (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-8 text-center">
          <Mail className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm mb-4">No sequences yet. Seed the defaults to get started.</p>
          <Button variant="hero" size="sm" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Seeding…" : "Seed Default Sequences"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => {
            const isOpen = expanded.has(seq.id);
            const detail = stepDetails[seq.id];
            return (
              <div key={seq.id} className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
                {/* Sequence header row */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors text-left"
                  onClick={() => toggleExpand(seq.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{seq.name}</p>
                      <p className="text-white/40 text-xs truncate">{seq.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-white/40">
                      <span>{seq.step_count} step{seq.step_count !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{seq.enrollment_count} enrolled</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-white/30" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-white/30" />
                    )}
                  </div>
                </button>

                {/* Steps panel */}
                {isOpen && (
                  <div className="border-t border-white/8">
                    {!detail ? (
                      <div className="px-5 py-4 text-white/40 text-sm">Loading steps…</div>
                    ) : detail.steps && detail.steps.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {detail.steps.map((step) => (
                          <div key={step.id} className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <span className="text-accent font-mono text-xs bg-accent/10 border border-accent/20 rounded-md px-2 py-1 flex-shrink-0">
                                Step {step.step_number}
                              </span>
                              <div className="min-w-0">
                                <p className="text-white/80 text-sm font-medium">{step.subject}</p>
                                <p className="text-white/40 text-xs mt-1">
                                  Sent {step.delay_days === 0 ? "immediately" : `${step.delay_days} day${step.delay_days !== 1 ? "s" : ""} after previous`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-white/40 text-sm">No steps defined.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
        <h2 className="text-white font-semibold text-sm mb-3">How it works</h2>
        <ul className="space-y-2 text-white/50 text-xs">
          <li>• Welcome email fires automatically when a user signs up (requires SMTP config)</li>
          <li>• Trek interest tagging happens when a lead form is submitted by a known subscriber</li>
          <li>• Tag match: "winter" → Winter Trek Nurture · "monsoon" → Monsoon Prep · others → General Trek Discovery</li>
          <li>• Nurture steps are processed daily by the Celery Beat scheduler</li>
          <li>• Subscribers can update preferences or unsubscribe via token-signed links in emails</li>
        </ul>
      </div>
    </div>
  );
}
