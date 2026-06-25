"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchBuddyCount, fetchSignals, deleteSignal } from "@/lib/buddies";
import type { BuddyCountOut, SignalOut } from "@/lib/buddies";
import { BuddySignalCard } from "./BuddySignalCard";
import { BuddySignalForm } from "./BuddySignalForm";
import { Users } from "lucide-react";

interface Props {
  trekSlug: string;
}

export function BuddySection({ trekSlug }: Props) {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [count, setCount] = useState<BuddyCountOut | null>(null);
  const [signals, setSignals] = useState<SignalOut[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
  const [mySignal, setMySignal] = useState<SignalOut | null>(null);

  useEffect(() => {
    fetchBuddyCount(trekSlug).then(setCount).catch(() => {});
  }, [trekSlug]);

  async function loadSignals() {
    if (!isLoggedIn) return;
    try {
      const all = await fetchSignals(trekSlug);
      setSignals(all);
      const own = all.find((s) => s.is_own) ?? null;
      setMySignal(own);
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
    try {
      await deleteSignal(mySignal.id);
      setMySignal(null);
      setSignals((prev) => prev?.filter((s) => s.id !== mySignal.id) ?? null);
      setCount((prev) => prev ? { ...prev, count: Math.max(0, prev.count - 1) } : prev);
    } catch {
      // silently ignore
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

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 w-9 h-9 rounded-xl flex items-center justify-center">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Find a Trek Buddy</h2>
            <p className="text-sm text-foreground/50">
              {totalCount > 0
                ? `${totalCount} trekker${totalCount !== 1 ? "s" : ""} planning this route`
                : "Be the first to signal you're planning this trek"}
            </p>
          </div>
        </div>

        {isLoggedIn && !showForm && (
          <div className="flex gap-2">
            {mySignal ? (
              <button
                onClick={handleDelete}
                className="text-xs font-medium text-foreground/40 hover:text-red-500 transition-colors border border-foreground/10 rounded-lg px-3 py-1.5"
              >
                Remove my signal
              </button>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs font-semibold text-accent border border-accent/30 rounded-lg px-4 py-1.5 hover:bg-accent/5 transition-colors"
              >
                I&apos;m planning this trek
              </button>
            )}
          </div>
        )}

        {!isLoggedIn && (
          <a
            href="/auth/login"
            className="text-xs font-semibold text-accent border border-accent/30 rounded-lg px-4 py-1.5 hover:bg-accent/5 transition-colors"
          >
            Sign in to post or connect
          </a>
        )}
      </div>

      {/* My active signal chip */}
      {mySignal && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 flex items-center gap-2.5 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            Your signal is active for {mySignal.month_year}
          </span>
        </div>
      )}

      {/* Signal form */}
      {showForm && (
        <BuddySignalForm
          trekSlug={trekSlug}
          onCreated={handleSignalCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Browse signals */}
      {totalCount > 0 && (
        <div>
          {!showList ? (
            <button
              onClick={handleShowList}
              className="text-sm font-medium text-accent hover:underline"
            >
              Browse {totalCount} trekker{totalCount !== 1 ? "s" : ""} planning this route →
            </button>
          ) : (
            <div className="space-y-3">
              {signals === null ? (
                <div className="text-sm text-foreground/40 py-4 text-center">Loading…</div>
              ) : signals.length === 0 ? (
                <p className="text-sm text-foreground/40">No active signals right now.</p>
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
        </div>
      )}

      {/* Month breakdown */}
      {count && count.upcoming_months.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {count.upcoming_months.slice(0, 6).map((m) => (
            <span
              key={m.month_year}
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-foreground/10 bg-foreground/3 text-foreground/50"
            >
              {m.month_year} · {m.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
