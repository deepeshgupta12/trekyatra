import { treks } from "@/data/treks";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight, Award } from "lucide-react";

export default function Compare() {
  const a = treks[0];
  const b = treks[6];

  const rows = [
    ["Duration", a.duration, b.duration],
    ["Max altitude", a.altitude, b.altitude],
    ["Difficulty", a.difficulty, b.difficulty],
    ["Best season", a.season, b.season],
    ["Beginner-friendly", "Yes", "Yes"],
    ["Snow probability", "Very high (Dec–Mar)", "Very high (Dec–Feb)"],
    ["Approx cost", "₹8,500–18,000", "₹9,500–19,000"],
    ["Crowd level", "High", "Moderate"],
  ];

  const verdicts = [
    { tag: "Best for first-timers", winner: "Kedarkantha", reason: "Easier logistics, more operators." },
    { tag: "Best for snow seekers", winner: "Brahmatal", reason: "Frozen lakes + thicker snow window." },
    { tag: "Best for fewer crowds", winner: "Brahmatal", reason: "Less commercialised, quieter trail." },
    { tag: "Best for budget", winner: "Kedarkantha", reason: "Marginally cheaper; competitive market." },
  ];

  return (
    <>
      <section className="bg-gradient-twilight text-surface py-16 relative overflow-hidden">
        <div className="container-wide">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-4">Trek comparison</div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-6 max-w-4xl">
            Kedarkantha <span className="text-accent">vs</span> Brahmatal
          </h1>
          <p className="text-surface/80 text-lg max-w-2xl">
            Two of India&apos;s most popular winter snow treks. Both 6 days, both beginner-friendly, both Uttarakhand.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {verdicts.map(v => (
              <div key={v.tag} className="p-6 bg-card border border-border rounded-2xl lift">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
                  <Award className="h-3.5 w-3.5" /> {v.tag}
                </div>
                <div className="font-display text-2xl font-semibold mb-2">{v.winner}</div>
                <p className="text-sm text-muted-foreground">{v.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {[a, b].map((t) => (
              <div key={t.slug} className="relative h-72 rounded-2xl overflow-hidden">
                <img src={t.image} alt={t.name} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 text-surface">
                  <div className="text-xs uppercase tracking-widest text-accent-glow mb-1">{t.state}</div>
                  <h3 className="font-display text-3xl font-semibold">{t.name}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-surface-muted border-b border-border">
              <div className="p-4 text-xs uppercase tracking-widest text-muted-foreground">Attribute</div>
              <div className="p-4 font-display font-semibold">{a.name}</div>
              <div className="p-4 font-display font-semibold">{b.name}</div>
            </div>
            {rows.map((r, i) => (
              <div key={r[0]} className={`grid grid-cols-3 ${i % 2 === 0 ? "" : "bg-surface-muted/40"} border-b border-border last:border-0`}>
                <div className="p-4 text-sm text-muted-foreground">{r[0]}</div>
                <div className="p-4 text-sm font-medium">{r[1]}</div>
                <div className="p-4 text-sm font-medium">{r[2]}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-8 md:p-10 rounded-2xl bg-gradient-pine text-surface grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="text-xs uppercase tracking-widest text-accent-glow mb-3">Editor&apos;s verdict</div>
              <h3 className="font-display text-3xl font-semibold mb-2 leading-tight">If it&apos;s your first snow trek — pick Kedarkantha.</h3>
              <p className="text-surface/80">It&apos;s better supported, slightly cheaper, and has more flexibility on dates.</p>
            </div>
            <Button variant="hero" size="lg">Get personalised help <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>
    </>
  );
}
