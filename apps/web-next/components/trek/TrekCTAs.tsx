"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Bookmark, BookmarkCheck, GitCompare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addBookmarkBySlug, removeBookmarkBySlug } from "@/lib/api";

interface TrekCTAsProps {
  slug: string;
  region: string;
  name: string;
}

export function TrekCTAs({ slug, region, name }: TrekCTAsProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      if (bookmarked) {
        await removeBookmarkBySlug(slug);
        setBookmarked(false);
      } else {
        await addBookmarkBySlug(slug, name);
        setBookmarked(true);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bookmark-changed"));
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "";
      const status = msg.match(/API (\d+)/)?.[1];
      if (status === "401" || status === "403") {
        // Queue slug for post-login bookmark merge
        try {
          const pending = JSON.parse(localStorage.getItem("pendingBookmarks") ?? "[]") as string[];
          if (!pending.includes(slug)) {
            pending.push(slug);
            localStorage.setItem("pendingBookmarks", JSON.stringify(pending));
          }
          // Redirect to sign-in preserving return URL
          window.location.href = `/auth/sign-in?next=/trek/${slug}`;
        } catch {}
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/trek/${slug}` : `/trek/${slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: `${name} Trek Guide`, text: `Plan the ${name} trek with TrekYatra`, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const planUrl = `/plan${region ? `?region=${encodeURIComponent(region)}` : ""}`;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <Link href={planUrl}>
        <Button variant="hero" size="default">
          <Sparkles className="h-4 w-4" /> Plan this trek
        </Button>
      </Link>
      <Button variant="glass" size="default" onClick={handleSave} disabled={saving}>
        {bookmarked
          ? <><BookmarkCheck className="h-4 w-4 text-accent" /> Saved</>
          : <><Bookmark className="h-4 w-4" /> Save</>
        }
      </Button>
      <Link href={`/compare?slugs=${slug}`}>
        <Button variant="glass" size="default">
          <GitCompare className="h-4 w-4" /> Compare
        </Button>
      </Link>
      <Button variant="glass" size="default" onClick={handleShare}>
        <Share2 className="h-4 w-4" /> {copied ? "Copied!" : "Share"}
      </Button>
    </div>
  );
}
