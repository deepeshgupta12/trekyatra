import { useParams } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import { Snowflake, Sun, Cloud, Leaf } from "lucide-react";
import uttarakhand from "@/assets/region-uttarakhand-snow.jpg";
import sahyadri from "@/assets/region-sahyadri.jpg";
import himachal from "@/assets/region-himachal-camp.jpg";
import forest from "@/assets/trek-forest.jpg";

const seasons: Record<string, any> = {
  winter: { title: "Best Winter Treks in India", icon: Snowflake, image: uttarakhand, blurb: "December to early April. Snowline treks in Uttarakhand and Himachal. Frozen lakes, pristine campsites, sunrise summit climbs.", months: "Dec – Apr" },
  monsoon: { title: "Best Monsoon Treks in Maharashtra", icon: Cloud, image: sahyadri, blurb: "June to September. The Sahyadris transform into emerald cliffs, waterfalls and fog. Weekend escapes from Mumbai and Pune.", months: "Jun – Sep" },
  summer: { title: "Best Summer Treks in Himachal", icon: Sun, image: himachal, blurb: "May to early July. Alpine meadows in full bloom, manageable temperatures, the magic of crossing snow patches before the monsoon arrives.", months: "May – Jun" },
  december: { title: "Best Treks to do in December", icon: Snowflake, image: uttarakhand, blurb: "The start of the snow season. Best for first-time winter trekkers who want guaranteed snow.", months: "December" },
  may: { title: "Best Treks to do in May", icon: Sun, image: himachal, blurb: "The shoulder month. Snow is melting, flowers are blooming, crowds haven't arrived yet.", months: "May" },
};

const Seasonal = () => {
  const { slug = "winter" } = useParams();
  const s = seasons[slug] || seasons.winter;
  const Icon = s.icon;

  return (
    <SiteLayout>
      <section className="relative h-[60vh] min-h-[480px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent" />
        </div>
        <div className="container-wide relative pb-12 text-surface">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-xs uppercase tracking-widest mb-5">
            <Icon className="h-3 w-3 text-accent-glow" /> Season · {s.months}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-5 max-w-4xl">{s.title}</h1>
          <p className="text-surface/85 text-lg max-w-2xl">{s.blurb}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-wide">
          <div className="prose max-w-none mb-10 text-foreground/85">
            <p className="text-lg">India's seasonal trekking calendar is brutal in its honesty. Pick the wrong window for the wrong region and you'll either miss the views, fight the weather, or find every trail closed. This guide covers the best treks for this exact season — chosen for safety, scenery and accessibility.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {treks.slice(0, 6).map(t => <TrekCard key={t.slug} trek={t} />)}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface-muted">
        <div className="container-wide grid md:grid-cols-3 gap-5">
          {[
            { title: "Weather expectations", body: "Daytime temps 5–15°C at base. -5 to -15°C at altitude during nights. Clear weather windows are typically 3–5 days." },
            { title: "Packing essentials", body: "Layered insulation, microspikes, gaiters, waterproof outer shell, UV sunglasses, lip balm with SPF, and a -10°C sleeping bag." },
            { title: "Safety notes", body: "Acclimatise properly. Hydrate above expected. Watch for AMS symptoms. Never trek solo above the snowline. Always carry a charged power bank." },
          ].map(b => (
            <div key={b.title} className="p-6 bg-card border border-border rounded-2xl">
              <h3 className="font-display text-xl font-semibold mb-3">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
};

export default Seasonal;
