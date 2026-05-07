import Link from "next/link";
import { FileText } from "lucide-react";

interface CMSHubPage {
  id: string;
  slug: string;
  title: string;
  seo_description: string | null;
  hero_image_url: string | null;
  page_type: string;
  published_at: string | null;
}

interface Props {
  pages: CMSHubPage[];
  emptyLabel?: string;
  pathPrefix?: string; // e.g. "/guides", "/packing"
}

export default function CMSPageHub({ pages, emptyLabel, pathPrefix = "/guides" }: Props) {
  if (pages.length === 0) {
    if (emptyLabel) {
      return (
        <div className="bg-accent/5 rounded-2xl border border-accent/20 p-5 text-sm text-muted-foreground mb-8">
          {emptyLabel}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pages.map((page) => (
          <Link key={page.id} href={`${pathPrefix}/${page.slug}`} className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-accent/40 transition-colors lift">
            {page.hero_image_url ? (
              <img src={page.hero_image_url} alt={page.title} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                <FileText className="h-8 w-8 text-accent/40" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 group-hover:text-accent transition-colors">
                {page.title}
              </h3>
              {page.seo_description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{page.seo_description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Fetch helper used by hub pages server-side
const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function fetchCMSHubPages(page_type: string, limit = 12): Promise<CMSHubPage[]> {
  try {
    const res = await fetch(
      `${API}/api/v1/cms/pages?status=published&page_type=${page_type}&limit=${limit}`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
