import type { Metadata } from "next";
import { fetchCMSPage, type CMSPage, type FAQItem } from "@/lib/api";
import { fetchTreks } from "@/lib/trekApi";
import { TrekCard } from "@/components/trek/TrekCard";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion from "@/components/content/FAQAccordion";
import AuthorBlock from "@/components/content/AuthorBlock";
import SafetyDisclaimer from "@/components/content/SafetyDisclaimer";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildArticleSchema, buildFAQSchema } from "@/lib/schema";
import { Compass, Star } from "lucide-react";

export async function generateStaticParams() {
  const treks = await fetchTreks();
  return treks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* not found */ }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const title = cmsPage?.seo_title
    ? `${cmsPage.seo_title} | TrekYatra`
    : `Guide — ${params.slug.replace(/-/g, " ")} | TrekYatra`;
  const description = cmsPage?.seo_description ?? "A curated beginner-friendly trekking guide.";
  const canonical = `${siteUrl}/guides/${params.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GuidePage({ params }: { params: { slug: string } }) {
  const [treksRaw] = await Promise.all([fetchTreks()]);
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* static fallback */ }

  const sec = (cmsPage?.content_json?.sections ?? {}) as Record<string, string>;
  const faqItems: FAQItem[] = cmsPage?.content_json?.faqs ?? [];
  const pageTitle = cmsPage?.title ?? `${params.slug.replace(/-/g, " ")} Guide`;
  const beginnerTreks = treksRaw.filter(t => t.beginner).slice(0, 6);
  const articleSchema = buildArticleSchema({
    title: cmsPage?.seo_title ?? pageTitle,
    description: cmsPage?.seo_description ?? "",
    url: `/guides/${params.slug}`,
    publishedAt: cmsPage?.published_at ?? undefined,
    updatedAt: cmsPage?.updated_at ?? undefined,
  });

  return (
    <>
      <SchemaInjector schemas={[articleSchema, faqItems.length ? buildFAQSchema(faqItems) : null]} />
      <section className="bg-gradient-to-br from-background to-success/5 border-b border-border py-14">
        <div className="container-wide max-w-4xl">
          <Breadcrumb items={[
            { label: "Guides", href: "/beginner" },
            { label: pageTitle.split(":")[0] },
          ]} />
          <div className="flex items-center gap-3 mt-5 mb-4">
            <div className="h-10 w-10 rounded-xl bg-success/15 flex items-center justify-center text-success">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Beginner guide</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">{pageTitle}</h1>
          {cmsPage?.seo_description && (
            <p className="text-lg text-muted-foreground max-w-2xl">{cmsPage.seo_description}</p>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container-wide max-w-4xl space-y-12">
          <SafetyDisclaimer />

          {sec.why_this_trek && (
            <div className="cms-section prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: sec.why_this_trek }} />
          )}

          {beginnerTreks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Star className="h-5 w-5 text-accent" />
                <h2 className="font-display text-2xl font-semibold">Recommended treks</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beginnerTreks.map(t => <TrekCard key={t.slug} trek={t} />)}
              </div>
            </div>
          )}

          {sec.difficulty && (
            <div>
              <h2 className="font-display text-2xl font-semibold mb-4">Fitness & preparation</h2>
              <div className="cms-section prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: sec.difficulty }} />
            </div>
          )}

          {faqItems.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold mb-4">Frequently asked questions</h2>
              <FAQAccordion items={faqItems} />
            </div>
          )}

          <AuthorBlock publishedAt={cmsPage?.published_at} updatedAt={cmsPage?.updated_at} />
        </div>
      </section>
    </>
  );
}
