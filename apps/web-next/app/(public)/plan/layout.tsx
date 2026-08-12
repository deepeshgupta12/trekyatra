import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

// /plan is a client-component wizard (no page-level metadata), so its self-canonical lives here.
// This dedupes the crawled query-param variants (/plan?region=…) that GSC flagged as
// "duplicate without user-selected canonical". /plan/results overrides this via its own layout.
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/plan` },
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
