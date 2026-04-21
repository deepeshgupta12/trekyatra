import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function Terms() {
  return <ContentPage eyebrow="Terms" title="Terms & Conditions" subtitle="The rules of using TrekYatra." icon={Mountain} tone="calm" blocks={[{ title: "Overview", body: "This page outlines the policy and approach we take. Last updated: January 2026. Contact hello@trekyatra.in for questions." }]} />;
}
