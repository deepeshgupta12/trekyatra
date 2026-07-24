import type { Metadata } from "next";
import Link from "next/link";
import { fetchNewsArticles, type NewsArticle } from "@/lib/api";
import { Newspaper, Calendar, ChevronRight } from "lucide-react";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildBreadcrumbSchema } from "@/lib/schema";
import { formatDate as formatDateUtil } from "@/lib/date";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";

export const metadata: Metadata = {
  title: "Trek News — Latest Updates from India's Trails",
  description:
    "Stay updated with the latest news from India's top trekking destinations. Trail openings, permit changes, weather alerts, and trekking updates — updated weekly.",
  alternates: { canonical: `${SITE_URL}/news` },
  openGraph: {
    title: "Trek News — Latest Updates from India's Trails",
    description: "Weekly trek news: trail conditions, permits, and trekking updates across India.",
    url: `${SITE_URL}/news`,
    siteName: "TrekYatra",
    locale: "en_IN",
  },
};

function formatDate(dateStr: string | null): string {
  return formatDateUtil(dateStr, "long");
}

function extractTrekSlug(article: NewsArticle): string | null {
  return article.content_json?.trek_slug ?? null;
}

function extractWeekLabel(article: NewsArticle): string | null {
  return article.content_json?.week_label ?? null;
}

export default async function NewsHubPage() {
  let articles: NewsArticle[] = [];
  try {
    articles = await fetchNewsArticles(40);
  } catch { /* renders with empty state */ }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Trek News" },
  ]);

  // Group by trek for a nicer layout
  const byTrek = articles.reduce<Record<string, NewsArticle[]>>((acc, a) => {
    const slug = extractTrekSlug(a) ?? "general";
    (acc[slug] ??= []).push(a);
    return acc;
  }, {});

  return (
    <>
      <SchemaInjector schemas={[breadcrumbSchema]} />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-foreground/95 to-foreground/80 text-surface pt-28 pb-16">
        <div className="container-wide">
          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-widest mb-3">
            <Newspaper className="h-3.5 w-3.5" /> Weekly Trek News
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            Latest Updates from India&apos;s Trails
          </h1>
          <p className="text-surface/70 text-lg max-w-2xl">
            Trail openings, permit changes, weather alerts, and operator news — curated weekly
            from verified sources for every major Indian trek.
          </p>
        </div>
      </section>

      <section className="container-wide py-12">
        {articles.length === 0 ? (
          <div className="text-center py-24">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No news articles yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              News articles are generated weekly. Check back after the next Monday update.
            </p>
            <Link href="/explore" className="text-accent underline text-sm">Browse all treks →</Link>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(byTrek).map(([trekSlug, trekArticles]) => (
              <div key={trekSlug}>
                {trekSlug !== "general" && (
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold capitalize">
                      {trekSlug.replace(/-/g, " ")} Trek
                    </h2>
                    <Link href={`/trek/${trekSlug}`} className="text-accent text-xs font-medium hover:underline">
                      View trek guide →
                    </Link>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {trekArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group bg-card border border-border rounded-2xl p-5 hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(article.published_at ?? article.created_at)}</span>
                        {extractWeekLabel(article) && (
                          <span className="ml-auto text-accent/70">Week {extractWeekLabel(article)?.split("-")[1]}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-2">
                        {article.title}
                      </h3>
                      {article.seo_description && (
                        <p className="text-muted-foreground text-xs line-clamp-2">{article.seo_description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-3 text-accent text-xs font-medium">
                        Read more <ChevronRight className="h-3 w-3" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
