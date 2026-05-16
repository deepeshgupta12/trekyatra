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
import { buildBreadcrumbSchema } from "@/lib/schema";
import type { Metadata } from "next";

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcSchema) }} />
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
    </>
  );
}
