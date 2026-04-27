import AffiliateCard, { type AffiliateCardItem } from "./AffiliateCard";

interface Props {
  items: AffiliateCardItem[];
  title?: string;
}

export default function AffiliateRail({ items, title = "Recommended gear" }: Props) {
  if (!items.length) return null;
  return (
    <div className="not-prose my-8 min-w-0">
      <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">{title}</p>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {items.map((item, i) => (
          <div key={`${item.title}-${i}`} className="snap-start">
            <AffiliateCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
