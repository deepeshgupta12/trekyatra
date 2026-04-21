import { TrekCard } from "@/components/trek/TrekCard";
import { fetchTreks } from "@/lib/trekApi";

export default async function SavedTreks() {
  const trekList = await fetchTreks();
  return (
    <section className="py-12">
      <div className="container-wide">
        <h1 className="font-display text-4xl font-semibold mb-2">Saved Treks</h1>
        <p className="text-muted-foreground mb-8">Your shortlist — keep the ones that excite you.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trekList.map(t => <TrekCard key={t.slug} trek={t} />)}
        </div>
      </div>
    </section>
  );
}
