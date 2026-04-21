import { ContentPage } from "@/components/content/ContentPage";
import { Wallet } from "lucide-react";

export default function Costs() {
  return (
    <ContentPage
      eyebrow="Cost guides"
      title="What Indian trekking actually costs"
      subtitle="Honest, line-item breakdowns for budget, mid-range and premium trekking — including the costs people forget."
      icon={Wallet}
      blocks={[
        { eyebrow: "Tier overview", title: "Three ways to do most Himalayan treks", cards: [
          { value: "₹8K", title: "Budget", body: "Group fixed-departure, basic stay, shared dorm tents" },
          { value: "₹14K", title: "Mid-range", body: "Smaller groups, better food, twin-share tents" },
          { value: "₹25K+", title: "Premium", body: "Private group, certified guide, comfort tents" },
        ] },
        { title: "Hidden costs nobody tells you about", bullets: ["Travel to base town (₹2-5K)", "Gear rental (₹1-3K)", "Personal medication / energy bars", "Mules for backpack offload", "Tips for trek staff (₹500-1K)"] },
      ]}
    />
  );
}
