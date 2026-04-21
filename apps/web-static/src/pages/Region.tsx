import { useParams, Link } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import { Button } from "@/components/ui/button";
import { Calendar, Mountain, MapPin, Sparkles, ArrowRight } from "lucide-react";
import himachal from "@/assets/region-himachal-camp.jpg";
import uttarakhand from "@/assets/region-uttarakhand-snow.jpg";
import kashmir from "@/assets/region-kashmir.jpg";
import sahyadri from "@/assets/region-sahyadri.jpg";
import ladakh from "@/assets/region-ladakh.jpg";

const regionData: Record<string, any> = {
  himachal: { name: "Himachal Pradesh", tagline: "The trekker's playground", image: himachal, blurb: "From the apple valleys of Kullu to the moonscapes of Spiti, Himachal offers the widest variety of treks of any Indian state — green to barren, beginner to expedition, in a 200km radius." },
  uttarakhand: { name: "Uttarakhand", tagline: "Land of the great Himalayan snow treks", image: uttarakhand, blurb: "Garhwal and Kumaon hold India's most loved beginner snow treks. Kedarkantha, Brahmatal, Valley of Flowers, Roopkund — they all live here." },
  kashmir: { name: "Kashmir", tagline: "Alpine lakes & turquoise meadows", image: kashmir, blurb: "Kashmir's high-altitude meadow treks are unrivalled in India. The Great Lakes trek alone draws trekkers from around the world for seven turquoise lakes in eight days." },
  ladakh: { name: "Ladakh", tagline: "High desert, high stakes, high reward", image: ladakh, blurb: "Above 3,500 m on every trek. Markha Valley, Stok Kangri, the legendary Chadar — Ladakh trekking is not for first-timers but rewards those who've earned it." },
  maharashtra: { name: "Maharashtra (Sahyadris)", tagline: "Monsoon trekking capital of India", image: sahyadri, blurb: "70+ documented treks from Mumbai and Pune. Best between June and February. The Sahyadris in monsoon are the closest thing India has to fairyland." },
  sikkim: { name: "Sikkim & North East", tagline: "Quiet, lush, photogenic", image: kashmir, blurb: "Goecha La, Sandakphu, Dzongri — North East treks pair stunning Kanchenjunga views with rich biodiversity and a softer crowd." },
  karnataka: { name: "Karnataka", tagline: "Western Ghats from Bangalore", image: sahyadri, blurb: "Kudremukh, Kumara Parvatha, Tadiyandamol — beginner to challenging treks reachable in a weekend from Bangalore." },
};

const Region = () => {
  const { slug = "himachal" } = useParams();
  const r = regionData[slug] || regionData.himachal;
  const stateTreks = treks.filter(t => t.state.toLowerCase().includes(r.name.toLowerCase().split(" ")[0])).concat(treks).slice(0, 6);

  return (
    <SiteLayout>
      <section className="relative h-[68vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-foreground/10" />
        </div>
        <div className="container-wide relative pb-12 text-surface">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-3 flex items-center gap-2">
            <MapPin className="h-3 w-3" /> Region · India
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-4 max-w-4xl">{r.name}</h1>
          <p className="text-xl text-accent-glow mb-4">{r.tagline}</p>
          <p className="text-surface/85 max-w-2xl text-lg">{r.blurb}</p>
        </div>
      </section>

      {/* Quick context */}
      <section className="bg-card border-b border-border">
        <div className="container-wide grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            ["48", "Treks documented"],
            ["12", "Beginner routes"],
            ["Apr–Oct", "Peak season"],
            ["Permits", "Mostly required"],
          ].map(([v, l]) => (
            <div key={l} className="p-6 text-center">
              <div className="font-display text-3xl font-semibold text-accent">{v}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured treks */}
      <section className="py-16">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Top treks in {r.name}</h2>
            <Link to="/explore" className="text-sm text-accent font-medium hidden md:block">View all →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stateTreks.map(t => <TrekCard key={t.slug} trek={t} />)}
          </div>
        </div>
      </section>

      {/* Best time chart */}
      <section className="py-16 bg-surface-muted">
        <div className="container-wide">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-8">Best time to trek in {r.name}</h2>
          <div className="bg-card border border-border rounded-2xl p-6 overflow-x-auto">
            <div className="grid grid-cols-12 gap-2 min-w-[700px]">
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => {
                const intensity = [0.9,0.8,0.5,0.3,0.7,0.95,0.4,0.4,0.7,0.95,0.85,0.9][i];
                return (
                  <div key={m} className="text-center">
                    <div className="h-32 rounded-lg flex items-end overflow-hidden mb-2 bg-muted">
                      <div className="w-full bg-gradient-saffron" style={{ height: `${intensity * 100}%` }} />
                    </div>
                    <div className="text-xs font-semibold">{m}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-4">Bar height = recommended trekking activity. Plan around weather windows and permit availability.</p>
          </div>
        </div>
      </section>

      {/* Logistics + CTA */}
      <section className="py-16">
        <div className="container-wide grid lg:grid-cols-2 gap-10">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Getting there</div>
            <h2 className="font-display text-3xl font-semibold mb-5">Logistics from major cities</h2>
            <div className="space-y-3">
              {[
                ["Delhi", "Overnight train/bus to base towns. 8–12 hrs."],
                ["Mumbai", "Flight to nearest hub + 6–10 hr drive."],
                ["Bangalore", "Flight to Delhi/Chandigarh + onward."],
                ["Chandigarh", "Closest hub for most Himachal/Uttarakhand treks."],
              ].map(([c, t]) => (
                <div key={c} className="p-4 bg-card border border-border rounded-xl flex justify-between items-center">
                  <div className="font-medium">{c}</div>
                  <div className="text-sm text-muted-foreground">{t}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-pine text-surface rounded-2xl p-10 flex flex-col justify-between">
            <div>
              <Sparkles className="h-8 w-8 text-accent mb-4" />
              <h3 className="font-display text-3xl font-semibold mb-3 leading-tight">Need help picking the right trek in {r.name}?</h3>
              <p className="text-surface/80">Tell us your fitness, dates and budget. We'll match you to the right trail and a vetted operator.</p>
            </div>
            <Button variant="hero" size="lg" className="mt-6 w-fit">Plan My Trek <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Region;
