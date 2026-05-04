"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Loader2 } from "lucide-react";
import { UserOrder, fetchAdminOrders } from "@/lib/api";

type StatusFilter = "all" | "pending" | "paid" | "refunded";

const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  paid:    "text-pine bg-pine/10 border border-pine/20",
  refunded:"text-red-400 bg-red-400/10 border border-red-400/20",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [filtered, setFiltered] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    fetchAdminOrders()
      .then((data) => { setOrders(data); setFiltered(data); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFiltered(status === "all" ? orders : orders.filter((o) => o.status === status));
  }, [status, orders]);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Orders</h1>
          <p className="text-white/50 text-sm">All digital product orders and payment status.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "paid", "pending", "refunded"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              status === s
                ? "bg-accent/15 text-accent border-accent/20"
                : "text-white/40 border-white/10 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No orders{status !== "all" ? ` with status "${status}"` : ""} yet.</p>
        </div>
      ) : (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Order ID</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Product</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Amount</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Mode</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-white/40 text-xs">
                      {o.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3.5 text-white/70 text-xs hidden sm:table-cell">
                      {o.product_id ? o.product_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-white/80 text-xs sm:text-sm font-medium">
                      ₹{(o.amount_inr ?? 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[o.status] ?? "text-white/40 bg-white/5 border border-white/10"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {o.test_mode ? (
                        <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">test</span>
                      ) : (
                        <span className="text-xs text-pine bg-pine/10 border border-pine/20 px-2 py-0.5 rounded-full">live</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden md:table-cell">
                      {formatDate(o.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
