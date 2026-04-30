import type { Metadata } from "next";
import Link from "next/link";
import { TrekCard } from "@/components/trek/TrekCard";
import { Button } from "@/components/ui/button";
import { MapPin, Sparkles, ArrowRight } from "lucide-react";
import { treks } from "@/data/treks";
import { fetchCMSPage } from "@/lib/api";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildBreadcrumbSchema } from "@/lib/schema";
import FAQAccordion from "@/components/content/FAQAccordion";

const regionData: Record<string, { name: string; tagline: string; image: string; blurb: string }> = {
  himachal: { name: "Himachal Pradesh", tagline: "The trekker's playground", image: "/images/region-himachal-camp.jpg", blurb: "From the apple valleys of Kullu to the moonscapes of Spiti, Himachal offers the widest variety of treks of any Indian state." },
  uttarakhand: { name: "Uttarakhand", tagline: "Land of the great Himalayan snow treks", image: "/images/region-uttarakhand-snow.jpg", blurb: "Garhwal and Kumaon hold India's most loved beginner snow treks — Kedarkantha, Brahmatal, Valley of Flowers, Roopkund." },
  kashmir: { name: "Kashmir", tagline: "Alpine lakes & turquoise meadows", image: "/images/region-kashmir.jpg", blurb: "Kashmir's high-altitude meadow treks are unrivalled in India. The Great Lakes trek alone draws trekkers from around the world." },
  ladakh: { name: "Ladakh", tagline: "High desert, high stakes, high reward", image: "/images/region-ladakh.jpg", blurb: "Above 3,500 m on every trek. Markha Valley, Stok Kangri, the legendary Chadar — Ladakh trekking is not for first-timers." },
  maharashtra: { name: "Maharashtra (Sahyadris)", tagline: "Monsoon trekking capital of India", image: "/images/region-sahyadri.jpg", blurb: "70+ documented treks from Mumbai and Pune. Best between June and February." },
  sikkim: { name: "Sikkim & North East", tagline: "Quiet, lush, photogenic", image: "/images/region-kashmir.jpg", blurb: "Goecha La, Sandakphu, Dzongri — North East treks pair stunning Kanchenjunga views with rich biodiversity." },
  karnataka: { name: "Karnataka", tagline: "Western Ghats from Bangalore", image: "/images/region-sahyadri.jpg", blurb: "Kudremukh, Kumara Parvatha, Tadiyandamol — beginner to challenging treks reachable in a weekend from Bangalore." },
};

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return Object.keys(regionData).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const r = regionData[params.slug] ?? regionData.himachal;
  try {
    const page = await fetchCMSPage(`regions/${params.slug}`);
    return {
      title: page.seo_title ?? `${r.name} Treks | TrekYatra`,
      description: page.seo_description ?? r.blurb,
      alternates: { canonical: `${siteUrl}/regions/${params.slug}` },
      openGraph: { title: page.title, images: page.hero_image_url ? [page.hero_image_url] : [r.image] },
    };
  } catch {
    return {
      title: `${r.name} Treks | TrekYatra`,
      description: r.blurb,
      alternates: { canonical: `${siteUrl}/regions/${params.slug}` },
    };
  }
}

export const revalidate = 3600;

export default async function Region({ params }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const r = regionData[params.slug] ?? regionData.himachal;

  // Try CMS regional hub first
  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`regions/${params.slug}`);
  } catch {
    // use static data
  }

  const faqs = cmsPage?.content_json?.faqs ?? [];

  const stateTreks = treks
    .filter((t) => t.state.toLowerCase().includes(r.name.toLowerCase().split(" ")[0]))
    .concat(treks)
    .slice(0, 6);

  const breadcrumbItems = [
    { label: "Home", href: `${siteUrl}/` },
    { label: "Regions", href: `${siteUrl}/explore` },
    { label: r.name, href: `${siteUrl}/regions/${params.slug}` },
  ];

  return (
    <>
      <SchemaInjector schemas={[buildBreadcrumbSchema(breadcrumbItems)]} />

      <section className="relative h-[68vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={cmsPage?.hero_image_url ?? r.image}
            alt={r.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-foreground/10" />
        </div>
        <div className="container-wide relative pb-12 text-surface">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-3 flex items-center gap-2">
            <MapPin className="h-3 w-3" /> Region · India
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-4 max-w-4xl">{r.name}</h1>
          <p className="text-xl text-accent-glow mb-4">{r.tagline}</p>
          <p className="text-surface/85 max-w-2xl text-lg">{cmsPage?.seo_description ?? r.blurb}</p>
        </div>
      </section>

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

      {/* CMS rich content block (if available) */}
      {cmsPage?.content_html && (
        <section className="py-12">
          <div className="container-wide max-w-4xl">
            <div
              className="cms-section prose max-w-none text-foreground/85"
              dangerouslySetInnerHTML={{ __html: cmsPage.content_html }}
            />
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Top treks in {r.name}</h2>
            <Link href="/explore" className="text-sm text-accent font-medium hidden md:block">View all →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stateTreks.map((t) => (
              <TrekCard key={t.slug} trek={t} />
            ))}
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="py-12 border-t border-border">
          <div className="container-wide max-w-3xl">
            <h2 className="font-display text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
            <FAQAccordion items={faqs} />
          </div>
        </section>
      )}

      <section className="py-16 bg-surface-muted">
        <div className="container-wide">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-8">Best time to trek in {r.name}</h2>
          <div className="bg-card border border-border rounded-2xl p-6 overflow-x-auto">
            <div className="grid grid-cols-12 gap-2 min-w-[700px]">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => {
                const intensity = [0.9, 0.8, 0.5, 0.3, 0.7, 0.95, 0.4, 0.4, 0.7, 0.95, 0.85, 0.9][i];
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
          </div>
        </div>
      </section>

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
              <h3 className="font-display text-3xl font-semibold mb-3 leading-tight">
                Need help picking the right trek in {r.name}?
              </h3>
              <p className="text-surface/80">Tell us your fitness, dates and budget. We&apos;ll match you to the right trail.</p>
            </div>
            <Button variant="hero" size="lg" className="mt-6 w-fit">
              Plan My Trek <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
