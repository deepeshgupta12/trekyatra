"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { addBookmark, removeBookmark } from "@/lib/api";

interface Props {
  cmsPageId: string;
  initialBookmarked?: boolean;
  className?: string;
}

export function BookmarkButton({ cmsPageId, initialBookmarked = false, className = "" }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (bookmarked) {
        await removeBookmark(cmsPageId);
        setBookmarked(false);
      } else {
        await addBookmark(cmsPageId);
        setBookmarked(true);
      }
    } catch {
      // Auth not available — silently ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={bookmarked ? "Remove bookmark" : "Save to bookmarks"}
      className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
        bookmarked
          ? "bg-accent text-white"
          : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
    </button>
  );
}
