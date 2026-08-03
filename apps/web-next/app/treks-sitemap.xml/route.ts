import { generateTrekSitemap } from "@/lib/state-sitemap";
export const dynamic = "force-dynamic";
// Single catch-all trek sitemap — ALL published trek pages, any region (India or international),
// auto-included with ZERO per-region code. Replaces the old per-state sitemaps (301-redirected in
// next.config.mjs). Declared in robots.ts.
export async function GET() { return generateTrekSitemap(); }
