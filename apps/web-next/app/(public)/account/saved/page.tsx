import { fetchTreks } from "@/lib/trekApi";
import { TrekCard } from "@/components/trek/TrekCard";
import Link from "next/link";
import { Bookmark } from "lucide-react";

export default async function SavedTreks() {
  const treks = await fetchTreks();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Saved Treks</h1>
        <p className="text-muted-foreground">{treks.length} treks saved to your list.</p>
      </div>

      {treks.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">Nothing saved yet</h2>
          <p className="text-muted-foreground mb-6">Browse treks and tap the bookmark icon to save them here.</p>
          <Link href="/explore" className="text-accent font-medium text-sm">Explore treks →</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {treks.map(trek => <TrekCard key={trek.slug} trek={trek} />)}
        </div>
      )}
    </div>
  );
}
