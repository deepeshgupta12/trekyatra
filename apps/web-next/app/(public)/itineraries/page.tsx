import { ContentPage } from "@/components/content/ContentPage";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { Calendar } from "lucide-react";
import Breadcrumb from "@/components/content/Breadcrumb";
import { buildBreadcrumbSchema } from "@/lib/schema";

export const revalidate = 3600;
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Itinerary Guides" }];

export default async function Itinerary() {
  const cmsPages = await fetchCMSHubPages("itinerary");
  const schema = buildBreadcrumbSchema(CRUMBS);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>
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
