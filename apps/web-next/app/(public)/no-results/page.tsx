import Link from "next/link";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import { Search, ArrowRight } from "lucide-react";

export default function NoResults() {
  return (
    <section className="py-20">
      <div className="container-narrow text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-6">
          <Search className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="font-display text-4xl font-semibold mb-3">No matches yet</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">We couldn&apos;t find treks matching your filters. Try widening the season or difficulty range.</p>
        <div className="flex gap-3 justify-center mb-12">
          <Link href="/explore"><button className="h-11 px-5 rounded-xl bg-accent text-accent-foreground font-medium">Browse all treks</button></Link>
        </div>
        <div className="text-left">
          <h3 className="font-display text-xl font-semibold mb-4 text-center">You might also like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {treks.slice(0, 3).map(t => <TrekCard key={t.slug} trek={t} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
