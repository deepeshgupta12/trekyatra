import { ContentPage } from "@/components/content/ContentPage";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { Calendar } from "lucide-react";

export const revalidate = 3600;

export default async function Itinerary() {
  const cmsPages = await fetchCMSHubPages("itinerary");
  return (
    <>
      <section className="py-10 container-wide">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Itineraries</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Day-wise itineraries that actually work</h1>
        <p className="text-muted-foreground text-lg mb-8">Built from real trekker logs, not brochure copy.</p>
        <CMSPageHub
          pages={cmsPages}
          pathPrefix="/guides"
          emptyLabel="Detailed trek itineraries are being published. Check back soon — or use the Trip Planner to generate a personalised one."
        />
      </section>
      <ContentPage
        eyebrow="How we build itineraries"
        title="Day-wise itineraries that actually work"
        subtitle="Built from real trekker logs, not brochure copy. Distance, altitude, time and stay — for every day."
        icon={Calendar}
        showDownload
        blocks={[
          { title: "How we build itineraries", body: "Every itinerary on TrekYatra is cross-referenced against operator schedules, trekker GPX logs and our editor's own field notes. We adjust them after every season." },
        ]}
      />
    </>
  );
}
