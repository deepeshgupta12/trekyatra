import { ContentPage } from "@/components/content/ContentPage";
import { Backpack } from "lucide-react";

export default function Packing() {
  return (
    <ContentPage
      eyebrow="Packing"
      title="The Indian trekker's packing system"
      subtitle="Season-tuned, trek-tested checklists. Built around layering, weight, and the realities of Indian trekking."
      icon={Backpack}
      showDownload
      blocks={[
        { eyebrow: "Clothing", title: "Layer like the mountains demand it", body: "Three layers, always: a moisture-wicking base, an insulating mid-layer, and a waterproof shell. Cotton kills above the snowline.",
          bullets: ["3 quick-dry t-shirts (no cotton)", "2 thermal base layers", "1 fleece + 1 down jacket", "Waterproof shell jacket + pants", "Trekking pants (avoid jeans)", "Warm gloves + liner gloves", "Woollen cap + sun cap", "3-4 pairs woollen/synthetic socks"] },
        { eyebrow: "Footwear", title: "Boots — your single most important purchase", body: "High-ankle waterproof trekking boots, broken in over at least 50km before your trek." },
        { eyebrow: "Gear", title: "Backpack, sleeping & daypack",
          cards: [{ title: "Backpack", body: "55-65L with rain cover" }, { title: "Sleeping bag", body: "-10°C for snow, 0°C for summer" }, { title: "Daypack", body: "20-30L for summit day" }] },
        { eyebrow: "Documents", title: "What to carry in your wallet", bullets: ["Govt photo ID (mandatory)", "Medical insurance", "Emergency contacts (printed)", "Cash + cards", "Permits (printed)"] },
      ]}
    />
  );
}
