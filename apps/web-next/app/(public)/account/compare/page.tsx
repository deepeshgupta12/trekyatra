"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComparisonItem, fetchComparisons, deleteComparison } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function CompareLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchComparisons();
      setLists(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteComparison(id);
      setLists(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <BarChart2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Sign in to view compare lists</h2>
        <Link href="/auth/sign-in" className="text-accent font-medium text-sm">Sign in →</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-1">Compare Lists</h1>
          <p className="text-muted-foreground">Side-by-side comparisons you&apos;ve built.</p>
        </div>
        <Button variant="hero" size="sm" asChild>
          <Link href="/compare"><Plus className="h-4 w-4" /> New list</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : lists.length === 0 ? (
        <div className="text-center py-20">
          <BarChart2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">No compare lists yet</h2>
          <p className="text-muted-foreground mb-6">Build a comparison from the trek comparison tool, then save it here.</p>
          <Link href="/compare" className="text-accent font-medium text-sm">Go to compare →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map(list => (
            <div
              key={list.id}
              className="bg-surface rounded-2xl border border-border p-5 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <h3 className="font-medium mb-1 truncate">{list.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {list.slugs.join(" vs ")} · Saved {formatDate(list.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/compare?slugs=${list.slugs.join(",")}`}>
                    View <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
                <button
                  onClick={() => handleDelete(list.id)}
                  disabled={deletingId === list.id}
                  className="p-2 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Delete list"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
