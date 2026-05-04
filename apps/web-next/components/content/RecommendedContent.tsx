import Link from "next/link";
import { fetchSimilarPages, RecommendationItem } from "@/lib/api";

function RecommendCard({ item }: { item: RecommendationItem }) {
  const href = `/${item.page_type === "trek_guide" ? "trek" : "guides"}/${item.slug}`;
  return (
    <Link
      href={href}
      className="group bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:border-accent/40 transition-colors"
    >
      {item.hero_image_url ? (
        <img
          src={item.hero_image_url}
          alt={item.title}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-accent/5 flex items-center justify-center">
          <span className="text-accent/20 text-3xl">⛰</span>
        </div>
      )}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-[10px] uppercase tracking-widest text-accent font-medium">
          {item.page_type?.replace("_", " ")}
        </span>
        <h3 className="font-display font-semibold leading-snug text-sm group-hover:text-accent transition-colors line-clamp-2">
          {item.title}
        </h3>
        {item.seo_description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.seo_description}</p>
        )}
      </div>
    </Link>
  );
}

export default async function RecommendedContent({ slug, limit = 3 }: { slug: string; limit?: number }) {
  let items: RecommendationItem[] = [];
  try {
    const data = await fetchSimilarPages(slug, limit);
    items = data.items;
  } catch {
    return null;
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-border">
      <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">You may also like</div>
      <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">Similar treks to explore</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 not-prose">
        {items.map((item) => (
          <RecommendCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
