import { ContentPage } from "@/components/content/ContentPage";
import { FileCheck } from "lucide-react";
import { fetchCMSPage } from "@/lib/api";

export default async function AffiliateDisclosure() {
  const cms = await fetchCMSPage("affiliate-disclosure").catch(() => null);
  if (cms?.status === "published") {
    return (
      <section className="container-wide py-16 lg:py-24">
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">{cms.title}</h1>
        {cms.seo_description && <p className="text-xl text-foreground/70 mb-12 max-w-2xl">{cms.seo_description}</p>}
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: cms.content_html }} />
      </section>
    );
  }
  return (
    <ContentPage
      eyebrow="Disclosure"
      title="Affiliate Disclosure"
      subtitle="How we make money — and why it does not affect what we write. Last updated: May 2026."
      icon={FileCheck}
      blocks={[
        {
          title: "What this page is",
          body: "TrekYatra uses affiliate links on some gear, product, and booking pages. This means that if you click a link and make a purchase, we may earn a small commission — at no additional cost to you. This page explains exactly how we use affiliate relationships, and our commitment to making sure they never influence our editorial content.",
        },
        {
          title: "Where you will find affiliate links",
          bullets: [
            "Gear guides: trekking shoes, backpacks, jackets, trekking poles, GPS watches",
            "Digital product pages: links to purchase products on third-party platforms",
            "Seasonal kit recommendations within trek guides",
            "Newsletter recommendations when we mention specific gear",
          ],
        },
        {
          title: "Where you will NOT find paid influence",
          bullets: [
            "Trek ranking and recommendation pages — treks are ordered by merit (difficulty, seasonality, beginner-fit), not by who pays us",
            "Operator listings — operators are listed alphabetically by region, not by fee paid",
            "Permit guides — no affiliate relationship with any permit or booking platform",
            "Editorial comparisons — comparison tables use real data, not manufacturer-provided scores",
          ],
        },
        {
          title: "Our affiliate partners",
          body: "We work with affiliate programmes from: Amazon India, gear brand affiliate programmes (where available), and select digital download platforms. We only link to products our editorial team has reviewed or used. We do not accept payment to recommend products we have not evaluated.",
        },
        {
          title: "How we maintain independence",
          bullets: [
            "Affiliate links are chosen after editorial decisions are made — never before",
            "If we cannot find a product we genuinely recommend, we do not add an affiliate link to a category",
            "We periodically review affiliate relationships and remove any that create conflicts",
            "All affiliate links are marked on the page or in the section header",
          ],
        },
        {
          title: "Legal compliance",
          body: "This disclosure is provided in accordance with the Federal Trade Commission (FTC) guidelines for endorsements and testimonials, and equivalent Indian advertising standards. By using TrekYatra, you acknowledge that some links may generate affiliate revenue for us.",
        },
        {
          title: "Questions",
          body: "If you have any questions about our affiliate relationships or believe a recommendation is biased, email us at hello@trekyatra.in. We take editorial independence seriously and will investigate every concern.",
        },
      ]}
    />
  );
}
