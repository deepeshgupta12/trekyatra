import Link from "next/link";
import { Mountain, ArrowRight } from "lucide-react";

export default function EmptySaved() {
  return (
    <section className="py-20">
      <div className="container-narrow text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-accent/10 mb-6">
          <Mountain className="h-9 w-9 text-accent" />
        </div>
        <h1 className="font-display text-4xl font-semibold mb-3">Your saved list is empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Tap the bookmark icon on any trek to start your shortlist. We&apos;ll keep it synced across devices.</p>
        <Link href="/explore">
          <button className="h-12 px-6 rounded-xl bg-accent text-accent-foreground font-medium inline-flex items-center gap-2">
            Discover treks <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </section>
  );
}
