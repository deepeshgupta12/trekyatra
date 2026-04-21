import { ContentPage } from "@/components/content/ContentPage";
import { ShoppingBag } from "lucide-react";

export default function Gear() {
  return (
    <ContentPage
      eyebrow="Gear"
      title="Trekking gear — honest reviews from the field"
      subtitle="No paid placement. Editor picks, beginner picks, budget picks, and what to actually skip."
      icon={ShoppingBag}
      blocks={[
        { title: "Affiliate disclosure", body: "Some links here are affiliate. We only review gear our editors have used in the field for at least one full season." },
        { eyebrow: "Categories", title: "Browse by category", cards: [
          { title: "Backpacks", body: "55L–70L for multi-day treks" },
          { title: "Shoes & boots", body: "From weekend trail to expedition" },
          { title: "Sleeping bags", body: "0°C, -10°C, -20°C ratings" },
          { title: "Jackets", body: "Down, synthetic, rain shells" },
          { title: "Headlamps", body: "Battery & USB-C rechargeable" },
          { title: "Trekking poles", body: "Aluminium vs carbon" },
        ] },
      ]}
    />
  );
}
