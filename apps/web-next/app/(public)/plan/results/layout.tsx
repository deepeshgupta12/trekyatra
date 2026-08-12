import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

// /plan/results is a personalized, wizard-generated output page — it should not be indexed, and it
// must NOT inherit /plan's canonical from the parent layout. Own canonical + noindex.
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/plan/results` },
  robots: { index: false, follow: true },
};

export default function PlanResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
