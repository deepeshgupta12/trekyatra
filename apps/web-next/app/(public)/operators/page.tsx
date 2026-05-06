import type { Metadata } from "next";
import { fetchPublicOperators } from "@/lib/api";
import OperatorGrid from "@/components/operators/OperatorGrid";
import { Building2 } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Trek Operators — Find Vetted Guides | TrekYatra",
  description: "Browse vetted trekking operators across the Himalayas. Compare regions, specialties, and ratings to find the right guide for your trek.",
  alternates: { canonical: "https://trekyatra.com/operators" },
  openGraph: {
    title: "Trek Operators | TrekYatra",
    description: "Vetted Himalayan trekking operators — find your guide.",
    type: "website",
  },
};

export default async function OperatorsPage() {
  let operators: Awaited<ReturnType<typeof fetchPublicOperators>> = [];
  try {
    operators = await fetchPublicOperators();
  } catch { /* show empty state */ }

  return (
    <div className="container-wide py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-accent text-xs font-medium uppercase tracking-widest mb-3">
          <Building2 className="h-4 w-4" />
          Operator marketplace
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Find your trek operator
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Vetted operators across Uttarakhand, Himachal, and beyond. Compare regions, specialties, and reviews.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active operators", value: operators.length },
          { label: "Regions covered", value: Array.from(new Set(operators.flatMap(o => o.region ?? []))).length },
          { label: "Trek types", value: Array.from(new Set(operators.flatMap(o => o.trek_types ?? []))).length },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="font-display text-2xl font-semibold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <OperatorGrid operators={operators} />
    </div>
  );
}
