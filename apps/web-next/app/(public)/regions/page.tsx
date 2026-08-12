import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mountain, MapPin, Compass } from "lucide-react";
import { REGIONS } from "@/lib/regions";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { HubHero, HubSection, HubFAQSection } from "@/components/hub/HubLayout";
import { createHubLinker } from "@/components/hub/internalLink";
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildFAQSchema } from "@/lib/schema";

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Regions" }];

export const metadata: Metadata = {
  title: "Trekking Regions of India & the Himalaya — Every Trekking State | TrekYatra",
  description:
    "Browse every trekking region we cover, from the Garhwal snows of Uttarakhand and the meadows of Kashmir to the high desert of Ladakh and the monsoon forts of the Sahyadris. Pick a region and see its best treks, seasons and permits.",
  alternates: { canonical: `${SITE_URL}/regions` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Trekking Regions of India & the Himalaya | TrekYatra", type: "website" },
};

const FAQ: FAQItem[] = [
  { q: "Which is the best region for a first Himalayan trek?", a: "Uttarakhand is the most beginner friendly. Kedarkantha and Brahmatal are purpose built first snow treks with graded trails, reliable operators and short approach drives from Dehradun." },
  { q: "Which region is best for monsoon trekking?", a: "The Maharashtra Sahyadris. While the Himalaya is largely off limits in July and August, the Western Ghats come alive with waterfalls and green forts within a few hours of Mumbai and Pune." },
  { q: "Where should experienced trekkers go for high altitude?", a: "Ladakh and the Nepal Himalaya. Ladakh sits above 3,500 metres on every route, and Nepal holds the Everest and Annapurna base camp trails. Both demand real acclimatisation and prior high altitude experience." },
];

export default function RegionsIndexPage() {
  const ilink = createHubLinker();
  const india = REGIONS.filter((r) => r.country === "India");
  const himalaya = REGIONS.filter((r) => r.country !== "India");

  const regionListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trekking regions of India and the Himalaya",
    numberOfItems: REGIONS.length,
    itemListElement: REGIONS.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/regions/${r.slug}`,
      name: `${r.name} treks`,
    })),
  };

  function RegionCard({ slug, name, tagline, blurb, image }: (typeof REGIONS)[number]) {
    return (
      <Link href={`/regions/${slug}`} className="group block overflow-hidden rounded-2xl border border-border bg-card lift">
        <div className="relative h-44 w-full overflow-hidden">
          <Image src={image} alt={`${name} trekking`} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-display text-xl font-semibold text-white">{name}</h3>
            <p className="text-white/80 text-xs">{tagline}</p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{blurb}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm text-accent font-medium">
            Explore {name} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(CRUMBS),
          buildCollectionPageSchema({
            name: "Trekking Regions of India & the Himalaya",
            description: metadata.description as string,
            url: "/regions",
            about: { type: "Place", name: "India and the Himalaya", description: "Trekking regions across India and the wider Himalaya." },
            significantLinks: [...REGIONS.map((r) => `/regions/${r.slug}`), "/seasons", "/guides", "/plan"],
            keywords: ["trekking regions india", "himalayan trekking regions", "best regions to trek in india"],
          }),
          regionListSchema,
          buildFAQSchema(FAQ)!,
        ]}
      />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <HubHero
        eyebrow="Regions"
        title="Trekking regions of India and the Himalaya"
        intro="Every trekking state we cover, each with its own season, terrain and permit rules. Start with a region to see its signature treks, the months that actually work, and what you need to enter."
        stats={[
          { icon: MapPin, label: `${REGIONS.length} regions covered` },
          { icon: Mountain, label: "India + international Himalaya" },
          { icon: Compass, label: "Best treks, seasons & permits per region" },
        ]}
      />

      <section className="container-wide">
        <HubSection title="Indian trekking states">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12 mt-2">
            {india.map((r) => <RegionCard key={r.slug} {...r} />)}
          </div>
        </HubSection>

        {himalaya.length > 0 && (
          <HubSection title="International Himalaya">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12 mt-2">
              {himalaya.map((r) => <RegionCard key={r.slug} {...r} />)}
            </div>
          </HubSection>
        )}
      </section>

      <section className="py-12 container-wide border-t border-border mt-4">
        <div className="max-w-3xl">
          <HubSection title="How to choose a region">
            <p className="text-foreground/80 leading-relaxed mb-3">
              The region decides three things before the trek does: when you can go, how high you will sleep, and
              whether you need a permit. Kashmir and Ladakh peak in summer and early autumn, Uttarakhand and Himachal
              run a long winter snow season, and the Sahyadris are the one place that shines in the monsoon.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              If it is your first trek, start in Uttarakhand or the low Sahyadri forts. If you have altitude behind you,
              Ladakh and Nepal open up. Use the {ilink("/seasons", "seasons guide")} to cross check the calendar and the{" "}
              {ilink("/plan", "trip planner")} to match a region to your dates.
            </p>
          </HubSection>
        </div>
      </section>

      <HubFAQSection heading="Trekking regions, frequently asked questions">
        <FAQAccordion items={FAQ} />
      </HubFAQSection>
    </>
  );
}
