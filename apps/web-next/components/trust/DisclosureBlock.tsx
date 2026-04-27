import Link from "next/link";
import { Info } from "lucide-react";

interface Props {
  showAffiliate?: boolean;
  showAds?: boolean;
  showAI?: boolean;
}

export default function DisclosureBlock({ showAffiliate = true, showAds = true, showAI = true }: Props) {
  return (
    <div className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-2xl px-5 py-4 leading-relaxed space-y-2">
      <div className="flex items-center gap-2 font-semibold text-foreground/70 mb-1">
        <Info className="h-4 w-4" /> Editorial disclosure
      </div>
      {showAffiliate && (
        <p>
          <strong>Affiliate links:</strong> Some links on this page are affiliate links. TrekYatra may earn a small commission at no extra cost to you if you purchase through these links.{" "}
          <Link href="/affiliate-disclosure" className="underline hover:text-foreground">Full affiliate disclosure →</Link>
        </p>
      )}
      {showAds && (
        <p>
          <strong>Display advertising:</strong> This site displays ads to help fund free content. Ads are served by third-party networks and are not editorial recommendations.
        </p>
      )}
      {showAI && (
        <p>
          <strong>AI-assisted content:</strong> Some content on this page was drafted with AI assistance and reviewed by our editorial team. All factual claims are verified by a human editor before publication.
        </p>
      )}
    </div>
  );
}
