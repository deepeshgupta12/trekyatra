import type { Metadata } from "next";
import { ContentPage } from "@/components/content/ContentPage";
import { FileCheck } from "lucide-react";
import { fetchCMSPage } from "@/lib/api";

export const dynamic = "force-dynamic";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const LOGO_URL = `${SITE_URL}/images/Logo_Trekyatra.png`;
const AUTHOR = { "@type": "Organization", name: "TrekYatra Editorial Team", url: `${SITE_URL}/about/authors` };
const PUBLISHER = { "@type": "Organization", name: "TrekYatra", url: SITE_URL, logo: { "@type": "ImageObject", url: LOGO_URL } };

export async function generateMetadata(): Promise<Metadata> {
  const cms = await fetchCMSPage("terms").catch(() => null);
  return {
    title: cms?.seo_title ?? "Terms & Conditions — TrekYatra",
    description: cms?.seo_description ?? "TrekYatra's terms and conditions — the rules for using our trekking guide platform, digital products, and content.",
    alternates: { canonical: `${SITE_URL}/terms` },
    robots: { index: true, follow: false },
    authors: [{ name: "TrekYatra Editorial Team", url: `${SITE_URL}/about/authors` }],
    creator: "TrekYatra", publisher: "TrekYatra",
  };
}

export default async function Terms() {
  const cms = await fetchCMSPage("terms").catch(() => null);
  if (cms?.status === "published") {
    const schema = { "@context": "https://schema.org", "@type": "WebPage", name: cms.title, description: cms.seo_description ?? "", url: `${SITE_URL}/terms`, author: AUTHOR, publisher: PUBLISHER };
    return (
      <section className="container-wide py-16 lg:py-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">{cms.title}</h1>
        {cms.seo_description && <p className="text-xl text-foreground/70 mb-12 max-w-2xl">{cms.seo_description}</p>}
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: cms.content_html }} />
      </section>
    );
  }
  const staticSchema = { "@context": "https://schema.org", "@type": "WebPage", name: "Terms & Conditions — TrekYatra", description: "TrekYatra's terms and conditions for using our trekking guide platform.", url: `${SITE_URL}/terms`, author: AUTHOR, publisher: PUBLISHER };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(staticSchema) }} />
      <ContentPage
        eyebrow="Legal"
        title="Terms & Conditions"
      subtitle="By using TrekYatra, you agree to these terms. Last updated: May 2026."
      icon={FileCheck}
      blocks={[
        {
          title: "1. Acceptance of terms",
          body: "By accessing or using TrekYatra (trekyatra.in), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should not use our service.",
        },
        {
          title: "2. Nature of the service",
          body: "TrekYatra is an editorial information platform. We provide trekking guides, permit information, cost estimates, and planning tools for Indian trekking destinations. We are not a trek booking platform, travel agent, or tour operator. We do not sell trek packages and do not hold any booking deposits on your behalf.",
        },
        {
          title: "3. Accuracy of information",
          bullets: [
            "Trek information, permit rules, and costs change frequently. While we re-verify data regularly, we cannot guarantee real-time accuracy.",
            "Always cross-check critical permit information with the relevant state tourism board or forest department before your trek.",
            "Cost estimates are indicative. Actual costs will vary by season, group size, and operator.",
            "Weather and route conditions are dynamic. Always check conditions with a local operator or guide before departure.",
          ],
        },
        {
          title: "4. User accounts",
          body: "You are responsible for maintaining the confidentiality of your account credentials. You must not share your account, use another person's account, or use automated means to access our service. We reserve the right to suspend accounts that violate these terms.",
        },
        {
          title: "5. User-generated content",
          body: "If you submit reviews, comments, or other content to TrekYatra, you grant us a non-exclusive, royalty-free licence to use, display, and distribute that content on our platform. You represent that you own the content or have the right to submit it.",
        },
        {
          title: "6. Affiliate links",
          body: "Some links on TrekYatra are affiliate links. We may earn a commission if you make a purchase through these links, at no additional cost to you. This does not influence our editorial recommendations. See our full Affiliate Disclosure at /affiliate-disclosure.",
        },
        {
          title: "7. Limitation of liability",
          body: "TrekYatra provides information for planning purposes only. Trekking involves inherent physical risk. We are not liable for any injury, death, loss, damage, or expense arising from the use of information on this platform. You undertake trekking activities at your own risk. Always trek with a qualified guide in unfamiliar terrain.",
        },
        {
          title: "8. Changes to terms",
          body: "We may update these Terms at any time. Continued use of TrekYatra after changes constitutes acceptance of the new terms. Material changes will be communicated via email to registered users.",
        },
        {
          title: "9. Governing law",
          body: "These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts of Gurgaon, Haryana.",
        },
        {
          title: "Contact",
          body: "For questions about these Terms: hello@trekyatra.in",
        },
      ]}
    />
    </>
  );
}
