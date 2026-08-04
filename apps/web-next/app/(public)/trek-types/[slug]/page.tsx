import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mountain, ArrowLeft, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCMSPage, fetchClusterTreks } from "@/lib/api";
import { getCategoryContent } from "@/lib/category-content";
import { cmsPageToTrek } from "@/lib/trek-utils";
import { TrekCard } from "@/components/trek/TrekCard";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildBreadcrumbSchema, buildFAQSchema, buildItemListSchema } from "@/lib/schema";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  // /trek-types is exclusively the curated categories that have content.
  return ["beginner-friendly-treks", "weekend-treks", "high-altitude-treks", "lake-treks", "snow-treks", "family-treks"].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const c = getCategoryContent(params.slug);
  if (!c) return {};
  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`trek-types/${params.slug}`);
  } catch {
    // code-first
  }
  return {
    title: cmsPage?.seo_title ?? `${c.title} — Routes, Regions & Tips | TrekYatra`,
    description: cmsPage?.seo_description ?? c.intro.slice(0, 155),
    alternates: { canonical: `${siteUrl}/trek-types/${params.slug}` },
    openGraph: { title: c.title, images: [cmsPage?.hero_image_url ?? c.heroImage] },
  };
}

export const revalidate = 3600;

export default async function TrekTypePage({ params }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

  // /trek-types is EXCLUSIVELY the curated thematic categories. Any other slug (e.g. a per-trek
  // "tarsar-marsar-trek-guide") 404s — it would duplicate the /trek/{slug} detail page.
  const c = getCategoryContent(params.slug);
  if (!c) {
    notFound();
  }
  const label = params.slug.replace(/-/g, " "); // "lake treks"

  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`trek-types/${params.slug}`);
  } catch {
    // code-first (rich page below renders regardless)
  }

  // Live member treks for this curated category (predicate match on Master CMS + Trek Backfill).
  const clusterPages = await fetchClusterTreks({ category: params.slug, limit: 9 });
  const clusterTreks = clusterPages.map(cmsPageToTrek);
  const trekCount = clusterTreks.length;

  const breadcrumbItems = [
    { label: "Home", href: `${siteUrl}/` },
    { label: "Trek Types", href: `${siteUrl}/explore` },
    { label: c.title, href: `${siteUrl}/trek-types/${params.slug}` },
  ];

  const cmsFaqs: FAQItem[] = (cmsPage?.content_json?.faqs ?? []).filter((f) => f.q && f.a);
  const generatedFaqs: FAQItem[] = [
    {
      q: `How many ${label} does TrekYatra cover?`,
      a: `${trekCount} ${label} across India, each with a full route breakdown, difficulty, permits, cost estimates and live trail conditions.`,
    },
    {
      q: `Which regions have the best ${label}?`,
      a: c.bestRegions.map((r) => `${r.name} — ${r.note}`).join(" "),
    },
    { q: `Are ${label} good for beginners?`, a: c.beginnerNote },
    { q: `What should I know before choosing ${label}?`, a: c.tips.join("; ") + "." },
  ];
  const faqs: FAQItem[] = cmsFaqs.length ? cmsFaqs : generatedFaqs;

  const heroImage = cmsPage?.hero_image_url ?? c.heroImage;

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(breadcrumbItems),
          ...(clusterTreks.length ? [buildItemListSchema(clusterTreks.map((t) => t.name), `/trek-types/${params.slug}`)] : []),
          buildFAQSchema(faqs)!,
        ]}
      />

      {/* Hero */}
      <section className="relative min-h-[54vh] flex items-end overflow-hidden bg-gradient-to-br from-pine/20 via-[#0c0e14] to-accent/10">
        <div className="absolute inset-0">
          <img src={heroImage} alt={c.title} className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/60 to-transparent" />
        </div>
        <div className="container-wide relative pb-12 pt-24">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-accent text-sm mb-5 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> All treks
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pine/10 border border-pine/20 text-pine text-xs uppercase tracking-widest mb-4">
            <Mountain className="h-3 w-3" /> {c.tagline}
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white leading-tight mb-4">
            {cmsPage?.title ?? c.title}
          </h1>
          <p className="text-white/75 text-lg max-w-2xl">{cmsPage?.seo_description ?? c.intro}</p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-white/8 bg-[#0f1117]/60 py-3">
        <div className="container-wide">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: "Trek Types", href: "/explore" },
            { label: c.title },
          ]} />
        </div>
      </div>

      {/* Stat strip */}
      <section className="bg-[#0f1117] border-b border-white/8">
        <div className="container-wide grid grid-cols-3 divide-x divide-white/8">
          {[
            [String(trekCount), trekCount === 1 ? "Trek in this category" : "Treks in this category"],
            [String(c.bestRegions.length), "Prime regions"],
            ["India-wide", "Coverage"],
          ].map(([v, l]) => (
            <div key={l} className="p-6 text-center">
              <div className="font-display text-2xl md:text-3xl font-semibold text-accent">{v}</div>
              <div className="text-xs uppercase tracking-widest text-white/40 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose */}
      <section className="py-14">
        <div className="container-wide max-w-4xl">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-5 capitalize">Why choose {label}?</h2>
          <p className="text-lg text-white/80 leading-relaxed">{c.whyChoose}</p>
        </div>
      </section>

      {/* What to look for (tips) */}
      <section className="py-12 bg-[#0f1117]/60 border-y border-white/8">
        <div className="container-wide max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mb-6 capitalize">Planning your {label}</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {c.tips.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Best regions */}
      <section className="py-12">
        <div className="container-wide">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mb-6 capitalize">Best regions for {label}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {c.bestRegions.map((r) => (
              <Link key={r.slug} href={`/regions/${r.slug}`} className="block p-6 bg-[#14161f] border border-white/10 rounded-2xl hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <h3 className="font-display text-lg font-semibold text-white">{r.name}</h3>
                </div>
                <p className="text-sm text-white/60">{r.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Member treks */}
      {clusterTreks.length > 0 && (
        <section className="py-12 border-t border-white/8">
          <div className="container-wide">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mb-6 capitalize">Top {label}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clusterTreks.map((t) => (
                <TrekCard key={t.slug} trek={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Optional editor overlay */}
      {cmsPage?.content_html && cmsPage.content_html.length > 400 && (
        <section className="py-8">
          <div className="container-wide max-w-3xl">
            <div className="cms-section prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: cmsPage.content_html }} />
          </div>
        </section>
      )}

      {/* FAQs (generated) */}
      <section className="py-12 border-t border-white/8">
        <div className="container-wide max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mb-6 capitalize">{label} — Frequently Asked Questions</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0f1117] border-t border-white/8">
        <div className="container-wide text-center">
          <h2 className="font-display text-3xl font-semibold text-white mb-3">Ready to plan your trek?</h2>
          <p className="text-white/60 mb-6">Get matched with the right trail based on your fitness and dates.</p>
          <Button variant="hero" size="lg" asChild>
            <Link href="/plan">Plan my trek</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
