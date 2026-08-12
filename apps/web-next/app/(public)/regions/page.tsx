import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mountain, MapPin, Compass } from "lucide-react";
import { REGIONS } from "@/lib/regions";
import Breadcrumb from "@/components/content/Breadcrumb";
import { buildBreadcrumbSchema } from "@/lib/schema";

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

const FAQ = [
  {
    q: "Which is the best region for a first Himalayan trek?",
    a: "Uttarakhand is the most beginner friendly. Kedarkantha and Brahmatal are purpose built first snow treks with graded trails, reliable operators and short approach drives from Dehradun.",
  },
  {
    q: "Which region is best for monsoon trekking?",
    a: "The Maharashtra Sahyadris. While the Himalaya is largely off limits in July and August, the Western Ghats come alive with waterfalls and green forts within a few hours of Mumbai and Pune.",
  },
  {
    q: "Where should experienced trekkers go for high altitude?",
    a: "Ladakh and the Nepal Himalaya. Ladakh sits above 3,500 metres on every route, and Nepal holds the Everest and Annapurna base camp trails. Both demand real acclimatisation and prior high altitude experience.",
  },
];

export default function RegionsIndexPage() {
  const india = REGIONS.filter((r) => r.country === "India");
  const himalaya = REGIONS.filter((r) => r.country !== "India");

  const bcSchema = buildBreadcrumbSchema(CRUMBS);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Trekking Regions of India & the Himalaya",
    url: `${SITE_URL}/regions`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: REGIONS.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${r.name} treks`,
        url: `${SITE_URL}/regions/${r.slug}`,
      })),
    },
  };

  function RegionCard({ slug, name, tagline, blurb, image }: (typeof REGIONS)[number]) {
    return (
      <Link href={`/regions/${slug}`} className="group block overflow-hidden rounded-2xl border border-border bg-card lift">
        <div className="relative h-44 w-full overflow-hidden">
          <Image src={image} alt={`${name} trekking`} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-display text-xl font-semibold text-white">{name}</h2>
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <section className="py-12 container-wide">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Regions</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
            Trekking regions of India and the Himalaya
          </h1>
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            Every trekking state we cover, each with its own season, terrain and permit rules. Start with a region to
            see its signature treks, the months that actually work, and what you need to enter.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> {REGIONS.length} regions covered</span>
            <span className="flex items-center gap-2"><Mountain className="h-4 w-4 text-accent" /> India + international Himalaya</span>
            <span className="flex items-center gap-2"><Compass className="h-4 w-4 text-accent" /> Live trek counts per region</span>
          </div>
        </div>
      </section>

      <section className="container-wide">
        <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Indian trekking states</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {india.map((r) => <RegionCard key={r.slug} {...r} />)}
        </div>

        {himalaya.length > 0 && (
          <>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6">International Himalaya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {himalaya.map((r) => <RegionCard key={r.slug} {...r} />)}
            </div>
          </>
        )}
      </section>

      <section className="py-12 container-wide border-t border-border mt-4">
        <div className="max-w-3xl space-y-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">How to choose a region</h2>
            <p className="text-foreground/80 leading-relaxed mb-3">
              The region decides three things before the trek does: when you can go, how high you will sleep, and
              whether you need a permit. Kashmir and Ladakh peak in summer and early autumn, Uttarakhand and Himachal
              run a long winter snow season, and the Sahyadris are the one place that shines in the monsoon.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              If it is your first trek, start in Uttarakhand or the low Sahyadri forts. If you have altitude behind you,
              Ladakh and Nepal open up. Use the <Link href="/seasons" className="text-accent hover:underline">seasons guide</Link> to
              cross check the calendar and the <Link href="/plan" className="text-accent hover:underline">trip planner</Link> to
              match a region to your dates.
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
