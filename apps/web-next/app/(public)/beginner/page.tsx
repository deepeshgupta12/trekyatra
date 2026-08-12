import { ContentPage } from "@/components/content/ContentPage";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { Mountain } from "lucide-react";
import { fetchTreks } from "@/lib/trekApi";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import { fetchCMSPages, type CMSPage, type TrekFacts } from "@/lib/api";

function cmsToTrek(page: CMSPage): Trek {
  const tf = (page.content_json?.trek_facts ?? {}) as TrekFacts;
  return {
    slug: page.slug, name: page.title, region: tf.base ?? "", state: "",
    image: page.hero_image_url ?? "/images/trek-forest.jpg",
    duration: tf.duration ?? "—", altitude: tf.altitude ?? "—",
    difficulty: "Easy", season: tf.season ?? "—",
    description: page.seo_description ?? "", beginner: true,
  };
}
import Breadcrumb from "@/components/content/Breadcrumb";
import { DifficultyLadder } from "@/components/content/DifficultyLadder";
import { buildBreadcrumbSchema } from "@/lib/schema";
import Link from "next/link";
import type { Metadata } from "next";

const BEGINNER_FAQ = [
  { q: "Which is the easiest trek in India for a first-timer?", a: "For a first Himalayan trek, Kedarkantha and Nag Tibba in Uttarakhand are ideal: graded trails, short approaches and reliable operators. Near Mumbai, the Sahyadri forts like Rajmachi make a gentle low-altitude start." },
  { q: "How fit do I need to be for my first trek?", a: "Enough to walk 4 to 5 hours with a daypack and climb stairs without gasping. Four weeks of daily 30-minute walks or jogs before the trek is plenty for an easy route." },
  { q: "What should I not do on my first trek?", a: "Do not buy brand new boots for the trek, skip the medical certificate, wear cotton, or book the cheapest operator blindly. Train for four weeks and buffer one extra day for weather." },
];

export const revalidate = 3600;
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Beginner Treks" }];

export const metadata: Metadata = {
  title: "Beginner Treks in India — Easy First-Time Treks | TrekYatra",
  description: "Discover the best beginner-friendly treks in India. Curated easy treks for first-timers, with verified permits, realistic cost breakdowns, and safe route profiles.",
  alternates: { canonical: "https://www.trekyatra.co.in/beginner" },
  authors: [{ name: "TrekYatra Editorial Team" }],
};

export default async function Beginner() {
  const [cmsPages, allCmsTrekGuides, treks] = await Promise.all([
    fetchCMSHubPages("beginner_guide"),
    fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 100 }).catch(() => []),
    fetchTreks(),
  ]);

  // CMS trek_guide pages with easy/beginner difficulty — preferred
  const cmsBeginnerTreks = allCmsTrekGuides
    .filter((p) => {
      const d = ((p.content_json?.trek_facts as TrekFacts | undefined)?.difficulty ?? "").toLowerCase();
      return d.includes("easy") || d.includes("beginner");
    })
    .map(cmsToTrek)
    .slice(0, 3);

  const beginnerTreks = cmsBeginnerTreks.length > 0
    ? cmsBeginnerTreks
    : treks.filter((t) => t.beginner).slice(0, 3);
  const bcSchema = buildBreadcrumbSchema(CRUMBS);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BEGINNER_FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>
      <section className="py-10 container-wide">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Beginner guides</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Your first trek — start here</h1>
        <p className="text-muted-foreground text-lg mb-8">India-specific, no-nonsense guides for first-time trekkers.</p>
        <CMSPageHub pages={cmsPages} pathPrefix="/guides" />
        {beginnerTreks.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">Best beginner treks right now</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {beginnerTreks.map((t) => <TrekCard key={t.slug} trek={t} />)}
            </div>
          </div>
        )}
        <div className="max-w-3xl"><DifficultyLadder current="beginner" /></div>
      </section>
      <ContentPage
        eyebrow="Beginner"
        title="Your first trek — start here"
        subtitle="If you've never trekked above 10,000 ft, read this before you book anything."
        icon={Mountain}
        blocks={[
          { eyebrow: "Mistakes", title: "11 mistakes first-time Indian trekkers make", bullets: ["Booking the cheapest operator", "Not training for 4 weeks", "Wearing brand new boots", "Skipping the medical certificate", "Underestimating altitude", "Cotton clothing", "Cheap rented sleeping bag", "Booking peak weekend dates", "Solo trekking unprepared", "Skipping travel insurance", "Not buffering 1 extra day"] },
          { eyebrow: "Picks", title: "Best first treks by city", cards: [
            { title: "From Mumbai", body: "Rajmachi, Kalsubai, Harishchandragad" },
            { title: "From Bangalore", body: "Kumara Parvatha, Tadiyandamol, Skandagiri" },
            { title: "From Delhi", body: "Kedarkantha, Brahmatal, Nag Tibba" },
          ]},
        ]}
      />

      <section className="py-12 container-wide border-t border-border">
        <div className="max-w-3xl space-y-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Where to next</h2>
            <p className="text-foreground/80 leading-relaxed">
              Once your first trek is behind you and altitude feels manageable, step up to a{" "}
              <Link href="/moderate" className="text-accent hover:underline">moderate trek</Link>. Choose a friendly
              starting region with the <Link href="/regions" className="text-accent hover:underline">regions guide</Link>,
              and check the calendar with the <Link href="/seasons" className="text-accent hover:underline">seasons guide</Link>{" "}
              so the weather is on your side.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Frequently asked questions</h2>
            <div className="space-y-5">
              {BEGINNER_FAQ.map(({ q, a }) => (
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
