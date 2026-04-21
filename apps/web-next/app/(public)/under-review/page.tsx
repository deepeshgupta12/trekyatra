import { FileCheck } from "lucide-react";

export default function UnderReview() {
  return (
    <section className="py-20">
      <div className="container-narrow">
        <div className="p-8 bg-warning/10 border border-warning/30 rounded-2xl text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-warning/20 items-center justify-center mb-4">
            <FileCheck className="h-6 w-6 text-warning" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2">Under review</h1>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">This guide is being re-verified by our editors. Full refresh expected within 7 days.</p>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Last verified · Oct 2025</div>
        </div>
      </div>
    </section>
  );
}
