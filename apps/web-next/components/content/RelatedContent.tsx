import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchRelatedPages, RelatedPage } from "@/lib/api";

export interface RelatedItem {
  slug: string;
  title: string;
  image?: string;
  eyebrow?: string;
}

interface Props {
  items?: RelatedItem[];
  /** When provided, fetches related pages from the API instead of using `items`. */
  pageSlug?: string;
  heading?: string;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  trek_guide: "Trek Guide",
  packing_list: "Packing List",
  permit_guide: "Permit Guide",
  beginner_guide: "Beginner Guide",
  comparison: "Comparison",
  seasonal: "Seasonal Guide",
};

function RelatedCard({ slug, title, eyebrow, image }: RelatedItem) {
  return (
    <Link
      href={`/trek/${slug}`}
      className="snap-start flex-shrink-0 w-52 rounded-2xl border border-border bg-card overflow-hidden hover:border-accent/40 transition-colors group"
    >
      {image && (
        <div className="h-28 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-3">
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">
            {eyebrow}
          </div>
        )}
        <div className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{title}</div>
        <div className="flex items-center gap-1 text-accent text-xs mt-2 font-medium">
          Read guide <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

async function RelatedFromAPI({ pageSlug, heading }: { pageSlug: string; heading: string }) {
  let pages: RelatedPage[] = [];
  try {
    pages = await fetchRelatedPages(pageSlug, 5);
  } catch {
    return null;
  }
  if (!pages.length) return null;
  const items: RelatedItem[] = pages.map((p) => ({
    slug: p.slug,
    title: p.title,
    eyebrow: PAGE_TYPE_LABELS[p.page_type] ?? p.page_type,
  }));
  return (
    <div className="mt-10">
      <h3 className="font-display text-lg font-semibold mb-4">{heading}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.map((item) => (
          <RelatedCard key={item.slug} {...item} />
        ))}
      </div>
    </div>
  );
}

export default function RelatedContent({
  items,
  pageSlug,
  heading = "You might also like",
}: Props) {
  if (pageSlug) {
    return <RelatedFromAPI pageSlug={pageSlug} heading={heading} />;
  }

  if (!items?.length) return null;

  return (
    <div className="mt-10">
      <h3 className="font-display text-lg font-semibold mb-4">{heading}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.map((item) => (
          <RelatedCard key={item.slug} {...item} />
        ))}
      </div>
    </div>
  );
}
