import Link from "next/link";
import { ShoppingBag } from "lucide-react";

interface Props {
  productName: string;
  affiliateUrl: string;
  note?: string;
}

export default function GearRecommendation({ productName, affiliateUrl, note }: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      <Link
        href={affiliateUrl}
        target="_blank"
        rel="nofollow sponsored noopener"
        aria-label={`Check price for ${productName}`}
        className="text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
      >
        {productName}
      </Link>
      <ShoppingBag className="h-3 w-3 text-accent inline" aria-hidden />
      {note && <span className="text-muted-foreground text-xs">({note})</span>}
    </span>
  );
}
