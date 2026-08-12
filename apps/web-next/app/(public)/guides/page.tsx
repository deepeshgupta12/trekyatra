import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, IndianRupee, Backpack, FileCheck, Map, ShieldCheck, Mountain, BookOpen } from "lucide-react";
import { TREK_CATEGORY_SLUGS } from "@/lib/categories";
import { CATEGORY_CONTENT } from "@/lib/category-content";
import Breadcrumb from "@/components/content/Breadcrumb";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { HubHero, HubSection, HubFAQSection } from "@/components/hub/HubLayout";
import { createHubLinker } from "@/components/hub/internalLink";
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildFAQSchema } from "@/lib/schema";

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Guides" }];

export const metadata: Metadata = {
  title: "Trekking Guides for India — Costs, Permits, Packing & Safety | TrekYatra",
  description:
    "Practical, India-specific trekking guides: honest cost breakdowns, permit paperwork, packing lists, gear advice, itineraries and high-altitude safety. Everything you need to plan a trek that actually works.",
  alternates: { canonical: `${SITE_URL}/guides` },
  authors: [{ name: "TrekYatra Editorial Team" }],
  openGraph: { title: "Trekking Guides for India | TrekYatra", type: "website" },
};

const GUIDE_HUBS = [
  { href: "/costs", title: "Trek costs", desc: "Real budget breakdowns: operator fees, transport, permits, gear rental and tips.", icon: IndianRupee },
  { href: "/permits", title: "Permits", desc: "Which permits you need, where to get them, and how long they take, state by state.", icon: FileCheck },
  { href: "/packing", title: "Packing lists", desc: "What to carry for each trek and season, with nothing you do not need.", icon: Backpack },
  { href: "/gear", title: "Gear", desc: "What to buy, what to rent, and what actually matters for Indian conditions.", icon: Mountain },
  { href: "/itineraries", title: "Itineraries", desc: "Day by day route plans with drive times, campsites and buffer days.", icon: Map },
  { href: "/safety", title: "Safety & altitude", desc: "Acclimatisation, AMS, weather and evacuation, written for the Indian Himalaya.", icon: ShieldCheck },
  { href: "/beginner", title: "First-timer guides", desc: "Start here if you have never trekked above 10,000 ft.", icon: BookOpen },
];

const FAQ: FAQItem[] = [
  { q: "How much does a Himalayan trek in India cost?", a: "A guided 5 to 6 day Himalayan trek typically runs between 8,000 and 18,000 rupees per person for the trek fee, plus transport to the base and any gear rental. See the trek costs guides for a full breakdown." },
  { q: "Do I need a permit to trek in India?", a: "It depends on the region. Many Uttarakhand and Himachal treks need only a forest entry fee, while Ladakh, Sikkim and border areas require inner line or protected area permits. Each permit guide lists the exact paperwork." },
  { q: "What should I pack for my first trek?", a: "Layered clothing, broken-in waterproof boots, a warm sleeping bag rated to the season, a rain shell, headlamp, and a basic medical kit. The packing guides give a full checklist by season." },
];

export default function GuidesIndexPage() {
  const ilink = createHubLinker();

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(CRUMBS),
          buildCollectionPageSchema({
            name: "Trekking Guides for India",
            description: metadata.description as string,
            url: "/guides",
            about: { type: "Thing", name: "Trek planning guides", description: "Practical trekking guides for India: costs, permits, packing, gear, itineraries and safety." },
            significantLinks: [...GUIDE_HUBS.map((g) => g.href), "/regions", "/seasons", "/plan"],
            keywords: ["trekking guides india", "trek cost india", "trekking permits india", "trekking packing list india"],
          }),
          buildFAQSchema(FAQ)!,
        ]}
      />

      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>

      <HubHero
        eyebrow="Guides"
        title="Trekking guides for India"
        intro="The practical half of trek planning: what it costs, what you need to enter, what to carry and how to stay safe at altitude. Every guide is written for Indian conditions and kept current."
      />

      <section className="container-wide">
        <HubSection title="Browse by topic">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12 mt-2">
            {GUIDE_HUBS.map(({ href, title, desc, icon: Icon }) => (
              <Link key={href} href={href} className="group block rounded-2xl border border-border bg-card p-5 lift">
                <div className="bg-accent/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{desc}</p>
                <span className="inline-flex items-center gap-1 text-sm text-accent font-medium">
                  Open {title.toLowerCase()} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </HubSection>

        <HubSection title="Browse by trek category">
          <div className="flex flex-wrap gap-3 mb-12 mt-2">
            {TREK_CATEGORY_SLUGS.map((slug) => {
              const c = CATEGORY_CONTENT[slug];
              return (
                <Link key={slug} href={`/trek-types/${slug}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground/80 hover:text-accent hover:border-accent/40 transition-colors">
                  {c?.title ?? slug}
                </Link>
              );
            })}
          </div>
        </HubSection>
      </section>

      <section className="py-12 container-wide border-t border-border">
        <div className="max-w-3xl">
          <HubSection title="Where to start">
            <p className="text-foreground/80 leading-relaxed mb-3">
              If you are new, read the first-timer guides and a packing list, then pick a beginner region. If you have a
              date and a place in mind, jump to that region's permit and cost guide so there are no surprises at the base.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Explore by {ilink("/regions", "region")}, by {ilink("/seasons", "season")}, or let the{" "}
              {ilink("/plan", "trip planner")} match a trek to your dates and level.
            </p>
          </HubSection>
        </div>
      </section>

      <HubFAQSection heading="Trek planning, frequently asked questions">
        <FAQAccordion items={FAQ} />
      </HubFAQSection>
    </>
  );
}
