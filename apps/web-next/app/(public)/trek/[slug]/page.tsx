import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrekCard } from "@/components/trek/TrekCard";
import { Button } from "@/components/ui/button";
import { fetchTreks, fetchTrekBySlug } from "@/lib/trekApi";
import { fetchCMSPage, type CMSPage } from "@/lib/api";
import {
  Bookmark, Share2, GitCompare, Sparkles, Clock, TrendingUp, Calendar,
  Shield, FileCheck, Backpack, Wallet, ChevronRight, Star, MapPin,
  AlertTriangle, Check, Mountain,
} from "lucide-react";
import type { Trek } from "@/components/trek/TrekCard";

export async function generateStaticParams() {
  const treks = await fetchTreks();
  return treks.map((t) => ({ slug: t.slug }));
}

// ── metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* not found — fall through to static defaults */ }

  const trekRaw = await fetchTrekBySlug(params.slug).catch(() => null);
  const title = cmsPage?.seo_title ?? trekRaw?.name ?? params.slug.replace(/-/g, " ");
  const description = cmsPage?.seo_description ?? trekRaw?.description ?? "";

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function TrekDetailPage({ params }: { params: { slug: string } }) {
  const [trekRaw, allTreks] = await Promise.all([
    fetchTrekBySlug(params.slug),
    fetchTreks(),
  ]);

  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* no CMS page — render with static data only */ }

  if (!trekRaw && !cmsPage) notFound();

  // Strip SEO subtitle from agent-generated titles ("Kedarkantha Trek: Complete Guide…" → "Kedarkantha Trek")
  const cmsDisplayName = cmsPage?.title
    ? cmsPage.title.split(/[:—]/)[0].trim()
    : null;

  const trek: Trek = trekRaw ?? {
    slug: params.slug,
    name: cmsDisplayName ?? cmsPage!.title,
    description: cmsPage!.seo_description ?? "",
    region: "",
    state: "",
    image: cmsPage!.hero_image_url ?? "/images/trek-forest.jpg",
    duration: "—",
    altitude: "—",
    difficulty: "Moderate",
    season: "—",
    beginner: false,
  };

  const related = allTreks.filter(t => t.slug !== trek.slug).slice(0, 3);

  // Prefer trek_facts from CMS over static trek data so editors can enrich
  const tf = cmsPage?.content_json?.trek_facts ?? {};
  const facts = [
    { icon: Clock,     label: "Duration",    value: tf.duration    || trek.duration    || "—" },
    { icon: TrendingUp,label: "Max altitude",value: tf.altitude    || trek.altitude    || "—" },
    { icon: Mountain,  label: "Difficulty",  value: tf.difficulty  || trek.difficulty  || "Moderate" },
    { icon: Calendar,  label: "Best season", value: tf.season      || trek.season      || "—" },
    { icon: FileCheck, label: "Permits",     value: tf.permits     || "Required" },
    { icon: MapPin,    label: "Base",        value: tf.base        || "Sankri" },
  ];

  const heroImg = cmsPage?.hero_image_url ?? trek.image ?? "/images/trek-forest.jpg";

  // Table of contents — keys must match Block ids below
  const toc = [
    { id: "why-this-trek",  label: "Why this trek" },
    { id: "quick-facts",    label: "Quick facts" },
    { id: "route-overview", label: "Route overview" },
    { id: "itinerary",      label: "Day-wise itinerary" },
    { id: "best-time",      label: "Best time" },
    { id: "difficulty",     label: "Difficulty" },
    { id: "permits",        label: "Permits" },
    { id: "cost-estimate",  label: "Cost estimate" },
    { id: "packing",        label: "Packing" },
    { id: "safety",         label: "Safety" },
    { id: "alternatives",   label: "Alternatives" },
    { id: "faqs",           label: "FAQs" },
  ];

  const sec = (cmsPage?.content_json?.sections ?? {}) as Record<string, string>;
  const S = (key: string) => sec[key] || null;

  return (
    <>
      {/* Hero */}
      <section className="relative h-[78vh] min-h-[600px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={trek.name} className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-foreground/20" />
        </div>
        <div className="container-wide relative pb-12 text-surface">
          <Link href="/explore" className="text-xs uppercase tracking-widest text-accent-glow hover:text-accent mb-4 inline-block">
            ← Explore / {trek.state || "Himalayan Treks"}
          </Link>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-widest">{facts[2].value}</span>
            {trek.beginner && <span className="px-3 py-1 rounded-full glass-dark text-xs uppercase tracking-widest">Beginner-friendly</span>}
            <span className="px-3 py-1 rounded-full glass-dark text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Star className="h-3 w-3 text-accent fill-accent" /> {formatUpdatedAt(cmsPage?.published_at ?? cmsPage?.updated_at)}
            </span>
          </div>
          {/* H1 uses the clean display name, not the full SEO title */}
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-4 max-w-4xl">
            {cmsDisplayName ?? trek.name}
          </h1>
          <p className="text-lg text-surface/85 max-w-2xl mb-6">{trek.description}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="hero" size="lg"><Sparkles className="h-4 w-4" /> Plan this trek</Button>
            <Button variant="glass" size="lg"><Bookmark className="h-4 w-4" /> Save</Button>
            <Button variant="glass" size="lg"><GitCompare className="h-4 w-4" /> Compare</Button>
            <Button variant="glass" size="lg"><Share2 className="h-4 w-4" /> Share</Button>
          </div>
        </div>
      </section>

      {/* Quick facts strip — anchored so TOC can link to it */}
      <section id="quick-facts" className="bg-card border-b border-border sticky top-16 z-30 hidden md:block scroll-mt-16">
        <div className="container-wide grid grid-cols-6 divide-x divide-border">
          {facts.map(f => (
            <div key={f.label} className="px-4 py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</div>
                <div className="text-sm font-semibold">{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-wide grid lg:grid-cols-[200px_1fr_320px] gap-10">

          {/* Left TOC sidebar — full grid-row height lets sticky work */}
          <aside className="hidden lg:block">
            <div className="sticky top-44 max-h-[calc(100vh-13rem)] overflow-y-auto space-y-2 pr-1">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">On this page</div>
              {toc.map((item, i) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${i === 0 ? "text-accent bg-accent/10 font-medium" : "text-foreground/70 hover:text-foreground"}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </aside>

          <article className="prose prose-lg max-w-none">
            <Block id="why-this-trek" eyebrow="Why this trek" title={`Why ${cmsDisplayName ?? trek.name} is on every Indian trekker's list`}>
              {S("why_this_trek") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("why_this_trek")! }} />
              ) : (
                <>
                  <p>From the snowy summit&apos;s 360° view to the silent pine campsites, this trek delivers the full Himalayan experience in a beginner-friendly window.</p>
                  <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {["Snow guarantee from late December to early April", "Reachable from Delhi in one overnight drive", "Multiple operators, competitive pricing", "Excellent acclimatisation profile"].map(p => (
                      <li key={p} className="flex items-start gap-2 text-base"><Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" /> {p}</li>
                    ))}
                  </ul>
                </>
              )}
            </Block>

            <Block id="route-overview" eyebrow="Route overview" title="The route at a glance">
              {S("route_overview") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("route_overview")! }} />
              ) : (
                <p>You start at Sankri (6,400 ft), climb gently through pine forest to Juda Ka Talab on day 2, ascend to base camp on day 3, summit on day 4, and return across days 5–6. Total distance: ~20 km.</p>
              )}
            </Block>

            <Block id="itinerary" eyebrow="Day-wise itinerary" title="What each day actually looks like">
              {S("itinerary") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("itinerary")! }} />
              ) : (
                <div className="not-prose space-y-3">
                  {[
                    { d: "Day 1", title: "Dehradun → Sankri", body: "210 km drive (10 hrs) along the Tons valley." },
                    { d: "Day 2", title: "Sankri → Juda Ka Talab", body: "4 km trek through oak/pine forest. 9,100 ft." },
                    { d: "Day 3", title: "Juda Ka Talab → Base Camp", body: "4 km gentle climb to 11,250 ft." },
                    { d: "Day 4", title: "Summit Day", body: "Pre-dawn start. 360° Himalayan view. Descend to Hargaon." },
                    { d: "Day 5", title: "Hargaon → Sankri", body: "Long descent through forest. 6 km." },
                    { d: "Day 6", title: "Sankri → Dehradun", body: "Drive back. Trip ends at Dehradun station by 9 PM." },
                  ].map(d => (
                    <div key={d.d} className="flex gap-4 p-5 bg-surface-muted rounded-2xl">
                      <div className="text-xs uppercase tracking-widest text-accent font-semibold pt-1 w-16">{d.d}</div>
                      <div>
                        <div className="font-display text-lg font-semibold">{d.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{d.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Block id="best-time" eyebrow="Best time to visit" title="When to go">
              {S("best_time") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("best_time")! }} />
              ) : (
                <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { season: "Dec – Feb", label: "Peak snow", note: "Best for summit views" },
                    { season: "Mar – Apr", label: "Late winter", note: "Lighter crowds" },
                    { season: "May – Jun", label: "Spring", note: "Meadows in bloom" },
                    { season: "Oct – Nov", label: "Autumn", note: "Crisp skies, dry trail" },
                  ].map(s => (
                    <div key={s.season} className="p-4 bg-card border border-border rounded-2xl text-center">
                      <div className="text-xs uppercase tracking-widest text-accent font-semibold">{s.season}</div>
                      <div className="font-semibold text-sm mt-1">{s.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Block id="difficulty" eyebrow="Difficulty & fitness" title="Is this trek right for you?">
              {S("difficulty") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("difficulty")! }} />
              ) : (
                <div className="not-prose">
                  <p className="text-foreground/85 mb-4">Rated <strong>Moderate</strong>. No prior trekking experience required, but basic cardiovascular fitness is recommended.</p>
                  <ul className="space-y-2">
                    {["Can walk/jog 5–8 km without stopping", "No prior Himalayan experience needed", "Acclimatisation built into the itinerary", "Altitude gain per day is gradual"].map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" /> {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Block>

            <Block id="permits" eyebrow="Permits" title="What permits you need">
              {S("permits") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("permits")! }} />
              ) : (
                <div className="not-prose p-5 rounded-2xl bg-warning/10 border border-warning/30 flex gap-3 mb-4">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">Forest Department permits are mandatory. Carry a Govt photo ID.</div>
                </div>
              )}
            </Block>

            <Block id="cost-estimate" eyebrow="Cost estimate" title="What this trek will actually cost you">
              {S("cost_estimate") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("cost_estimate")! }} />
              ) : (
                <div className="not-prose grid grid-cols-3 gap-3">
                  {[
                    { tier: "Budget", cost: "₹8,500", desc: "Group fixed-departure" },
                    { tier: "Mid", cost: "₹12,000", desc: "Better food, smaller groups" },
                    { tier: "Premium", cost: "₹18,000+", desc: "Private group, guide" },
                  ].map(c => (
                    <div key={c.tier} className="p-5 bg-card border border-border rounded-2xl">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.tier}</div>
                      <div className="font-display text-3xl font-semibold mt-1">{c.cost}</div>
                      <div className="text-xs text-muted-foreground mt-2">{c.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Block id="packing" eyebrow="Packing & gear" title="What to pack">
              {S("packing") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("packing")! }} />
              ) : (
                <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Layered clothing (thermal base, fleece, waterproof shell)", "Trekking poles", "Waterproof trekking boots", "Sunscreen SPF 50+ and UV sunglasses", "Hydration pack or water bottles (2 L minimum)", "First aid kit with altitude medication"].map(item => (
                    <div key={item} className="flex items-start gap-2 text-sm p-3 bg-surface-muted rounded-xl">
                      <Backpack className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> {item}
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Block id="safety" eyebrow="Safety" title="Staying safe on the mountain">
              {S("safety") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("safety")! }} />
              ) : (
                <div className="not-prose space-y-3">
                  <div className="p-4 bg-warning/8 border border-warning/20 rounded-2xl flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Watch for AMS symptoms: headache, nausea, dizziness. Descend immediately if symptoms worsen.</p>
                  </div>
                  <ul className="space-y-2">
                    {["Register with the Forest Department before entering the trail", "Never trek alone above base camp", "Carry an emergency whistle and headlamp", "Inform your guide of any health conditions"].map(s => (
                      <li key={s} className="flex items-start gap-2 text-sm"><Shield className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Block>

            {/* Alternatives — anchor section before the related treks strip */}
            <section id="alternatives" className="mb-12 scroll-mt-44">
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Alternatives</div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-5">Similar treks to consider</h2>
              {related.length > 0 ? (
                <div className="not-prose grid md:grid-cols-3 gap-4">
                  {related.map(t => <TrekCard key={t.slug} trek={t} />)}
                </div>
              ) : (
                <p className="text-foreground/60 text-sm">Explore more treks in our <Link href="/explore" className="text-accent underline">Explore</Link> section.</p>
              )}
            </section>

            <Block id="faqs" eyebrow="FAQs" title="Common questions answered">
              {S("faqs") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("faqs")! }} />
              ) : (
                <div className="not-prose space-y-3">
                  {[
                    ["Can a complete beginner attempt this?", "Yes — provided you can jog 5km in 30 minutes. Start training 4 weeks ahead."],
                    ["Will I see snow in March?", "Likely yes, especially above the base camp. April is uncertain."],
                    ["Is the trek safe for solo travellers?", "Yes, but always trek with a guide or join a group departure."],
                    ["What is the best base village?", "Sankri is the only base village for this trek, accessible from Dehradun."],
                  ].map(([q, a]) => (
                    <details key={q} className="group p-5 bg-surface-muted rounded-2xl">
                      <summary className="font-semibold cursor-pointer flex items-center justify-between">{q} <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" /></summary>
                      <p className="mt-3 text-sm text-muted-foreground">{a}</p>
                    </details>
                  ))}
                </div>
              )}
            </Block>
          </article>

          {/* Right utility sidebar — full grid-row height lets sticky work */}
          <aside className="hidden lg:block">
            <div className="sticky top-44 max-h-[calc(100vh-13rem)] overflow-y-auto space-y-4">
              <div className="bg-gradient-pine text-surface rounded-2xl p-6 stack-shadow">
                <div className="text-xs uppercase tracking-widest text-accent-glow mb-2">Plan this trek</div>
                <div className="font-display text-2xl font-semibold mb-4 leading-tight">Get matched with a vetted operator</div>
                <p className="text-sm text-surface/80 mb-5">Free planning help. We respond in 48 hrs.</p>
                <Button variant="hero" size="default" className="w-full">Plan My Trek</Button>
                <div className="mt-4 pt-4 border-t border-surface/15 text-xs text-surface/70 flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Editorially vetted operators only
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quick utilities</div>
                <div className="space-y-2">
                  {[
                    [Backpack, "Packing checklist", "/packing"],
                    [FileCheck, "Permit guide", "/permits"],
                    [Wallet, "Cost calculator", "/costs"],
                  ].map(([Icon, label, to]: any) => (
                    <Link key={to} href={to} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                      <span className="flex items-center gap-2.5 text-sm font-medium"><Icon className="h-4 w-4 text-accent" /> {label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="lg:hidden sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border p-3 z-40 flex gap-2">
        <Button variant="outline" size="default" className="flex-1"><Bookmark className="h-4 w-4" /> Save</Button>
        <Button variant="hero" size="default" className="flex-[2]"><Sparkles className="h-4 w-4" /> Plan this trek</Button>
      </div>
    </>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function formatUpdatedAt(dateStr?: string | null): string {
  if (!dateStr) return "Recently updated";
  const date = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 30) return `Updated ${diffDays} days ago`;
  return `Updated ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

function Block({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-44">
      <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">{eyebrow}</div>
      <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-5">{title}</h2>
      <div className="text-foreground/85 leading-relaxed">{children}</div>
    </section>
  );
}
