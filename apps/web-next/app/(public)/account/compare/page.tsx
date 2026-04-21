import Link from "next/link";
import { BarChart2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const LISTS = [
  { name: "Weekend options", treks: ["Kedarkantha", "Brahmatal"], updated: "2 days ago" },
  { name: "Monsoon bucket list", treks: ["Valley of Flowers", "Hampta Pass"], updated: "1 week ago" },
  { name: "High altitude goals", treks: ["Stok Kangri", "Pin Parvati"], updated: "3 weeks ago" },
];

export default function CompareLists() {
  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-1">Compare Lists</h1>
          <p className="text-muted-foreground">Side-by-side comparisons you&apos;ve built.</p>
        </div>
        <Button variant="hero" size="sm" asChild>
          <Link href="/compare"><Plus className="h-4 w-4" /> New list</Link>
        </Button>
      </div>

      {LISTS.length === 0 ? (
        <div className="text-center py-20">
          <BarChart2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">No compare lists yet</h2>
          <p className="text-muted-foreground mb-6">Add treks to a comparison from the trek detail page.</p>
          <Link href="/explore" className="text-accent font-medium text-sm">Explore treks →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {LISTS.map(list => (
            <div key={list.name} className="bg-surface rounded-2xl border border-border p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium mb-1">{list.name}</h3>
                <p className="text-sm text-muted-foreground">{list.treks.join(" vs ")} · Updated {list.updated}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/compare">View</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
