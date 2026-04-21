import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function SafetyDisclaimer() {
  return <ContentPage eyebrow="Safety" title="Safety Disclaimer" subtitle="Read this before you plan a trek using our content." icon={Mountain} tone="calm" blocks={[{ title: "Overview", body: "This page outlines the policy and approach we take. Last updated: January 2026. Contact hello@trekyatra.in for questions." }]} />;
}
