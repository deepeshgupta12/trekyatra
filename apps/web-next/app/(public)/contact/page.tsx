import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function Contact() {
  return <ContentPage eyebrow="Contact" title="Get in touch" subtitle="Press, partnerships, content tips, or planning help." icon={Mountain} tone="calm" blocks={[{ title: "Overview", body: "This page outlines the policy and approach we take. Last updated: January 2026. Contact hello@trekyatra.in for questions." }]} />;
}
