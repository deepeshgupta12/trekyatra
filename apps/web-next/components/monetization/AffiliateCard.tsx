"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { trackAffiliateClick } from "@/lib/api";

export interface AffiliateCardItem {
  title: string;
  description: string;
  imageUrl?: string;
  affiliateUrl: string;
  price?: string;
  badge?: string;
}

interface Props {
  item: AffiliateCardItem;
}

export default function AffiliateCard({ item }: Props) {
  return (
    <div className="flex-shrink-0 w-64 bg-card border border-border rounded-2xl overflow-hidden">
      {item.imageUrl && (
        <div className="h-36 bg-muted overflow-hidden">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      {!item.imageUrl && (
        <div className="h-36 bg-muted flex items-center justify-center text-xs text-muted-foreground">
          {item.title}
        </div>
      )}
      <div className="p-4 space-y-2">
        {item.badge && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">{item.badge}</span>
        )}
        <p className="font-semibold text-sm leading-tight">{item.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
        {item.price && <p className="text-sm font-semibold text-foreground">{item.price}</p>}
        <Link
          href={item.affiliateUrl}
          target="_blank"
          rel="nofollow sponsored noopener"
          aria-label={`Check price for ${item.title}`}
          onClick={() => {
            trackEvent("affiliate_click", { title: item.title, url: item.affiliateUrl });
            trackAffiliateClick({
              page_slug: typeof window !== "undefined" ? window.location.pathname : "/",
              affiliate_program: new URL(item.affiliateUrl, "https://x.com").hostname.replace("www.", ""),
              affiliate_link_url: item.affiliateUrl,
            });
          }}
        >
          <Button variant="outline" size="sm" className="w-full mt-1 text-xs gap-1.5">
            <ExternalLink className="h-3 w-3" /> Check price
          </Button>
        </Link>
        <p className="text-[10px] text-muted-foreground/60">Affiliate link · we may earn a commission</p>
      </div>
    </div>
  );
}
