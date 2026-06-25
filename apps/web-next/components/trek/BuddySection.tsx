"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchBuddyCount, fetchSignals, deleteSignal } from "@/lib/buddies";
import type { BuddyCountOut, SignalOut } from "@/lib/buddies";
import { BuddySignalCard } from "./BuddySignalCard";
import { BuddySignalForm } from "./BuddySignalForm";
import { Users, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  trekSlug: string;
}

const MONTH_LABEL: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

function fmtMonth(ym: string) {
  const [year, mon] = ym.split("-");
  return `${MONTH_LABEL[mon] ?? mon} ${year}`;
}

export function BuddySection({ trekSlug }: Props) {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [count, setCount] = useState<BuddyCountOut | null>(null);
  const [signals, setSignals] = useState<SignalOut[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
  const [mySignal, setMySignal] = useState<SignalOut | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBuddyCount(trekSlug).then(setCount).catch(() => {});
  }, [trekSlug]);

  async function loadSignals() {
    if (!isLoggedIn) return;
    try {
      const all = await fetchSignals(trekSlug);
      setSignals(all);
      setMySignal(all.find((s) => s.is_own) ?? null);
    } catch {
      // silently ignore
    }
  }

  function handleShowList() {
    setShowList(true);
    if (signals === null) loadSignals();
  }

  async function handleDelete() {
    if (!mySignal) return;
    setDeleting(true);
    try {
      await deleteSignal(mySignal.id);
      setMySignal(null);
      setSignals((prev) => prev?.filter((s) => s.id !== mySignal.id) ?? null);
      setCount((prev) => prev ? { ...prev, count: Math.max(0, prev.count - 1) } : prev);
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
    }
  }

  function handleSignalCreated(signal: SignalOut) {
    setShowForm(false);
    setMySignal(signal);
    setSignals((prev) => {
      if (!prev) return [signal];
      const without = prev.filter((s) => s.id !== signal.id);
      return [signal, ...without];
    });
    setCount((prev) => prev ? { ...prev, count: (prev.count || 0) + 1 } : prev);
  }

  const totalCount = count?.count ?? 0;
  const months = count?.upcoming_months ?? [];

  return (
    <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] overflow-hidden">
      {/* Section header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-foreground/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold leading-tight">Find a Trek Buddy</h2>
            <p className="text-sm text-foreground/50 mt-0.5">
              {totalCount > 0
                ? `${totalCount} trekker${totalCount !== 1 ? "s" : ""} planning this route`
                : "Connect with trekkers planning the same route"}
            </p>
          </div>
        </div>

        {/* CTA — top-right */}
        <div className="shrink-0 mt-0.5">
          {isLoggedIn ? (
            mySignal ? (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-foreground/40 hover:text-red-500 transition-colors border border-foreground/10 hover:border-red-200 rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Remove signal"}
              </button>
            ) : !showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs font-semibold text-white bg-accent hover:bg-accent/90 rounded-lg px-4 py-1.5 transition-colors"
              >
                I&apos;m planning this trek
              </button>
            ) : null
          ) : (
            <a
              href="/auth/login"
              className="text-xs font-semibold text-accent border border-accent/30 rounded-lg px-4 py-1.5 hover:bg-accent/5 transition-colors"
            >
              Sign in to connect
            </a>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Active signal chip */}
        {mySignal && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Your signal is active for {fmtMonth(mySignal.month_year)}
            </span>
          </div>
        )}

        {/* Inline signal form */}
        {showForm && (
          <BuddySignalForm
            trekSlug={trekSlug}
            onCreated={handleSignalCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Month breakdown chips */}
        {months.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground/40 uppercase tracking-wide mb-2">Planning by month</p>
            <div className="flex flex-wrap gap-2">
              {months.slice(0, 8).map((m) => (
                <span
                  key={m.month_year}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-foreground/10 bg-background text-foreground/60"
                >
                  {fmtMonth(m.month_year)}
                  <span className="w-4 h-4 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center leading-none">
                    {m.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state — no signals, not showing form */}
        {totalCount === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-foreground/15 py-8 px-5 text-center">
            <div className="w-10 h-10 rounded-full bg-accent/8 flex items-center justify-center mx-auto mb-3">
              <Users className="h-5 w-5 text-accent/60" />
            </div>
            <p className="text-sm font-medium text-foreground/50 mb-1">No buddies yet for this trek</p>
            <p className="text-xs text-foreground/35">
              {isLoggedIn
                ? "Post your signal above — be the first!"
                : "Sign in and be the first to post a planning signal."}
            </p>
          </div>
        )}

        {/* Browse signals toggle */}
        {totalCount > 0 && (
          <div>
            {isLoggedIn ? (
              <>
                <button
                  onClick={showList ? () => setShowList(false) : handleShowList}
                  className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  {showList ? (
                    <>Hide trekkers <ChevronUp className="h-3.5 w-3.5" /></>
                  ) : (
                    <>Browse {totalCount} trekker{totalCount !== 1 ? "s" : ""} planning this route <ChevronDown className="h-3.5 w-3.5" /></>
                  )}
                </button>

                {showList && (
                  <div className="mt-3 space-y-2">
                    {signals === null ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 rounded-xl bg-foreground/5 animate-pulse" />
                        ))}
                      </div>
                    ) : signals.length === 0 ? (
                      <p className="text-sm text-foreground/40 py-2">No active signals right now.</p>
                    ) : (
                      signals.map((s) => (
                        <BuddySignalCard
                          key={s.id}
                          signal={s}
                          onRequestSent={() => {}}
                        />
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <a
                href="/auth/login"
                className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Sign in to see who&apos;s planning this trek <ChevronDown className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
