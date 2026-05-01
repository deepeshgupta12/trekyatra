"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink } from "lucide-react";
import { BookmarkResponse, fetchBookmarks, removeBookmark, removeBookmarkBySlug } from "@/lib/api";
import { Button } from "@/components/ui/button";

const PAGE_TYPE_LABELS: Record<string, string> = {
  trek_guide: "Trek Guide",
  packing_list: "Packing List",
  permit_guide: "Permit Guide",
  destination_guide: "Destination Guide",
};

export default function SavedTreks() {
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks()
      .then(setBookmarks)
      .catch(() => setBookmarks([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(b: BookmarkResponse) {
    setRemoving(b.id);
    try {
      if (b.trek_slug) {
        await removeBookmarkBySlug(b.trek_slug);
      } else if (b.cms_page_id) {
        await removeBookmark(b.cms_page_id);
      }
      setBookmarks((prev) => prev.filter((x) => x.id !== b.id));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bookmark-changed"));
      }
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Saved Pages</h1>
        <p className="text-muted-foreground">
          {loading ? "Loading…" : `${bookmarks.length} page${bookmarks.length !== 1 ? "s" : ""} saved.`}
        </p>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm py-16 text-center">Loading your saved pages…</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">Nothing saved yet</h2>
          <p className="text-muted-foreground mb-6">
            Browse trek guides and tap the bookmark icon to save them here.
          </p>
          <Link href="/explore" className="text-accent font-medium text-sm">
            Explore treks →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="bg-surface rounded-2xl border border-border overflow-hidden flex flex-col"
            >
              {b.hero_image_url ? (
                <img
                  src={b.hero_image_url}
                  alt={b.title ?? "Saved page"}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-accent/5 flex items-center justify-center">
                  <Bookmark className="h-8 w-8 text-accent/30" />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1 gap-3">
                {b.page_type && (
                  <span className="text-xs text-accent font-medium">
                    {PAGE_TYPE_LABELS[b.page_type] ?? b.page_type}
                  </span>
                )}
                <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2">
                  {b.title ?? "Untitled page"}
                </h3>
                <div className="flex items-center gap-2 mt-auto">
                  {b.slug && (
                    <Link
                      href={`/${b.page_type?.replace(/_/g, "/") ?? "treks"}/${b.slug}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-400 border-red-400/20 hover:bg-red-400/10"
                    disabled={removing === b.id}
                    onClick={() => handleRemove(b)}
                  >
                    {removing === b.id ? "…" : "Remove"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
