"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, AlertCircle, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchAdminLeads,
  patchLeadStatus,
  assignLeadOperator,
  fetchOperators,
  AdminLead,
  Operator,
} from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  routed: "text-purple-400 bg-purple-500/10 border border-purple-400/20",
  contacted: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  converted: "text-pine bg-pine/10 border border-pine/20",
  lost: "text-red-400 bg-red-400/10 border border-red-400/20",
  archived: "text-white/40 bg-white/5 border border-white/10",
};

const NEXT_STATUS: Record<string, string> = {
  new: "contacted",
  routed: "contacted",
  contacted: "converted",
  converted: "archived",
};

const ALL_STATUSES = ["new", "routed", "contacted", "converted", "lost", "archived"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [patching, setPatching] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [assigning, setAssigning] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsData, opsData] = await Promise.all([
        fetchAdminLeads({ limit: 100, status: statusFilter || undefined }),
        fetchOperators(),
      ]);
      setLeads(leadsData);
      setOperators(opsData);
    } catch {
      setError("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(lead: AdminLead, next: string) {
    setPatching(lead.id);
    try {
      const updated = await patchLeadStatus(lead.id, next);
      setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    } catch {
      // refresh will show correct state
    } finally {
      setPatching(null);
    }
  }

  async function handleAssignOperator(leadId: string, operatorId: string) {
    setAssigning(prev => ({ ...prev, [leadId]: operatorId }));
    try {
      const updated = await assignLeadOperator(leadId, operatorId);
      setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed.");
    } finally {
      setAssigning(prev => { const n = { ...prev }; delete n[leadId]; return n; });
    }
  }

  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const operatorMap = Object.fromEntries(operators.map(o => [o.id, o]));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Leads</h1>
          <p className="text-white/50 text-sm">Trek enquiries and lead pipeline.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-accent/40 w-full sm:w-auto"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {ALL_STATUSES.map(s => (
          <div key={s} className="bg-[#14161f] rounded-2xl border border-white/10 p-4">
            <p className="text-white font-display text-xl font-semibold leading-none mb-1">{counts[s] ?? 0}</p>
            <p className="text-white/40 text-xs capitalize">{s}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-6">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Leads table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">
            {loading ? "Loading…" : `${leads.length} lead${leads.length !== 1 ? "s" : ""}`}
          </h2>
          <Users className="h-4 w-4 text-white/30" />
        </div>

        {!loading && leads.length === 0 ? (
          <p className="text-white/40 text-sm p-6">No leads found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Name</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Trek</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Operator</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Action</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs w-8"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const isExpanded = expanded[lead.id] ?? false;
                  const assignedOp = lead.assigned_operator_id ? operatorMap[lead.assigned_operator_id] : null;

                  return (
                    <>
                      <tr key={lead.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="text-white/80 font-medium text-xs sm:text-sm">{lead.name}</p>
                          <p className="text-white/40 text-[11px]">{lead.email}</p>
                        </td>
                        <td className="px-4 py-3.5 text-white/60 text-xs hidden sm:table-cell">{lead.trek_interest}</td>

                        {/* Operator column — assign-operator dropdown */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          {assignedOp ? (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-purple-400 flex-shrink-0" />
                              <span className="text-purple-400 text-xs">{assignedOp.name}</span>
                            </div>
                          ) : operators.length > 0 ? (
                            <select
                              className="text-[11px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/50 focus:outline-none focus:border-accent/40"
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) handleAssignOperator(lead.id, e.target.value);
                              }}
                              disabled={!!assigning[lead.id]}
                            >
                              <option value="">Assign…</option>
                              {operators.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-white/25 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-white/40 text-xs hidden lg:table-cell">{formatDate(lead.created_at)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[lead.status] ?? STATUS_STYLES.new}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          {NEXT_STATUS[lead.status] && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white/60 hover:text-white text-xs h-7 px-3"
                              disabled={patching === lead.id}
                              onClick={() => handleStatusChange(lead, NEXT_STATUS[lead.status])}
                            >
                              {patching === lead.id ? "…" : `Mark ${NEXT_STATUS[lead.status]}`}
                            </Button>
                          )}
                          {lead.status !== "lost" && lead.status !== "archived" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/10 text-red-400/60 hover:text-red-400 text-xs h-7 px-2 ml-1"
                              disabled={patching === lead.id}
                              onClick={() => handleStatusChange(lead, "lost")}
                            >
                              Lost
                            </Button>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {(lead.status_history?.length ?? 0) > 0 && (
                            <button
                              onClick={() => setExpanded(prev => ({ ...prev, [lead.id]: !isExpanded }))}
                              className="text-white/30 hover:text-white/70"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Status history drawer */}
                      {isExpanded && (lead.status_history?.length ?? 0) > 0 && (
                        <tr key={`${lead.id}-history`} className="border-b border-white/5">
                          <td colSpan={7} className="px-4 pb-4 pt-0">
                            <div className="bg-[#0c0e14] rounded-xl border border-white/8 p-3">
                              <p className="text-xs text-white/40 font-medium mb-2">Status history</p>
                              <div className="space-y-1.5">
                                {(lead.status_history ?? []).map((h, i) => (
                                  <div key={i} className="flex items-center gap-3 text-xs">
                                    <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[h.status] ?? "text-white/40 bg-white/5 border border-white/10"}`}>
                                      {h.status}
                                    </span>
                                    <span className="text-white/30">{formatTs(h.changed_at)}</span>
                                    <span className="text-white/20">by {h.changed_by}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
