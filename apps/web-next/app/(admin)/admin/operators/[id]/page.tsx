"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Trash2, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Agreement {
  id: string;
  operator_id: string;
  lead_fee_inr: number;
  revenue_share_pct: number | null;
  active: boolean;
  notes: string | null;
  created_at: string;
}

interface Review {
  id: string;
  operator_id: string;
  user_id: string | null;
  rating: number;
  body: string | null;
  created_at: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
      ))}
    </div>
  );
}

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [agreementForm, setAgreementForm] = useState({ lead_fee_inr: "", revenue_share_pct: "", active: true, notes: "" });
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [agreementMsg, setAgreementMsg] = useState("");
  const [deletingReview, setDeletingReview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // Load agreement
    fetch(`/api/v1/admin/operators/${id}/agreement`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setAgreement(data);
          setAgreementForm({
            lead_fee_inr: String(data.lead_fee_inr),
            revenue_share_pct: data.revenue_share_pct != null ? String(data.revenue_share_pct) : "",
            active: data.active,
            notes: data.notes ?? "",
          });
        }
      });
    // Load reviews
    fetch(`/api/v1/admin/operators/${id}/reviews`)
      .then((r) => r.ok ? r.json() : [])
      .then(setReviews);
  }, [id]);

  async function saveAgreement() {
    setSavingAgreement(true);
    setAgreementMsg("");
    const body = {
      lead_fee_inr: parseFloat(agreementForm.lead_fee_inr) || 0,
      revenue_share_pct: agreementForm.revenue_share_pct ? parseFloat(agreementForm.revenue_share_pct) : null,
      active: agreementForm.active,
      notes: agreementForm.notes || null,
    };
    const method = agreement ? "PATCH" : "POST";
    const url = `/api/v1/admin/operators/${id}/agreement`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setAgreement(data);
      setAgreementMsg("Saved.");
      setTimeout(() => setAgreementMsg(""), 3000);
    } else {
      setAgreementMsg("Save failed.");
    }
    setSavingAgreement(false);
  }

  async function deleteReview(reviewId: string) {
    setDeletingReview(reviewId);
    const res = await fetch(`/api/v1/admin/operators/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    setDeletingReview(null);
  }

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50";

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/operators">
          <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Operators
          </Button>
        </Link>
        <h1 className="font-display text-2xl font-semibold text-white">Operator Detail</h1>
      </div>

      {/* Agreement */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 border-b border-white/8 pb-3">
          <FileText className="h-4 w-4 text-accent" />
          <h2 className="text-white font-semibold text-sm">Revenue Agreement</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5">Lead fee (₹)</label>
            <input
              type="number"
              value={agreementForm.lead_fee_inr}
              onChange={(e) => setAgreementForm((f) => ({ ...f, lead_fee_inr: e.target.value }))}
              className={inputCls}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5">Revenue share (%)</label>
            <input
              type="number"
              value={agreementForm.revenue_share_pct}
              onChange={(e) => setAgreementForm((f) => ({ ...f, revenue_share_pct: e.target.value }))}
              className={inputCls}
              placeholder="optional"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-white/40 font-medium block mb-1.5">Notes</label>
          <textarea
            rows={2}
            value={agreementForm.notes}
            onChange={(e) => setAgreementForm((f) => ({ ...f, notes: e.target.value }))}
            className={`${inputCls} resize-none`}
            placeholder="Internal notes..."
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={agreementForm.active}
              onChange={(e) => setAgreementForm((f) => ({ ...f, active: e.target.checked }))}
              className="accent-accent"
            />
            Active agreement
          </label>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button variant="hero" size="sm" onClick={saveAgreement} disabled={savingAgreement}>
            {savingAgreement ? "Saving…" : agreement ? "Update agreement" : "Create agreement"}
          </Button>
          {agreementMsg && (
            <span className="flex items-center gap-1 text-xs text-pine">
              <CheckCircle className="h-3.5 w-3.5" /> {agreementMsg}
            </span>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <h2 className="text-white font-semibold text-sm">Reviews ({reviews.length})</h2>
          </div>
        </div>
        {reviews.length === 0 ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">No reviews yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {reviews.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarDisplay rating={r.rating} />
                    <span className="text-xs text-white/40">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.body && <p className="text-sm text-white/70">{r.body}</p>}
                </div>
                <button
                  onClick={() => deleteReview(r.id)}
                  disabled={deletingReview === r.id}
                  className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Delete review"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
