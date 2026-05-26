import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchNewsArticle, type NewsArticle, type FAQItem } from "@/lib/api";
import SchemaInjector from "@/components/seo/SchemaInjector";
import FAQAccordion from "@/components/content/FAQAccordion";
import Breadcrumb from "@/components/content/Breadcrumb";
import AuthorBlock from "@/components/content/AuthorBlock";
import { buildBreadcrumbSchema, buildFAQSchema, buildArticleSchema } from "@/lib/schema";
import { Calendar, Newspaper, ChevronRight, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let article: NewsArticle | null = null;
  try {
    article = await fetchNewsArticle(params.slug);
  } catch { /* not found */ }

  if (!article) {
    return { title: "News Article Not Found" };
  }

  const title = article.seo_title ?? article.title;
  const description = article.seo_description ?? "";
  const canonicalUrl = `${SITE_URL}/news/${params.slug}`;
  const trekSlug = article.content_json?.trek_slug;

  return {
    title,
    description,
    keywords: trekSlug ? [trekSlug.replace(/-/g, " "), "trek news", "India trekking"] : ["India trek news"],
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // Google News: news_keywords meta
    other: {
      "news_keywords": trekSlug
        ? `${trekSlug.replace(/-/g, " ")}, trek news, India trekking, ${trekSlug} trail`
        : "trek news, India trekking",
    },
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  let article: NewsArticle | null = null;
  try {
    article = await fetchNewsArticle(params.slug);
  } catch { /* not found */ }

  if (!article) notFound();

  const trekSlug = article.content_json?.trek_slug ?? null;
  const weekLabel = article.content_json?.week_label ?? null;
  const newsItems = article.content_json?.news_items ?? [];
  const faqItems: FAQItem[] = article.content_json?.faqs ?? [];

  const canonicalUrl = `${SITE_URL}/news/${params.slug}`;
  const trekName = trekSlug ? trekSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trek";

  // JSON-LD schemas
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
    // Speakable for voice search (Google AEO)
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "#latest-updates"],
    },
    // Link to the source trek guide
    about: trekSlug
      ? { "@type": "Thing", name: trekName, url: `${SITE_URL}/trek/${trekSlug}` }
      : undefined,
    // hasPart: links to source content
    hasPart: trekSlug
      ? {
          "@type": "WebPage",
          name: `${trekName} Trek Guide`,
          url: `${SITE_URL}/trek/${trekSlug}`,
        }
      : undefined,
    isPartOf: { "@type": "WebSite", name: "TrekYatra", url: SITE_URL },
  };

  const faqSchema = faqItems.length ? buildFAQSchema(faqItems) : null;
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Trek News", href: "/news" },
    ...(trekSlug ? [{ label: trekName, href: `/trek/${trekSlug}` }] : []),
    { label: "This Week's News" },
  ]);

  return (
    <>
      <SchemaInjector schemas={[articleSchema, faqSchema, breadcrumbSchema]} />

      {/* Hero banner */}
      <section className="bg-gradient-to-b from-foreground/95 to-foreground/80 text-surface pt-24 pb-10">
        <div className="container-wide">
          <div className="inline-flex items-center bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Trek News", href: "/news" },
                ...(trekSlug ? [{ label: trekName, href: `/trek/${trekSlug}` }] : []),
                { label: "This Week" },
              ]}
              className="!text-white/80 [&>span>a]:!text-white/70 [&>span>a:hover]:!text-white [&>span>span]:!text-white/90"
            />
          </div>

          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-widest mb-3">
            <Newspaper className="h-3.5 w-3.5" />
            {weekLabel ? `Week ${weekLabel.split("-")[1]}, ${weekLabel.split("-")[0]}` : "Latest News"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-4 max-w-3xl">
            {article.title}
          </h1>
          {article.seo_description && (
            <p className="text-surface/70 text-base max-w-2xl">{article.seo_description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-5 text-surface/60 text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Published {formatDate(article.published_at ?? article.created_at)}
            </span>
            {article.updated_at !== article.created_at && (
              <span>Updated {formatDate(article.updated_at)}</span>
            )}
            <span>By TrekYatra Editorial</span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="container-wide py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          {/* Article body */}
          <article className="min-w-0">
            {/* CMS-generated article HTML */}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none cms-section"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />

            {/* FAQ accordion (from content_json.faqs) */}
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
              {/* Trek guide link */}
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

              {/* Sources */}
              {newsItems.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    News Sources
                  </p>
                  <div className="space-y-2">
                    {newsItems.slice(0, 5).map((item, i) => (
                      <a
                        key={i}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="flex items-start gap-2 text-xs text-muted-foreground hover:text-accent transition-colors p-2 rounded-xl hover:bg-muted"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* More news link */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">More News</p>
                <Link href="/news" className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors">
                  <Newspaper className="h-4 w-4 text-accent" />
                  All trek news updates
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
