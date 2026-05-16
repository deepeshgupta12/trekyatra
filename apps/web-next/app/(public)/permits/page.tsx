import { ContentPage } from "@/components/content/ContentPage";
import { FileCheck } from "lucide-react";
import Breadcrumb from "@/components/content/Breadcrumb";
import { buildBreadcrumbSchema } from "@/lib/schema";

const CRUMBS = [{ label: "Home", href: "/" }, { label: "Permit Guides" }];

export default function Permits() {
  const schema = buildBreadcrumbSchema(CRUMBS);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="container-wide pt-4 pb-0"><Breadcrumb items={CRUMBS} /></div>
    <ContentPage
      eyebrow="Permits"
      title="India trekking permits — the complete map"
      subtitle="Who needs what, where to get it, and the mistakes that turn people back at the checkpost."
      icon={FileCheck}
      tone="calm"
      blocks={[
        { title: "Updated this week — last verified Jan 2026", body: "Permit rules change. We re-verify every guide every 14 days. Always cross-check at the local Forest office before your trek." },
        { eyebrow: "By region", title: "Quick permit map", cards: [
          { title: "Uttarakhand", body: "Forest Dept permits at trailhead. Usually arranged by operators." },
          { title: "Himachal", body: "Inner Line Permits for Spiti/Kinnaur. Standard treks need only Forest entry." },
          { title: "Ladakh", body: "ILP mandatory for non-Indians and most border treks. Apply online." },
        ] },
        { title: "Common permit mistakes", bullets: ["Carrying photocopies without the original ID", "Permits expired by 1-2 days", "Wrong issuing authority", "Missing trekker insurance proof"] },
      ]}
    />
    </>
  );
}
