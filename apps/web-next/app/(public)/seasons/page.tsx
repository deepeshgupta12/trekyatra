import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarRange, Snowflake, Sun } from "lucide-react";
import { SEASONS } from "@/lib/seasons";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { HubHero, HubSection, HubFAQSection } from "@/components/hub/HubLayout";
import { createHubLinker } from "@/components/hub/internalLink";
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildFAQSchema } from "@/lib/schema";

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Seasons" }];

export const metadata: Metadata = {
  title: "Best Season to Trek in India — Month by Month Trekking Calendar | TrekYatra",
  description:
    "When to trek in India, season by season. Spring rhododendrons, summer high passes, monsoon Sahyadri forts, autumn's clear Himalayan skies and winter snow treks, with the best routes for each.",
  alternates: { canonical: `${SITE_URL}/seasons` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Best Season to Trek in India | TrekYatra", type: "website" },
};

const SEASON_COPY: Record<string, { note: string; picks: string }> = {
  spring: { note: "Rhododendron forests bloom and the lower Himalaya thaws. Trails are green, crowds are thin.", picks: "Kedarkantha (late), Nag Tibba, Valley trails opening up" },
  summer: { note: "The high passes open. This is the window for Ladakh, Kashmir and the big alpine crossings.", picks: "Hampta Pass, Kashmir Great Lakes, Markha Valley" },
  monsoon: { note: "The Himalaya mostly closes, but the Sahyadris come alive with waterfalls and mist.", picks: "Valley of Flowers, Rajmachi, Kalsubai, Harishchandragad" },
  autumn: { note: "The clearest skies of the year. Post monsoon visibility makes this peak Himalayan season.", picks: "Roopkund, Kuari Pass, Sandakphu, Rupin Pass" },
  winter: { note: "Snow season. Graded snow treks in Uttarakhand and Himachal, plus the frozen Chadar.", picks: "Kedarkantha, Brahmatal, Chadar, Chopta Tungnath" },
};

const FAQ: FAQItem[] = [
  { q: "What is the best overall season to trek in India?", a: "Autumn (October to November) offers the clearest skies and the widest choice of Himalayan treks. Winter is best for snow treks, and summer is the only window for Ladakh and Kashmir's high passes." },
  { q: "Can you trek during the monsoon?", a: "Yes, but change ranges. Skip the Himalaya in July and August and head to the Maharashtra Sahyadris, where the monsoon is the main trekking season with green forts and waterfalls." },
  { q: "When is snow trekking season in India?", a: "December to March. Kedarkantha, Brahmatal and Dayara Bugyal hold reliable snow, and the Chadar trek on the frozen Zanskar river runs in January and February." },
];

export default function SeasonsIndexPage() {
  const ilink = createHubLinker();

  const seasonListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trekking seasons in India",
    numberOfItems: SEASONS.length,
    itemListElement: SEASONS.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/seasons/${s.slug}`,
      name: `${s.label} treks`,
    })),
  };

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(CRUMBS),
          buildCollectionPageSchema({
            name: "Best Season to Trek in India",
            description: metadata.description as string,
            url: "/seasons",
            about: { type: "Thing", name: "Trekking seasons in India", description: "The best months and seasons to trek across India and the Himalaya." },
            significantLinks: [...SEASONS.map((s) => `/seasons/${s.slug}`), "/regions", "/guides", "/plan"],
            keywords: ["best season to trek in india", "india trekking calendar", "when to trek in india"],
          }),
          seasonListSchema,
          buildFAQSchema(FAQ)!,
        ]}
      />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <HubHero
        eyebrow="Seasons"
        title="The best season to trek in India"
        intro="India trekking runs all year if you follow the calendar. Each season opens a different part of the country. Pick a season to see the treks that are actually in condition, the weather to expect and what to pack."
        stats={[
          { icon: CalendarRange, label: "5 trekking seasons" },
          { icon: Snowflake, label: "Snow: Dec – Mar" },
          { icon: Sun, label: "High passes: May – Jun" },
        ]}
      />

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
        <div className="max-w-3xl">
          <HubSection title="Match the season to the region">
            <p className="text-foreground/80 leading-relaxed mb-3">
              Season and region are two halves of the same decision. Ladakh and Kashmir only make sense in summer and
              early autumn. Uttarakhand and Himachal carry a long snow season into spring. The Sahyadris are the monsoon
              exception. Cross check with the {ilink("/regions", "regions guide")} so your dates, your fitness and the
              mountains all line up.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Not sure where to start? The {ilink("/plan", "trip planner")} takes your month and experience level and
              returns treks that are actually in condition.
            </p>
          </HubSection>
        </div>
      </section>

      <HubFAQSection heading="Trekking seasons, frequently asked questions">
        <FAQAccordion items={FAQ} />
      </HubFAQSection>
    </>
  );
}
