import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function Privacy() {
  return <ContentPage eyebrow="Privacy" title="Privacy Policy" subtitle="What we collect, why, and how we protect it." icon={Mountain} tone="calm" blocks={[{ title: "Overview", body: "This page outlines the policy and approach we take. Last updated: January 2026. Contact hello@trekyatra.in for questions." }]} />;
}
