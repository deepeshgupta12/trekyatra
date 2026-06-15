import Link from "next/link";
import { fetchCMSPages } from "@/lib/api";

export const revalidate = 3600;

export default async function DatacenterIndexPage() {
  let slugs: { slug: string; name: string }[] = [];
  try {
    const pages = await fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 200 });
    slugs = pages.map((p) => ({ slug: p.slug, name: p.trek_name ?? p.title }));
  } catch {
    slugs = [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Trek Guide Data</h1>
      <p className="text-white/50 text-sm mb-6">
        Each trek guide below has a structured profile at <code className="text-white/70">/trek-guide/[slug]</code> —
        the canonical data source used by the TrekSage MCP server.
      </p>
      <ul className="space-y-1.5">
        {slugs.map((t) => (
          <li key={t.slug}>
            <Link href={`/trek-guide/${t.slug}`} className="text-accent hover:underline text-sm">
              {t.name} — /trek-guide/{t.slug}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
