"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BarChart2, Download, Bell, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  BookmarkResponse,
  fetchBookmarks,
  fetchDownloads,
  fetchAlerts,
} from "@/lib/api";

const PAGE_TYPE_LABELS: Record<string, string> = {
  trek_guide: "Trek Guide",
  packing_list: "Packing List",
  permit_guide: "Permit Guide",
  destination_guide: "Destination Guide",
};

export default function AccountDashboard() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([]);
  const [downloadCount, setDownloadCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    Promise.all([
      fetchBookmarks().catch(() => [] as BookmarkResponse[]),
      fetchDownloads().catch(() => []),
      fetchAlerts().catch(() => []),
    ]).then(([bk, dl, al]) => {
      setBookmarks(bk);
      setDownloadCount(dl.length);
      setAlertCount(al.length);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reactively refresh counts whenever any page bookmarks/unbookmarks
  useEffect(() => {
    const handler = () => {
      fetchBookmarks().catch(() => [] as BookmarkResponse[]).then(setBookmarks);
    };
    window.addEventListener("bookmark-changed", handler);
    return () => window.removeEventListener("bookmark-changed", handler);
  }, []);

  const stats = [
    { label: "Saved pages", value: loading ? "—" : String(bookmarks.length), icon: Bookmark, href: "/account/saved" },
    { label: "Compare lists", value: "0", icon: BarChart2, href: "/account/compare" },
    { label: "Downloads", value: loading ? "—" : String(downloadCount), icon: Download, href: "/account/downloads" },
    { label: "Alerts set", value: loading ? "—" : String(alertCount), icon: Bell, href: "/account/settings" },
  ];

  const recent = bookmarks.slice(0, 3);
  const displayName = user?.full_name?.split(" ")[0] ?? user?.email ?? "there";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-semibold text-foreground">{displayName}</span>. Your saved pages and planning workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-surface rounded-2xl border border-border p-5 hover:border-accent/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <p className="font-display text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recently saved */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold">Recently saved</h2>
          <Link href="/account/saved" className="text-sm text-accent font-medium">View all</Link>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : recent.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-8 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-3">Nothing saved yet. Browse trek guides and bookmark them.</p>
            <Link href="/explore" className="text-accent font-medium text-sm">Explore treks →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent.map((b) => (
              <div key={b.id} className="bg-surface rounded-2xl border border-border overflow-hidden flex flex-col">
                {b.hero_image_url ? (
                  <img src={b.hero_image_url} alt={b.title ?? ""} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-accent/5 flex items-center justify-center">
                    <Bookmark className="h-8 w-8 text-accent/30" />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  {b.page_type && (
                    <span className="text-xs text-accent font-medium">
                      {PAGE_TYPE_LABELS[b.page_type] ?? b.page_type}
                    </span>
                  )}
                  <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 flex-1">
                    {b.title ?? "Untitled"}
                  </h3>
                  {b.slug && (
                    <Link
                      href={`/trek/${b.slug}`}
                      className="flex items-center gap-1 text-xs text-accent font-medium mt-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View guide
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
