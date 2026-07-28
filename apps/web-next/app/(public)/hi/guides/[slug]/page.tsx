import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCMSPage, type CMSPage, type FAQItem } from "@/lib/api";
import FAQAccordion from "@/components/content/FAQAccordion";
import Breadcrumb from "@/components/content/Breadcrumb";
import AuthorBlock from "@/components/content/AuthorBlock";
import { fetchTreks } from "@/lib/trekApi";

// ISR — safe now that fetchCMSPage is ISR-cacheable (no `no-store`). Cache-clear busts
// it via /api/revalidate. See trek/[slug]/page.tsx for the full rationale.
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug, "hi");
    if (page.status === "published" && page.language === "hi") cmsPage = page;
  } catch { /* not found */ }

  const title = cmsPage?.seo_title
    ? `${cmsPage.seo_title} | TrekYatra`
    : `${params.slug.replace(/-/g, " ")} — गाइड | TrekYatra`;
  const description = cmsPage?.seo_description ?? "";
  const canonicalHi = `${siteUrl}/hi/guides/${params.slug}`;
  const canonicalEn = `${siteUrl}/guides/${params.slug}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: canonicalHi,
      languages: {
        "en": canonicalEn,
        "hi": canonicalHi,
        "x-default": canonicalEn,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalHi,
      type: "article",
      locale: "hi_IN",
      alternateLocale: ["en_US"],
      siteName: "TrekYatra",
      images: cmsPage?.hero_image_url
        ? [{ url: cmsPage.hero_image_url, width: 1200, height: 630, alt: title }]
        : [],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HiGuidePage({ params }: { params: { slug: string } }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug, "hi");
    if (page.status === "published" && page.language === "hi") cmsPage = page;
  } catch { /* not found */ }

  if (!cmsPage) notFound();

  const faqs: FAQItem[] = cmsPage.content_json?.faqs ?? [];
  const canonicalEn = `${siteUrl}/guides/${params.slug}`;
  const canonicalHi = `${siteUrl}/hi/guides/${params.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "inLanguage": "hi-IN",
    "headline": cmsPage.title,
    "description": cmsPage.seo_description ?? "",
    "url": canonicalHi,
    "image": cmsPage.hero_image_url ?? undefined,
    "author": { "@type": "Person", "name": "Deepesh Kumar Gupta", "url": `${siteUrl}/about/authors` },
    "publisher": { "@type": "Organization", "name": "TrekYatra", "url": siteUrl },
    "sameAs": [canonicalEn],
  };

  const faqSchema = faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "inLanguage": "hi-IN",
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": { "@type": "Answer", "text": faq.a },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <Breadcrumb
        items={[
          { label: "होम", href: "/" },
          { label: "गाइड्स", href: "/guides" },
          { label: cmsPage.title, href: `/hi/guides/${params.slug}` },
        ]}
      />

      <div className="bg-accent/10 border-b border-accent/20 py-2 px-4 text-center text-sm text-accent">
        यह पृष्ठ हिंदी में है।{" "}
        <Link href={canonicalEn} className="underline font-medium">Read in English →</Link>
      </div>

      <article className="container-wide py-10 max-w-3xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
          {cmsPage.title}
        </h1>

        {cmsPage.hero_image_url && (
          <img src={cmsPage.hero_image_url} alt={cmsPage.title}
            className="w-full rounded-2xl mb-8 object-cover max-h-80" />
        )}

        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: cmsPage.content_html }} />

        {faqs.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold mb-4">अक्सर पूछे जाने वाले सवाल</h2>
            <FAQAccordion items={faqs} />
          </section>
        )}

        <div className="mt-10"><AuthorBlock /></div>

        <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground">
          <Link href={canonicalEn} className="text-accent hover:underline">← Read full guide in English</Link>
        </div>
      </article>
    </>
  );
}
