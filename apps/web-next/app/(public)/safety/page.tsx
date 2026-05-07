import { ContentPage } from "@/components/content/ContentPage";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { Shield } from "lucide-react";

export const revalidate = 3600;

export default async function Safety() {
  const cmsPages = await fetchCMSHubPages("safety_guide");
  return (
    <>
      <section className="py-10 container-wide">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Safety</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Trek safety — altitude, weather, emergencies</h1>
        <p className="text-muted-foreground text-lg mb-8">The things that save your trek and, sometimes, your life.</p>
        <CMSPageHub pages={cmsPages} pathPrefix="/guides" />
      </section>
      <ContentPage
        eyebrow="Safety"
        title="Trek safety — altitude, weather, emergencies"
        subtitle="The things that save your trek and, sometimes, your life."
        icon={Shield}
        blocks={[
          { eyebrow: "Altitude", title: "Acute Mountain Sickness (AMS) — what every trekker must know", bullets: ["AMS starts above 8,000 ft in susceptible individuals", "Symptoms: headache, nausea, fatigue, poor sleep", "Golden rule: descend if in doubt", "Acclimatise with rest days — no more than 500m gain per day above 3,000m", "Diamox (acetazolamide) helps — consult a doctor before use", "Never ignore a trekking partner's symptoms"] },
          { eyebrow: "Emergency contacts", title: "Key emergency numbers", cards: [
            { title: "SDRF Uttarakhand", body: "1070 or 9454417935" },
            { title: "Himachal Rescue", body: "01902-222340" },
            { title: "Mountain Rescue", body: "Police: 100 | Ambulance: 108" },
          ]},
        ]}
      />
    </>
  );
}
