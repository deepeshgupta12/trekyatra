import { generateStateTrekSitemap } from "@/lib/state-sitemap";
export const dynamic = "force-dynamic";
// International Himalaya region — substring-matched against composite trek_state values
// (e.g. "Koshi Province, Nepal / Tibet, China"). See app/robots.ts + docs/URL_MAP.md.
export async function GET() { return generateStateTrekSitemap("Nepal"); }
