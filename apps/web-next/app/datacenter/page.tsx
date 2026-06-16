import type { Metadata } from "next";
import { fetchTrekProfile, fetchCMSPages } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TrekSage Datacenter — Trek JSON Viewer",
  robots: { index: false },
};

interface Props {
  searchParams: { slug?: string };
}

export default async function DatacenterPage({ searchParams }: Props) {
  const { slug } = searchParams;

  // ── JSON viewer (slug provided) ────────────────────────────────────────────
  if (slug) {
    const profile = await fetchTrekProfile(slug);

    if (!profile) {
      return (
        <div>
          <h1 className="font-display text-2xl font-semibold mb-2">Trek not found</h1>
          <p className="text-white/50 text-sm mb-4">
            No published trek guide found for slug: <code className="text-white/70">{slug}</code>
          </p>
          <a href="/datacenter" className="text-accent text-sm hover:underline">← Back to index</a>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white mb-1">{profile.name}</h1>
            <p className="text-white/40 text-xs">
              slug: <span className="text-white/60 font-mono">{profile.slug}</span>
              {profile.last_verified_at && (
                <> · verified {new Date(profile.last_verified_at).toLocaleDateString("en-IN")}</>
              )}
            </p>
          </div>
          <a href="/datacenter" className="text-white/40 hover:text-white text-xs flex-shrink-0 mt-1">← index</a>
        </div>

        <div className="bg-[#0c0e14] rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
            <p className="text-xs font-mono text-white/50">TrekProfile JSON — used by TrekSage MCP</p>
            <span className="text-xs text-white/30">/api/v1/treks/{slug}/profile</span>
          </div>
          <pre className="p-5 text-xs text-white/70 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-words">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // ── Index (no slug) ────────────────────────────────────────────────────────
  let slugs: { slug: string; name: string }[] = [];
  try {
    const pages = await fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 200 });
    slugs = pages.map((p) => ({ slug: p.slug, name: (p as { trek_name?: string }).trek_name ?? p.title }));
  } catch {
    slugs = [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">TrekSage Datacenter</h1>
      <p className="text-white/50 text-sm mb-6">
        Per-trek JSON bible — pass <code className="text-white/70">?slug=&lt;trek-slug&gt;</code> to view the full
        structured profile used by the TrekSage MCP server.
      </p>

      {/* Slug input */}
      <form method="GET" action="/datacenter" className="flex flex-col sm:flex-row gap-2 mb-8">
        <input
          name="slug"
          type="text"
          placeholder="Enter trek slug e.g. kedarkantha"
          className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-white/10 bg-[#14161f] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium"
        >
          View JSON
        </button>
      </form>

      {/* Trek list */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">{slugs.length} Published Trek Guides</h2>
        </div>
        <ul className="divide-y divide-white/5">
          {slugs.map((t) => (
            <li key={t.slug}>
              <a
                href={`/datacenter?slug=${encodeURIComponent(t.slug)}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors"
              >
                <span className="text-sm text-white/80">{t.name}</span>
                <span className="text-xs font-mono text-white/30">{t.slug}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
