import Link from "next/link";
import { Check, X } from "lucide-react";

export interface ComparisonProduct {
  name: string;
  affiliateUrl: string;
  bestFor?: string;
  features: Record<string, boolean | string>;
}

interface Props {
  products: ComparisonProduct[];
  featureLabels: Record<string, string>;
  title?: string;
}

export default function ComparisonTable({ products, featureLabels, title = "Product comparison" }: Props) {
  const keys = Object.keys(featureLabels);
  return (
    <div className="not-prose my-8 overflow-x-auto">
      <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">{title}</p>
      <table className="w-full text-sm min-w-[480px] border border-border rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Feature</th>
            {products.map((p) => (
              <th key={p.name} className="text-center px-4 py-3 text-xs font-medium">
                <Link href={p.affiliateUrl} target="_blank" rel="nofollow sponsored noopener" aria-label={`Check price for ${p.name}`} className="text-accent hover:underline">
                  {p.name}
                </Link>
                {p.bestFor && <div className="text-[10px] text-muted-foreground font-normal mt-0.5">Best for: {p.bestFor}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((key, i) => (
            <tr key={key} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
              <td className="px-4 py-3 text-muted-foreground">{featureLabels[key]}</td>
              {products.map((p) => {
                const val = p.features[key];
                return (
                  <td key={p.name} className="px-4 py-3 text-center">
                    {typeof val === "boolean" ? (
                      val ? <Check className="h-4 w-4 text-success mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    ) : (
                      <span className="text-xs">{val ?? "—"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground/60 mt-2">Affiliate links · we may earn a commission at no extra cost to you</p>
    </div>
  );
}
