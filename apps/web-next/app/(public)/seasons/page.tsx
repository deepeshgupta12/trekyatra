import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarRange, Snowflake, Sun } from "lucide-react";
import { SEASONS } from "@/lib/seasons";
import Breadcrumb from "@/components/content/Breadcrumb";
import { buildBreadcrumbSchema } from "@/lib/schema";

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Seasons" }];

export const metadata: Metadata = {
  title: "Best Season to Trek in India — Month by Month Trekking Calendar | TrekYatra",
  description:
    "When to trek in India, season by season. Spring rhododendrons, summer high passes, monsoon Sahyadri forts, autumn's clear Himalayan skies and winter snow treks — with the best routes for each.",
  alternates: { canonical: `${SITE_URL}/seasons` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Best Season to Trek in India | TrekYatra", type: "website" },
};

// Editorial copy per season (unique to this hub — distinct from the /seasons/{slug} pages).
const SEASON_COPY: Record<string, { note: string; picks: string }> = {
  spring: { note: "Rhododendron forests bloom and the lower Himalaya thaws. Trails are green, crowds are thin.", picks: "Kedarkantha (late), Nag Tibba, Valley trails opening up" },
  summer: { note: "The high passes open. This is the window for Ladakh, Kashmir and the big alpine crossings.", picks: "Hampta Pass, Kashmir Great Lakes, Markha Valley" },
  monsoon: { note: "The Himalaya mostly closes, but the Sahyadris come alive with waterfalls and mist.", picks: "Valley of Flowers, Rajmachi, Kalsubai, Harishchandragad" },
  autumn: { note: "The clearest skies of the year. Post monsoon visibility makes this peak Himalayan season.", picks: "Roopkund, Kuari Pass, Sandakphu, Rupin Pass" },
  winter: { note: "Snow season. Graded snow treks in Uttarakhand and Himachal, plus the frozen Chadar.", picks: "Kedarkantha, Brahmatal, Chadar, Chopta Tungnath" },
};

const FAQ = [
  { q: "What is the best overall season to trek in India?", a: "Autumn (October to November) offers the clearest skies and the widest choice of Himalayan treks. Winter is best for snow treks, and summer is the only window for Ladakh and Kashmir's high passes." },
  { q: "Can you trek during the monsoon?", a: "Yes, but change ranges. Skip the Himalaya in July and August and head to the Maharashtra Sahyadris, where the monsoon is the main trekking season with green forts and waterfalls." },
  { q: "When is snow trekking season in India?", a: "December to March. Kedarkantha, Brahmatal and Dayara Bugyal hold reliable snow, and the Chadar trek on the frozen Zanskar river runs in January and February." },
];

export default function SeasonsIndexPage() {
  const bcSchema = buildBreadcrumbSchema(CRUMBS);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Best Season to Trek in India",
    url: `${SITE_URL}/seasons`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: SEASONS.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: `${s.label} treks`, url: `${SITE_URL}/seasons/${s.slug}` })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <section className="py-12 container-wide">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Seasons</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
            The best season to trek in India
          </h1>
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            India trekking runs all year if you follow the calendar. Each season opens a different part of the country.
            Pick a season to see the treks that are actually in condition, the weather to expect and what to pack.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-accent" /> 5 trekking seasons</span>
            <span className="flex items-center gap-2"><Snowflake className="h-4 w-4 text-accent" /> Snow: Dec – Mar</span>
            <span className="flex items-center gap-2"><Sun className="h-4 w-4 text-accent" /> High passes: May – Jun</span>
          </div>
        </div>
      </section>

      <section className="container-wide">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {SEASONS.map((s) => {
            const copy = SEASON_COPY[s.slug];
            return (
              <Link key={s.slug} href={`/seasons/${s.slug}`} className="group block rounded-2xl border border-border bg-card p-5 lift">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-xl font-semibold text-foreground">{s.emoji} {s.label}</h2>
                  <span className="text-xs text-muted-foreground">{s.hint}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{copy?.note}</p>
                <p className="text-foreground/70 text-xs mb-3"><span className="font-medium text-foreground/90">Top picks:</span> {copy?.picks}</p>
                <span className="inline-flex items-center gap-1 text-sm text-accent font-medium">
                  {s.label} treks <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="py-12 container-wide border-t border-border">
        <div className="max-w-3xl space-y-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Match the season to the region</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              Season and region are two halves of the same decision. Ladakh and Kashmir only make sense in summer and
              early autumn. Uttarakhand and Himachal carry a long snow season into spring. The Sahyadris are the monsoon
              exception. Cross check with the <Link href="/regions" className="text-accent hover:underline">regions guide</Link> so
              your dates, your fitness and the mountains all line up.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Not sure where to start? The <Link href="/plan" className="text-accent hover:underline">trip planner</Link> takes
              your month and experience level and returns treks that are actually in condition.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Frequently asked questions</h2>
            <div className="space-y-5">
              {FAQ.map(({ q, a }) => (
                <div key={q}>
                  <h3 className="font-semibold text-foreground mb-2">{q}</h3>
                  <p className="text-foreground/80 leading-relaxed text-sm">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
