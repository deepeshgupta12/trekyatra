import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchCMSPage, type CMSPage, type FAQItem } from "@/lib/api";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion from "@/components/content/FAQAccordion";
import SchemaInjector from "@/components/seo/SchemaInjector";
import AuthorBlock from "@/components/content/AuthorBlock";
import { buildArticleSchema, buildFAQSchema } from "@/lib/schema";
import { Backpack } from "lucide-react";
import Link from "next/link";

export const dynamicParams = true;
export const revalidate = 60;

function trekDisplayName(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

async function findPackingPage(trekSlug: string): Promise<CMSPage | null> {
  const candidates = [
    `${trekSlug}-packing-list`,
    `${trekSlug}-packing`,
    `${trekSlug}-gear-list`,
  ];
  for (const candidate of candidates) {
    try {
      const page = await fetchCMSPage(candidate);
      if (page.status === "published" && page.page_type === "packing_list") return page;
    } catch { /* try next candidate */ }
  }
  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await findPackingPage(params.slug);
  const trekName = trekDisplayName(params.slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const title = page?.seo_title ? `${page.seo_title} | TrekYatra` : `${trekName} Packing List | TrekYatra`;
  const description = page?.seo_description ?? `Complete packing list and gear guide for the ${trekName}.`;
  const canonical = `${siteUrl}/trek/${params.slug}/packing`;
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
  };
}

export default async function TrekPackingPage({ params }: { params: { slug: string } }) {
  const page = await findPackingPage(params.slug);
  if (!page) notFound();

  const sec = (page.content_json?.sections ?? {}) as Record<string, string>;
  const faqItems: FAQItem[] = page.content_json?.faqs ?? [];
  const trekName = trekDisplayName(params.slug);

  const articleSchema = buildArticleSchema({
    title: page.seo_title ?? page.title,
    description: page.seo_description ?? "",
    url: `/trek/${params.slug}/packing`,
    publishedAt: page.published_at ?? undefined,
    updatedAt: page.updated_at ?? undefined,
    imageUrl: page.hero_image_url ?? undefined,
  });

  return (
    <>
      <SchemaInjector schemas={[articleSchema, faqItems.length ? buildFAQSchema(faqItems) : null]} />
      <section className="bg-gradient-to-br from-background via-background to-accent/5 border-b border-border py-14">
        <div className="container-wide max-w-3xl">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: trekName, href: `/trek/${params.slug}` },
            { label: "Packing List" },
          ]} />
          <div className="flex items-center gap-3 mt-5 mb-4">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
              <Backpack className="h-5 w-5" />
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Packing list</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">{page.title}</h1>
          {page.seo_description && (
            <p className="text-lg text-muted-foreground">{page.seo_description}</p>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container-wide max-w-3xl">
          {page.hero_image_url && (
            <img src={page.hero_image_url} alt={page.title} className="w-full rounded-2xl mb-8 max-h-64 object-cover" />
          )}
          <article className="prose prose-lg max-w-none">
            {sec.why_this_trek && <div className="not-prose cms-section mb-8" dangerouslySetInnerHTML={{ __html: sec.why_this_trek }} />}
            {page.content_html && !sec.why_this_trek && (
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
            <Link href="/packing" className="hover:text-foreground">All packing lists</Link>
          </div>
          <AuthorBlock publishedAt={page.published_at} updatedAt={page.updated_at} />
        </div>
      </section>
    </>
  );
}
