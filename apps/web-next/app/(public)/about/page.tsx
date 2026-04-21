import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function About() {
  return (
    <ContentPage
      eyebrow="About"
      title="Why we built TrekYatra"
      subtitle="Because Indian trekking deserves better than generic blog content. We're building the trekking platform we wished existed when we started."
      icon={Mountain}
      blocks={[
        { title: "Our editorial mission", body: "Every guide on TrekYatra is written by someone who has done the trek. Every permit page is re-verified every 14 days. Every comparison is built from actual trail data, not marketing copy." },
        { title: "Our promises", bullets: ["No paid placement in editorial guides", "No fake reviews", "Affiliate disclosures on every gear page", "Public methodology page", "Updated dates on every page"] },
      ]}
    />
  );
}
