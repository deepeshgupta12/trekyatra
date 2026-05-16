import { ContentPage } from "@/components/content/ContentPage";
import CMSPageHub, { fetchCMSHubPages } from "@/components/content/CMSPageHub";
import { ShoppingBag } from "lucide-react";
import Breadcrumb from "@/components/content/Breadcrumb";
import { buildBreadcrumbSchema } from "@/lib/schema";

export const revalidate = 3600;
const CRUMBS = [{ label: "Home", href: "/" }, { label: "Gear Reviews" }];

export default async function Gear() {
  const cmsPages = await fetchCMSHubPages("gear_guide");
  const schema = buildBreadcrumbSchema(CRUMBS);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>
      <section className="py-10 container-wide">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Gear</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Trekking gear — honest reviews from the field</h1>
        <p className="text-muted-foreground text-lg mb-8">No paid placement. Editor picks and what to skip.</p>
        <CMSPageHub
          pages={cmsPages}
          pathPrefix="/guides"
          emptyLabel="Gear guides are being published. Check back soon."
        />
      </section>
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
            { title: "Jackets", body: "Down vs synthetic — which season, which layer" },
            { title: "Trekking poles", body: "When you need them, when you don't" },
          ]},
        ]}
      />
    </>
  );
}
