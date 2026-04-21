import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function Authors() {
  return (
    <ContentPage
      eyebrow="Authors"
      title="Meet our editors"
      subtitle="Field-tested, India-based, opinionated."
      icon={Mountain}
      tone="calm"
      blocks={[
        { title: "Overview", body: "This page outlines the policy and approach we take. Last updated: January 2026. Contact hello@trekyatra.in for questions." },
      ]}
    />
  );
}
