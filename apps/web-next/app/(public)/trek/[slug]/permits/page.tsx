import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { fetchCMSPage, type CMSPage, type FAQItem } from "@/lib/api";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion from "@/components/content/FAQAccordion";
import SchemaInjector from "@/components/seo/SchemaInjector";
import AuthorBlock from "@/components/content/AuthorBlock";
import { buildArticleSchema, buildFAQSchema } from "@/lib/schema";
import { FileCheck } from "lucide-react";
import Link from "next/link";

export const dynamicParams = true;
export const revalidate = 60;

function trekDisplayName(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

async function findPermitPage(trekSlug: string): Promise<CMSPage | null> {
  const candidates = [
    `${trekSlug}-permit-guide`,
    `${trekSlug}-permits`,
    `${trekSlug}-trekking-permit`,
  ];
  for (const candidate of candidates) {
    try {
      const page = await fetchCMSPage(candidate);
      if (page.status === "published" && page.page_type === "permit_guide") return page;
    } catch { /* try next */ }
  }
  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await findPermitPage(params.slug);
  const trekName = trekDisplayName(params.slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const title = (page?.seo_title?.replace(/\s*\|\s*TrekYatra\s*$/i, "").trim()) || `${trekName} Permit Guide`;
  const description = page?.seo_description ?? `Permit requirements, costs, and how to get them for the ${trekName}.`;
  const canonical = `${siteUrl}/trek/${params.slug}/permits`;
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
  };
}

export default async function TrekPermitsPage({ params }: { params: { slug: string } }) {
  const page = await findPermitPage(params.slug);
  // No dedicated permit guide for this trek → the permit info lives inline on the main trek page.
  // 308 there instead of 404 (kills the historical GSC 404s for /trek/{slug}/permits).
  if (!page) permanentRedirect(`/trek/${params.slug}`);

  const sec = (page.content_json?.sections ?? {}) as Record<string, string>;
  const faqItems: FAQItem[] = page.content_json?.faqs ?? [];
  const trekName = trekDisplayName(params.slug);

  const articleSchema = buildArticleSchema({
    title: page.seo_title ?? page.title,
    description: page.seo_description ?? "",
    url: `/trek/${params.slug}/permits`,
    publishedAt: page.published_at ?? undefined,
    updatedAt: page.updated_at ?? undefined,
  });

  return (
    <>
      <SchemaInjector schemas={[articleSchema, faqItems.length ? buildFAQSchema(faqItems) : null]} />
      <section className="bg-gradient-to-br from-background via-background to-accent/5 border-b border-border py-14">
        <div className="container-wide max-w-3xl">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: trekName, href: `/trek/${params.slug}` },
            { label: "Permit Guide" },
          ]} />
          <div className="flex items-center gap-3 mt-5 mb-4">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
              <FileCheck className="h-5 w-5" />
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Permit guide</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">{page.title}</h1>
          {page.seo_description && (
            <p className="text-lg text-muted-foreground">{page.seo_description}</p>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container-wide max-w-3xl">
          <article className="prose prose-lg max-w-none">
            {sec.permits && <div className="not-prose cms-section mb-8" dangerouslySetInnerHTML={{ __html: sec.permits }} />}
            {page.content_html && !sec.permits && (
              <div className="not-prose cms-section mb-8" dangerouslySetInnerHTML={{ __html: page.content_html }} />
            )}
          </article>
          {faqItems.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold mb-4">FAQs</h2>
              <FAQAccordion items={faqItems} />
            </div>
          )}
          <div className="mt-10 flex items-center gap-4 text-sm text-muted-foreground">
            <Link href={`/trek/${params.slug}`} className="text-accent font-medium">← Back to {trekName} guide</Link>
            <span>·</span>
            <Link href="/permits" className="hover:text-foreground">All permit guides</Link>
          </div>
          <AuthorBlock publishedAt={page.published_at} updatedAt={page.updated_at} />
        </div>
      </section>
    </>
  );
}
