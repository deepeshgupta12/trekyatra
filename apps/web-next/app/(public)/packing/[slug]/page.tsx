import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCMSPage, type CMSPage, type FAQItem } from "@/lib/api";
import { fetchTreks } from "@/lib/trekApi";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion from "@/components/content/FAQAccordion";
import AuthorBlock from "@/components/content/AuthorBlock";
import AffiliateDisclosure from "@/components/content/AffiliateDisclosure";
import UpdatedBadge from "@/components/content/UpdatedBadge";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildArticleSchema, buildFAQSchema } from "@/lib/schema";
import { Backpack, CheckSquare, ShoppingBag } from "lucide-react";
import Link from "next/link";

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
    : `Packing List — ${params.slug.replace(/-/g, " ")} | TrekYatra`;
  const description = cmsPage?.seo_description ?? "Complete packing checklist for your Himalayan trek.";
  const canonical = `${siteUrl}/packing/${params.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PackingPage({ params }: { params: { slug: string } }) {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* render static fallback */ }

  const sec = (cmsPage?.content_json?.sections ?? {}) as Record<string, string>;
  const faqItems: FAQItem[] = cmsPage?.content_json?.faqs ?? [];
  const pageTitle = cmsPage?.title ?? `${params.slug.replace(/-/g, " ")} — Packing List`;
  const articleSchema = buildArticleSchema({
    title: cmsPage?.seo_title ?? pageTitle,
    description: cmsPage?.seo_description ?? "",
    url: `/packing/${params.slug}`,
    publishedAt: cmsPage?.published_at ?? undefined,
    updatedAt: cmsPage?.updated_at ?? undefined,
  });

  return (
    <>
      <SchemaInjector schemas={[articleSchema, faqItems.length ? buildFAQSchema(faqItems) : null]} />
      <section className="bg-gradient-to-br from-background via-background to-accent/5 border-b border-border py-14">
        <div className="container-wide max-w-3xl">
          <Breadcrumb items={[
            { label: "Packing lists", href: "/packing" },
            { label: pageTitle.split(":")[0] },
          ]} />
          <div className="flex items-center gap-3 mt-5 mb-4">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
              <Backpack className="h-5 w-5" />
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Packing list</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">{pageTitle}</h1>
          {cmsPage?.seo_description && (
            <p className="text-lg text-muted-foreground">{cmsPage.seo_description}</p>
          )}
          <div className="mt-4">
            <AffiliateDisclosure />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-wide max-w-3xl space-y-10">
          {sec.packing ? (
            <div className="cms-section prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: sec.packing }} />
          ) : (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-accent" /> Essential gear
              </h2>
              {[
                "Layered clothing (thermal base, mid fleece, waterproof outer shell)",
                "Sturdy waterproof trekking boots (broken in before the trek)",
                "Trekking poles for steep ascents and descents",
                "Headlamp with extra batteries",
                "Sunscreen SPF 50+ and UV-blocking sunglasses",
                "2 × 1L water bottles or a hydration pack (2L minimum)",
                "Personal first-aid kit including altitude medication",
                "Rain cover for your backpack",
                "Warm sleeping bag rated to -10°C",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 p-4 bg-card border border-border rounded-2xl">
                  <CheckSquare className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          )}

          {sec.safety && (
            <div>
              <h2 className="font-display text-2xl font-semibold mb-4">Safety essentials</h2>
              <div className="cms-section prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: sec.safety }} />
            </div>
          )}

          {faqItems.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold mb-4">Packing FAQs</h2>
              <FAQAccordion items={faqItems} />
            </div>
          )}

          <div className="p-5 bg-card border border-border rounded-2xl flex items-start gap-3">
            <ShoppingBag className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Need gear?</strong> Browse our curated <Link href="/gear" className="text-accent underline">gear recommendations</Link> or get a <Link href="/plan" className="text-accent underline">personalised kit list</Link> from our team.
            </div>
          </div>

          <AuthorBlock publishedAt={cmsPage?.published_at} updatedAt={cmsPage?.updated_at} />
        </div>
      </section>
    </>
  );
}
