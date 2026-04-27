"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAdminLeads, patchLeadStatus, AdminLead } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  contacted: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  converted: "text-pine bg-pine/10 border border-pine/20",
  archived: "text-white/40 bg-white/5 border border-white/10",
};

const NEXT_STATUS: Record<string, string> = {
  new: "contacted",
  contacted: "converted",
  converted: "archived",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [patching, setPatching] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLeads({ limit: 100, status: statusFilter || undefined });
      setLeads(data);
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
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch {
      // ignore — refresh will show correct state
    } finally {
      setPatching(null);
    }
  }

  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-accent/40 w-full sm:w-auto"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["new", "contacted", "converted", "archived"] as const).map((s) => (
          <div key={s} className="bg-[#14161f] rounded-2xl border border-white/10 p-4">
            <p className="text-white font-display text-xl font-semibold leading-none mb-1">{counts[s] ?? 0}</p>
            <p className="text-white/40 text-xs capitalize">{s}</p>
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">
            {loading ? "Loading…" : `${leads.length} lead${leads.length !== 1 ? "s" : ""}`}
          </h2>
          <Users className="h-4 w-4 text-white/30" />
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-red-400 text-sm p-6">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : !loading && leads.length === 0 ? (
          <p className="text-white/40 text-sm p-6">No leads found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Name</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Trek</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-white/80 font-medium text-xs sm:text-sm">{lead.name}</p>
                      <p className="text-white/40 text-[11px]">{lead.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-white/60 text-xs hidden sm:table-cell">{lead.trek_interest}</td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden md:table-cell">{formatDate(lead.created_at)}</td>
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
