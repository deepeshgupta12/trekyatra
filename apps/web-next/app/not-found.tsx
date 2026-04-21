import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="py-20 md:py-32 bg-gradient-paper relative overflow-hidden">
        <div className="container-narrow text-center relative">
          <div className="font-display text-[10rem] md:text-[14rem] font-semibold leading-none text-accent/20 mb-4">404</div>
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-accent/15 mb-6 -mt-20 relative">
            <Compass className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-3">Off the trail</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            This page doesn&apos;t exist on our map. Let&apos;s get you back to a marked path.
          </p>
          <div className="flex gap-3 justify-center mb-16">
            <Link href="/"><Button variant="hero" size="lg">Back to home <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/explore"><Button variant="outline" size="lg">Explore treks</Button></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[["Popular treks", "/explore"], ["Regions", "/regions/himachal"], ["Packing", "/packing"], ["Plan a trek", "/plan"]].map(([l, to]) => (
              <Link key={l} href={to} className="p-4 bg-card border border-border rounded-xl hover:border-accent text-sm font-medium transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
