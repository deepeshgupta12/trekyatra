import { ContentPage } from "@/components/content/ContentPage";
import { Calendar } from "lucide-react";

export default function Itinerary() {
  return (
    <ContentPage
      eyebrow="Itinerary"
      title="Day-wise itineraries that actually work"
      subtitle="Built from real trekker logs, not brochure copy. Distance, altitude, time and stay — for every day."
      icon={Calendar}
      showDownload
      blocks={[
        { title: "How we build itineraries", body: "Every itinerary on TrekYatra is cross-referenced against operator schedules, trekker GPX logs and our editor's own field notes. We adjust them after every season." },
      ]}
    />
  );
}
