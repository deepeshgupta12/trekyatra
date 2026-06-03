"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BarChart2, Download, Bell, ExternalLink, Clock, MailWarning, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  BookmarkResponse,
  fetchBookmarks,
  fetchDownloads,
  fetchAlerts,
  fetchComparisons,
} from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

const RECENTLY_VIEWED_KEY = "ty_recently_viewed";

interface RecentlyViewedItem {
  slug: string;
  title: string;
  pageType?: string;
  href: string;
  viewedAt: number;
}

function readRecentlyViewed(): RecentlyViewedItem[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]");
  } catch { return []; }
}

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
  const [compareCount, setCompareCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  const loadData = useCallback(() => {
    Promise.all([
      fetchBookmarks().catch(() => [] as BookmarkResponse[]),
      fetchDownloads().catch(() => []),
      fetchAlerts().catch(() => []),
      fetchComparisons().catch(() => []),
    ]).then(([bk, dl, al, cp]) => {
      setBookmarks(bk);
      setDownloadCount(dl.length);
      setAlertCount(al.length);
      setCompareCount(cp.length);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    setRecentlyViewed(readRecentlyViewed().slice(0, 5));
  }, [loadData]);

  // Reactively refresh counts whenever any page bookmarks/unbookmarks
  useEffect(() => {
    const handler = () => {
      fetchBookmarks().catch(() => [] as BookmarkResponse[]).then(setBookmarks);
    };
    window.addEventListener("bookmark-changed", handler);
    return () => window.removeEventListener("bookmark-changed", handler);
  }, []);

  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResendVerification() {
    setResendStatus("sending");
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/send-verification`, {
        method: "POST",
        credentials: "include",
      });
      setResendStatus(res.ok ? "sent" : "error");
    } catch {
      setResendStatus("error");
    }
  }

  const stats = [
    { label: "Saved pages", value: loading ? "—" : String(bookmarks.length), icon: Bookmark, href: "/account/saved" },
    { label: "Compare lists", value: loading ? "—" : String(compareCount), icon: BarChart2, href: "/account/compare" },
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

      {/* Email verification banner — only shown for unverified email signups */}
      {user && !user.is_verified_email && (
        <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 mb-8">
          <MailWarning className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Please verify your email address</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {resendStatus === "sent"
                ? "Verification email sent — check your inbox."
                : <>We sent a verification link to <strong>{user.email}</strong>. Click it to secure your account.</>}
            </p>
          </div>
          {resendStatus === "sent" ? (
            <CheckCircle2 className="h-5 w-5 text-pine flex-shrink-0 mt-0.5" />
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={resendStatus === "sending"}
              onClick={handleResendVerification}
              className="flex-shrink-0 text-xs border-amber-400/40 text-amber-600 hover:bg-amber-400/10"
            >
              {resendStatus === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Resend"}
            </Button>
          )}
        </div>
      )}

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

      {/* Recently viewed */}
      {recentlyViewed.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" /> Recently viewed
            </h2>
          </div>
          <div className="space-y-2">
            {recentlyViewed.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent transition-colors bg-surface"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.pageType && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {PAGE_TYPE_LABELS[item.pageType] ?? item.pageType}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
