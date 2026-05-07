import { ContentPage } from "@/components/content/ContentPage";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { Mountain } from "lucide-react";
import { fetchTreks } from "@/lib/trekApi";
import { TrekCard } from "@/components/trek/TrekCard";

export const revalidate = 3600;

export default async function Beginner() {
  const [cmsPages, treks] = await Promise.all([
    fetchCMSHubPages("beginner_guide"),
    fetchTreks(),
  ]);
  const beginnerTreks = treks.filter((t) => t.beginner).slice(0, 3);

  return (
    <>
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
