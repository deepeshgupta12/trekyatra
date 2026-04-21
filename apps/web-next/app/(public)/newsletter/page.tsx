import { ContentPage } from "@/components/content/ContentPage";
import { Mail } from "lucide-react";

export default function Newsletter() {
  return (
    <ContentPage
      eyebrow="Newsletter"
      title="The Trail Letter"
      subtitle="One slow, considered email a month. Seasonal trek picks, permit changes, packing tips, and beginner lessons."
      icon={Mail}
      blocks={[
        { title: "What you'll get", bullets: ["Seasonal trek recommendations", "Permit and safety updates", "New comparison guides", "Editor picks on gear", "Beginner lessons series"] },
      ]}
    />
  );
}
