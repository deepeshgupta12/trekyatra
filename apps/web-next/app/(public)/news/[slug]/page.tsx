import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchNewsArticle, type NewsArticle, type FAQItem } from "@/lib/api";
import SchemaInjector from "@/components/seo/SchemaInjector";
import FAQAccordion from "@/components/content/FAQAccordion";
import TableOfContents from "@/components/content/TableOfContents";
import Breadcrumb from "@/components/content/Breadcrumb";
import AuthorBlock from "@/components/content/AuthorBlock";
import { buildBreadcrumbSchema, buildFAQSchema } from "@/lib/schema";
import { Calendar, Newspaper, ChevronRight, ExternalLink, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";

function extractTocItems(html: string): { id: string; label: string }[] {
  const re = /<h2[^>]+id="([^"]+)"[^>]*>([^<]*(?:<(?!\/h2>)[^<]*)*)<\/h2>/gi;
  const matches = Array.from(html.matchAll(re));
  return matches.map((m) => ({
    id: m[1],
    label: m[2].replace(/<[^>]+>/g, "").trim(),
  }));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let article: NewsArticle | null = null;
  try {
    article = await fetchNewsArticle(params.slug);
  } catch { /* not found */ }

  if (!article) return { title: "News Article Not Found" };

  const title = article.seo_title ?? article.title;
  const description = article.seo_description ?? "";
  const canonicalUrl = `${SITE_URL}/news/${params.slug}`;
  const trekSlug = article.content_json?.trek_slug;

  return {
    title,
    description,
    keywords: trekSlug
      ? [trekSlug.replace(/-/g, " "), "trek news", "India trekking"]
      : ["India trek news"],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: "TrekYatra",
      locale: "en_IN",
      publishedTime: article.published_at ?? article.created_at,
      modifiedTime: article.updated_at,
      authors: ["TrekYatra Editorial"],
      section: "Trekking News",
      tags: trekSlug ? [trekSlug.replace(/-/g, " "), "trekking", "India"] : ["trekking", "India"],
      images: [{ url: article.hero_image_url ?? `${SITE_URL}/images/og-default.jpg` }],
    },
    twitter: { card: "summary_large_image", title, description },
    other: {
      "news_keywords": trekSlug
        ? `${trekSlug.replace(/-/g, " ")}, trek news, India trekking, ${trekSlug} trail`
        : "trek news, India trekking",
    },
  };
}

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  let article: NewsArticle | null = null;
  try {
    article = await fetchNewsArticle(params.slug);
  } catch { /* not found */ }

  if (!article) notFound();

  const trekSlug = article.content_json?.trek_slug ?? null;
  // Per-item (new) or legacy aggregated (old) — prefer new format
  const newsItem = article.content_json?.news_item ?? null;
  const faqItems: FAQItem[] = article.content_json?.faqs ?? [];
  const tocItems = extractTocItems(article.content_html);

  const canonicalUrl = `${SITE_URL}/news/${params.slug}`;
  const trekName = trekSlug
    ? trekSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Trek";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seo_description ?? "",
    url: canonicalUrl,
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at,
    author: { "@type": "Organization", name: "TrekYatra", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "TrekYatra",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    image: article.hero_image_url ?? `${SITE_URL}/images/og-default.jpg`,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "#what-happened"],
    },
    about: trekSlug
      ? { "@type": "Thing", name: trekName, url: `${SITE_URL}/trek/${trekSlug}` }
      : undefined,
    isPartOf: { "@type": "WebSite", name: "TrekYatra", url: SITE_URL },
  };

  const faqSchema = faqItems.length ? buildFAQSchema(faqItems) : null;
  const shortTitle = article.title.length > 60
    ? `${article.title.slice(0, 57)}…`
    : article.title;
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Trek News", href: "/news" },
    ...(trekSlug ? [{ label: trekName, href: `/trek/${trekSlug}` }] : []),
    { label: shortTitle },
  ]);

  return (
    <>
      <SchemaInjector schemas={[articleSchema, faqSchema, breadcrumbSchema]} />

      {/* Hero banner */}
      <section className="relative bg-[#0c0e14] text-white pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-transparent pointer-events-none" />
        <div className="container-wide relative z-10">

          {/* Breadcrumb pill */}
          <div className="inline-flex items-center bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 mb-5">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Trek News", href: "/news" },
                ...(trekSlug ? [{ label: trekName, href: `/trek/${trekSlug}` }] : []),
                { label: shortTitle },
              ]}
              className="!text-white/80 [&>span>a]:!text-white/70 [&>span>a:hover]:!text-white [&>span>span]:!text-white/90"
            />
          </div>

          {/* Category + Trek badge row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-widest">
              <Newspaper className="h-3.5 w-3.5" />
              Trekking News
            </span>
            {trekSlug && (
              <Link
                href={`/trek/${trekSlug}`}
                className="flex items-center gap-1 text-xs text-white/60 bg-white/10 px-2.5 py-1 rounded-full hover:bg-white/20 hover:text-white transition-colors"
              >
                <MapPin className="h-3 w-3" />
                {trekName}
              </Link>
            )}
          </div>

          {/* H1 headline */}
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 max-w-3xl">
            {article.title}
          </h1>

          {/* Description */}
          {article.seo_description && (
            <p className="text-white/70 text-base md:text-lg max-w-2xl mb-6 leading-relaxed">
              {article.seo_description}
            </p>
          )}

          {/* Byline */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/50 text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(article.published_at ?? article.created_at)}
            </span>
            {article.updated_at !== article.created_at && (
              <span>Updated {formatDate(article.updated_at)}</span>
            )}
            <span>By TrekYatra Editorial</span>
            {newsItem?.source && (
              <>
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1">
                  Source:{" "}
                  {newsItem.link ? (
                    <a
                      href={newsItem.link}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-white/70 hover:text-white transition-colors underline underline-offset-2"
                    >
                      {newsItem.source}
                    </a>
                  ) : (
                    newsItem.source
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="container-wide py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

          {/* Article body */}
          <article className="min-w-0">
            <div
              className="prose prose-neutral dark:prose-invert max-w-none cms-section"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />

            {/* FAQ accordion */}
            {faqItems.length > 0 && (
              <div className="mt-10 not-prose" id="faqs">
                <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
                <FAQAccordion items={faqItems} />
              </div>
            )}

            <AuthorBlock
              publishedAt={article.published_at}
              updatedAt={article.updated_at}
            />
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-5">

              {/* Table of Contents */}
              {tocItems.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <TableOfContents items={tocItems} />
                </div>
              )}

              {/* Trek guide links */}
              {trekSlug && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Trek Guide
                  </p>
                  <Link
                    href={`/trek/${trekSlug}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-accent transition-colors">
                      {trekName} — Full Guide
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href={`/trek/${trekSlug}/packing`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-accent transition-colors">
                      Packing checklist
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href={`/trek/${trekSlug}/permits`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-accent transition-colors">
                      Permit guide
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              )}

              {/* Original source */}
              {newsItem?.link && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Original Source
                  </p>
                  <a
                    href={newsItem.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-start gap-2 text-sm text-muted-foreground hover:text-accent transition-colors p-2 rounded-xl hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
                    <span className="line-clamp-2 leading-snug">
                      {newsItem.source || "Read original article"}
                    </span>
                  </a>
                </div>
              )}

              {/* More news */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">More News</p>
                <Link
                  href="/news"
                  className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
                >
                  <Newspaper className="h-4 w-4 text-accent" />
                  All trek news updates
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </Link>
                {trekSlug && (
                  <Link
                    href={`/trek/${trekSlug}#trek-news`}
                    className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors mt-2"
                  >
                    <MapPin className="h-4 w-4 text-accent" />
                    {trekName} news
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
