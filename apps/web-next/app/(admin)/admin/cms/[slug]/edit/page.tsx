"use client";

// Client component — avoids server-side outbound HTTP to www.trekyatra.co.in which
// gets challenged by Cloudflare enhanced_threat_control on DO App Platform.
// The browser fetch uses the cf_clearance cookie and succeeds.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import CMSPageForm from "@/components/admin/CMSPageForm";
import type { CMSPage } from "@/lib/api";

const PAGE_PREFIX: Record<string, string> = {
  trek_guide: "/trek", packing_list: "/packing", permit_guide: "/permits",
  beginner_roundup: "/guides", expert_guide: "/guides", editorial: "",
};
function getLiveUrl(page: CMSPage): string {
  const base = PAGE_PREFIX[page.page_type];
  if (base === undefined) return `/trek/${page.slug}`;
  return base === "" ? `/${page.slug}` : `${base}/${page.slug}`;
}

export default function EditCMSPagePage({ params }: { params: { slug: string } }) {
  const [page, setPage] = useState<CMSPage | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/cms/pages/${params.slug}`)
      .then((r) => {
        if (!r.ok) { setError(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setPage(data); })
      .catch(() => setError(true));
  }, [params.slug]);

  if (error) {
    return (
      <div className="p-6 text-white/50">Page not found: <code className="font-mono">{params.slug}</code></div>
    );
  }

  if (!page) {
    return (
      <div className="p-6 flex items-center gap-2 text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading page data…
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-1.5 text-xs text-white/40 mb-6">
        <Link href="/admin/cms" className="hover:text-white transition-colors">Master CMS</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white/70 font-mono">{page.slug}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Edit page</h1>
          <p className="text-white/50 text-sm">{page.title}</p>
        </div>
        <a
          href={getLiveUrl(page)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline w-fit"
        >
          View live page →
        </a>
      </div>

      <CMSPageForm mode="edit" existing={page} />
    </div>
  );
}
