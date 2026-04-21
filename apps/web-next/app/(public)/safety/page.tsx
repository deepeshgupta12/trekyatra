import { ContentPage } from "@/components/content/ContentPage";
import { Shield } from "lucide-react";

export default function Safety() {
  return (
    <ContentPage
      eyebrow="Safety"
      title="Trek safety — the things that actually matter"
      subtitle="Altitude, weather, evacuation, and the calls that experienced trekkers make differently."
      icon={Shield}
      tone="calm"
      blocks={[
        { title: "Altitude sickness — what to watch for", bullets: ["Persistent headache", "Loss of appetite", "Dizziness or confusion", "Dry persistent cough", "Nausea or vomiting", "Difficulty sleeping"] },
        { title: "When to turn back", body: "Always. The mountain isn't going anywhere. We've yet to meet a trekker who regretted descending early." },
      ]}
    />
  );
}
