import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function AffiliateDisclosure() {
  return <ContentPage eyebrow="Disclosure" title="Affiliate Disclosure" subtitle="How we make money — transparently." icon={Mountain} tone="calm" blocks={[{ title: "Overview", body: "This page outlines the policy and approach we take. Last updated: January 2026. Contact hello@trekyatra.in for questions." }]} />;
}
