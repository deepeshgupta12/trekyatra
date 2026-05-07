import { ContentPage } from "@/components/content/ContentPage";
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Get in touch"
      subtitle="Press, partnerships, planning help, or data corrections — we respond within 48 hours."
      icon={Mail}
      blocks={[
        {
          eyebrow: "Reach us",
          title: "Contact channels",
          cards: [
            { title: "General enquiries", body: "hello@trekyatra.in — questions, feedback, planning help, and partnership proposals." },
            { title: "Content corrections", body: "Found outdated permit data or a factual error? Email hello@trekyatra.in with subject 'Data Correction'. We act within 48 hours." },
            { title: "Press & media", body: "hello@trekyatra.in with subject 'Press'. We are happy to speak to journalists covering Indian trekking or adventure travel." },
          ],
        },
        {
          title: "Office",
          body: "TrekYatra\nGurgaon, Haryana, India 122001\nhello@trekyatra.in",
        },
        {
          title: "Response times",
          bullets: [
            "General emails: within 48 hours on business days",
            "Urgent safety or data corrections: same day — mark subject 'URGENT'",
            "Partnership and press enquiries: within 5 business days",
            "We do not respond to SEO link-exchange requests",
          ],
        },
        {
          title: "Common questions",
          bullets: [
            "Can I contribute a trek guide? Yes — email us a draft or outline. We pay contributors fairly.",
            "Do you accept sponsored content? No. Editorial independence is non-negotiable.",
            "Can operators list on TrekYatra? Yes — email us for operator onboarding.",
            "Do you offer personalised planning? Yes — use the free Trip Planner at /plan.",
          ],
        },
      ]}
    />
  );
}
