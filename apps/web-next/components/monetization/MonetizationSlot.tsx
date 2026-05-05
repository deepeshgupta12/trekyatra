import { fetchIntent, fetchPublicAffiliateProducts } from "@/lib/api";
import AffiliateRail from "./AffiliateRail";
import { type AffiliateCardItem } from "./AffiliateCard";
import LeadForm from "./LeadForm";
import NewsletterCapture from "./NewsletterCapture";

interface Props {
  slug: string;
  sourcePage: string;
}

function toAffiliateCardItem(p: {
  title: string;
  description: string | null;
  affiliate_url: string;
  price_range: string | null;
}): AffiliateCardItem {
  return {
    title: p.title,
    description: p.description ?? "",
    affiliateUrl: p.affiliate_url,
    price: p.price_range ?? undefined,
  };
}

export default async function MonetizationSlot({ slug, sourcePage }: Props) {
  let module: "affiliate" | "lead" | "newsletter" | "product" = "newsletter";

  try {
    const intent = await fetchIntent(slug);
    module = intent.recommended_module;
  } catch {
    // default to newsletter if API unavailable
  }

  if (module === "affiliate") {
    let items: AffiliateCardItem[] = [];
    try {
      const products = await fetchPublicAffiliateProducts(5);
      items = products.map(toAffiliateCardItem);
    } catch {
      // fall through to empty rail (AffiliateRail returns null when empty)
    }
    return <AffiliateRail items={items} title="Recommended gear for this trek" />;
  }

  if (module === "lead") {
    return (
      <LeadForm
        sourcePage={sourcePage}
        ctaType="booking_ready"
        preselectedTrek={slug}
      />
    );
  }

  if (module === "product") {
    return (
      <NewsletterCapture
        sourcePage={sourcePage}
        title="Unlock our trek planning toolkit"
        subtitle="Get packing lists, permit guides, and budget calculators — free for subscribers."
      />
    );
  }

  // inspiration / default
  return <NewsletterCapture sourcePage={sourcePage} />;
}
