import { ContentPage } from "@/components/content/ContentPage";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { Wallet } from "lucide-react";

export const revalidate = 3600;

export default async function Costs() {
  const cmsPages = await fetchCMSHubPages("cost_guide");
  return (
    <>
      <section className="py-10 container-wide">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Cost guides</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">What Indian trekking actually costs</h1>
        <p className="text-muted-foreground text-lg mb-8">Honest, line-item breakdowns for budget, mid-range and premium trekking.</p>
        <CMSPageHub pages={cmsPages} pathPrefix="/guides" emptyLabel="Detailed cost guides are being published. Check back soon." />
      </section>
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
    </>
  );
}
