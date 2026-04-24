import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface RelatedItem {
  slug: string;
  title: string;
  image?: string;
  eyebrow?: string;
}

interface Props {
  items: RelatedItem[];
  heading?: string;
}

export default function RelatedContent({ items, heading = "You might also like" }: Props) {
  if (!items.length) return null;

  return (
    <div className="mt-10">
      <h3 className="font-display text-lg font-semibold mb-4">{heading}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/trek/${item.slug}`}
            className="snap-start flex-shrink-0 w-52 rounded-2xl border border-border bg-card overflow-hidden hover:border-accent/40 transition-colors group"
          >
            {item.image && (
              <div className="h-28 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-3">
              {item.eyebrow && (
                <div className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">
                  {item.eyebrow}
                </div>
              )}
              <div className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
                {item.title}
              </div>
              <div className="flex items-center gap-1 text-accent text-xs mt-2 font-medium">
                Read guide <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
