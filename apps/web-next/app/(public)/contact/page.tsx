import type { Metadata } from "next";
import { ContentPage } from "@/components/content/ContentPage";
import { Mail } from "lucide-react";
import { fetchCMSPage } from "@/lib/api";

export const dynamic = "force-dynamic";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const LOGO_URL = `${SITE_URL}/images/Logo_Trekyatra.png`;
const AUTHOR = { "@type": "Organization", name: "TrekYatra Editorial Team", url: `${SITE_URL}/about/authors` };
const PUBLISHER = { "@type": "Organization", name: "TrekYatra", url: SITE_URL, logo: { "@type": "ImageObject", url: LOGO_URL } };

export async function generateMetadata(): Promise<Metadata> {
  const cms = await fetchCMSPage("contact").catch(() => null);
  return {
    title: cms?.seo_title ?? "Contact TrekYatra — Get in Touch",
    description: cms?.seo_description ?? "Contact TrekYatra for editorial corrections, partnership enquiries, or product support. We respond within 2 business days.",
    alternates: { canonical: `${SITE_URL}/contact` },
    authors: [{ name: "TrekYatra Editorial Team", url: `${SITE_URL}/about/authors` }],
    creator: "TrekYatra", publisher: "TrekYatra",
  };
}

export default async function Contact() {
  const cms = await fetchCMSPage("contact").catch(() => null);
  if (cms?.status === "published") {
    const schema = { "@context": "https://schema.org", "@type": "ContactPage", name: cms.title, description: cms.seo_description ?? "", url: `${SITE_URL}/contact`, author: AUTHOR, publisher: PUBLISHER };
    return (
      <section className="container-wide py-16 lg:py-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">{cms.title}</h1>
        {cms.seo_description && <p className="text-xl text-foreground/70 mb-12 max-w-2xl">{cms.seo_description}</p>}
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: cms.content_html }} />
      </section>
    );
  }
  const staticSchema = { "@context": "https://schema.org", "@type": "ContactPage", name: "Contact TrekYatra", description: "Contact TrekYatra for editorial corrections, partnerships, or support.", url: `${SITE_URL}/contact`, author: AUTHOR, publisher: PUBLISHER };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(staticSchema) }} />
      <ContentPage
        eyebrow="Contact"
      title="Get in touch"
      subtitle="Press, partnerships, planning help, or data corrections — we respond within 48 hours."
      icon={Mail}
      blocks={[
        {
          eyebrow: "Reach us",
          title: "Contact channels",
          cards: [
            { title: "General enquiries", body: "hello@trekyatra.in — questions, feedback, planning help, and partnership proposals." },
            { title: "Content corrections", body: "Found outdated permit data or a factual error? Email hello@trekyatra.in with subject 'Data Correction'. We act within 48 hours." },
            { title: "Press & media", body: "hello@trekyatra.in with subject 'Press'. We are happy to speak to journalists covering Indian trekking or adventure travel." },
          ],
        },
        {
          title: "Office",
          body: "TrekYatra\nGurgaon, Haryana, India 122001\nhello@trekyatra.in",
        },
        {
          title: "Response times",
          bullets: [
            "General emails: within 48 hours on business days",
            "Urgent safety or data corrections: same day — mark subject 'URGENT'",
            "Partnership and press enquiries: within 5 business days",
            "We do not respond to SEO link-exchange requests",
          ],
        },
        {
          title: "Common questions",
          bullets: [
            "Can I contribute a trek guide? Yes — email us a draft or outline. We pay contributors fairly.",
            "Do you accept sponsored content? No. Editorial independence is non-negotiable.",
            "Can operators list on TrekYatra? Yes — email us for operator onboarding.",
            "Do you offer personalised planning? Yes — use the free Trip Planner at /plan.",
          ],
        },
      ]}
    />
    </>
  );
}
