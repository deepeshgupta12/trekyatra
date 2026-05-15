import { ContentPage } from "@/components/content/ContentPage";
import { FileCheck } from "lucide-react";
import { fetchCMSPage } from "@/lib/api";

export default async function Methodology() {
  const cms = await fetchCMSPage("editorial-methodology").catch(() => null);
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
      eyebrow="Methodology"
      title="How we research, write & verify"
      subtitle="Our editorial process, freshness standards, and safety-first principles. Last updated: May 2026."
      icon={FileCheck}
      blocks={[
        {
          title: "Who writes our content",
          body: "Every trek guide on TrekYatra is written by someone who has personally completed the trek, or co-authored with a contributor who has. We do not accept AI-generated first drafts as final editorial content. We do not accept content from operators without full editorial independence.\n\nContributors are required to disclose: the date of their last visit to the trek, their experience level, and any commercial relationship with operators on that route.",
        },
        {
          title: "The verification cycle",
          bullets: [
            "Trek permit pages: re-verified every 14 days using official Forest Department and State Tourism Board sources",
            "Cost estimates: updated at the start of each trekking season (pre-winter, pre-summer, pre-monsoon)",
            "Emergency contacts and evacuation details: verified annually with local SDRF and district administration",
            "Operator listings: reviewed quarterly for accuracy and service quality",
            "All pages carry a visible 'Last updated' date — we never let guides silently go stale",
          ],
        },
        {
          title: "How we handle YMYL content",
          body: "Trek guides fall into the 'Your Money or Your Life' (YMYL) category because inaccurate permit information can result in fines or arrest, and inaccurate safety information can result in injury or death. We apply stricter verification standards to these pages:\n\n- All safety claims must cite a specific source (Forest Department notification, IMD bulletin, or first-hand field observation)\n- Any claim about altitude hazard, medical risk, or emergency evacuation is reviewed by a second editor before publication\n- Disputed safety claims are marked with a caveat and escalated for verification before they are updated",
        },
        {
          title: "Affiliate and commercial independence",
          body: "Editorial decisions are made before affiliate link decisions — never the other way around. If we recommend a piece of gear, we add an affiliate link after the editorial decision. We never write a recommendation to justify an existing affiliate relationship.\n\nFor trek and operator recommendations, we accept no payment for ranking positions. Operators are listed by region and service quality, not by spend.",
        },
        {
          title: "Error correction policy",
          body: "We correct errors within 48 hours of being notified. For safety-critical errors (wrong permit rules, wrong emergency contacts, incorrect altitude data), we aim to correct within 6 hours.\n\nIf you find an error, email hello@trekyatra.in with the subject 'Correction'. We will acknowledge receipt and confirm the correction once made. We do not silently fix errors — we add a correction note to the relevant page.",
        },
        {
          title: "AI and technology use",
          body: "TrekYatra uses AI assistance to accelerate research, identify topic gaps, and draft initial content structures. However, all published content is reviewed, edited, and verified by a human editor who has knowledge of the specific trek or topic. AI-generated content that cannot be verified against primary sources is not published.\n\nWe are transparent about this. If you have questions about our use of AI in the editorial process, email hello@trekyatra.in.",
        },
        {
          title: "Feedback and accountability",
          body: "We publish this methodology page because we believe editorial transparency builds trust. We update it whenever our process changes. If you believe our process is being violated on a specific page, email us — we investigate every complaint.",
        },
      ]}
    />
  );
}
