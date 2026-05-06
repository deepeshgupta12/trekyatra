import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OperatorPublic } from "@/lib/api";

interface Props {
  operator: OperatorPublic;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
        />
      ))}
      <span className="text-xs text-white/50 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function OperatorCard({ operator }: Props) {
  const regions = (operator.region ?? []).slice(0, 2);
  const trekTypes = (operator.trek_types ?? []).slice(0, 3);

  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-start gap-3">
        {operator.logo_url ? (
          <img src={operator.logo_url} alt={operator.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <span className="text-accent font-bold text-lg">{operator.name[0]}</span>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{operator.name}</h3>
          {operator.review_count > 0 ? (
            <StarRating rating={operator.rating_avg} />
          ) : (
            <span className="text-xs text-muted-foreground">No reviews yet</span>
          )}
        </div>
      </div>

      {regions.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {regions.join(", ")}
        </div>
      )}

      {trekTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {trekTypes.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
              {t}
            </span>
          ))}
        </div>
      )}

      {operator.description_long && (
        <p className="text-xs text-white/50 line-clamp-2">{operator.description_long}</p>
      )}

      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/8">
        <Link href={`/operators/${operator.slug}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full border-white/20 text-white/60 hover:text-white text-xs">
            View profile
          </Button>
        </Link>
        <Link href={`/operators/${operator.slug}#inquiry`} className="flex-1">
          <Button variant="hero" size="sm" className="w-full text-xs">
            Request info
          </Button>
        </Link>
      </div>
    </div>
  );
}
