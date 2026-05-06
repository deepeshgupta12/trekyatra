import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCMSPage, type CMSPage, type FAQItem } from "@/lib/api";
import FAQAccordion from "@/components/content/FAQAccordion";
import Breadcrumb from "@/components/content/Breadcrumb";
import AuthorBlock from "@/components/content/AuthorBlock";
import { fetchTreks } from "@/lib/trekApi";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const treks = await fetchTreks();
    return treks.map((t) => ({ slug: t.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug, "hi");
    if (page.status === "published" && page.language === "hi") cmsPage = page;
  } catch { /* not found */ }

  const title = cmsPage?.seo_title
    ? `${cmsPage.seo_title} | TrekYatra`
    : `${params.slug.replace(/-/g, " ")} — पैकिंग लिस्ट | TrekYatra`;
  const description = cmsPage?.seo_description ?? "";
  const canonicalHi = `${siteUrl}/hi/packing/${params.slug}`;
  const canonicalEn = `${siteUrl}/packing/${params.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalHi,
      languages: { "en": canonicalEn, "hi": canonicalHi },
    },
    openGraph: { title, description, url: canonicalHi, type: "article" },
  };
}

export default async function HiPackingPage({ params }: { params: { slug: string } }) {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug, "hi");
    if (page.status === "published" && page.language === "hi") cmsPage = page;
  } catch { /* not found */ }

  if (!cmsPage) notFound();

  const faqs: FAQItem[] = cmsPage.content_json?.faqs ?? [];

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Packing Lists", href: "/packing" },
          { label: cmsPage.title, href: `/hi/packing/${params.slug}` },
        ]}
      />

      <div className="bg-accent/10 border-b border-accent/20 py-2 px-4 text-center text-sm text-accent">
        यह पृष्ठ हिंदी में है।{" "}
        <Link href={`/packing/${params.slug}`} className="underline font-medium">
          Read in English →
        </Link>
      </div>

      <article className="container-wide py-10 max-w-3xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
          {cmsPage.title}
        </h1>

        {cmsPage.hero_image_url && (
          <img
            src={cmsPage.hero_image_url}
            alt={cmsPage.title}
            className="w-full rounded-2xl mb-8 object-cover max-h-80"
          />
        )}

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: cmsPage.content_html }}
        />

        {faqs.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold mb-4">अक्सर पूछे जाने वाले सवाल</h2>
            <FAQAccordion items={faqs} />
          </section>
        )}

        <div className="mt-10"><AuthorBlock /></div>

        <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground">
          <Link href={`/packing/${params.slug}`} className="text-accent hover:underline">
            ← Read full packing list in English
          </Link>
        </div>
      </article>
    </>
  );
}
