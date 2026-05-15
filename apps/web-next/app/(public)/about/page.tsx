import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";
import { fetchCMSPage } from "@/lib/api";

export default async function About() {
  const cms = await fetchCMSPage("about").catch(() => null);
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
      eyebrow="About TrekYatra"
      title="Why we built TrekYatra"
      subtitle="Because Indian trekking deserves better than generic blog content — and trekkers deserve information they can trust with their lives."
      icon={Mountain}
      blocks={[
        {
          title: "Our story",
          body: "TrekYatra started from a single frustration: every trekking resource online was either hopelessly outdated, vague about permits, or quietly promoting the operator who paid for placement. We spent three months getting permit status wrong, cost estimates wrong, and nearly booking a trek that was closed for the season. We built TrekYatra so no trekker has to waste those months.\n\nToday, TrekYatra covers 250+ Indian treks across 32 states and regions, with guides written by people who have done the treks, permit information re-verified every 14 days, and cost breakdowns that include the things other sites conveniently leave out.",
        },
        {
          title: "Our editorial promises",
          bullets: [
            "Every guide is written by someone who has done the trek — not an AI summary of other blog posts",
            "Every permit page is re-verified every 14 days using official forest department and state tourism board sources",
            "Every cost estimate includes hidden costs: base-town travel, gear rental, tips for trek staff, and buffer days",
            "Every comparison is built from real trail data, not operator marketing copy",
            "Every page carries a visible updated date — we do not let guides silently go stale",
            "No paid placement in editorial rankings — operators appear because of merit, not spend",
            "Full affiliate disclosure on every gear and product recommendation",
          ],
        },
        {
          title: "What we are building",
          body: "TrekYatra is not a booking platform. We do not earn commissions from operators to rank them higher. We are building the trekking intelligence platform we wished had existed: an honest, editorial source that helps you choose the right trail, plan it correctly, and walk it with confidence.\n\nLong-term, we are building toward a platform that covers every significant Indian trail — from weekend Sahyadri hikes to high Himalayan passes — with the same level of editorial rigour on each.",
        },
        {
          title: "The team",
          body: "TrekYatra is built by a small team of trekkers, writers, and engineers based in Gurgaon, India. Our editorial team has completed 80+ Himalayan and Sahyadri treks between them. We are not professional mountaineers — we are exactly the kind of trekkers you are: people with day jobs, limited leave, and a genuine need to get into the mountains.\n\nThat is why we cover what real trekkers need to know, not just what sounds good in a brochure.",
        },
        {
          title: "Contact us",
          body: "For press, partnerships, or content corrections: hello@trekyatra.in — we respond within 48 hours.\n\nFor planning help: use the free Trip Planner at /plan.\n\nFor urgent safety corrections or outdated permit data: mark your email subject 'URGENT — Data Correction' and we will act on it same day.",
        },
      ]}
    />
  );
}
