import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function Methodology() {
  return <ContentPage eyebrow="Methodology" title="How we research, write & verify" subtitle="Our editorial process, freshness logic, and safety-first principles." icon={Mountain} tone="calm" blocks={[{ title: "Overview", body: "This page outlines the policy and approach we take. Last updated: January 2026. Contact hello@trekyatra.in for questions." }]} />;
}
