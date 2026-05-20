import { generateStateTrekSitemap } from "@/lib/state-sitemap";
export const dynamic = "force-dynamic";
export async function GET() { return generateStateTrekSitemap("Jammu & Kashmir"); }
