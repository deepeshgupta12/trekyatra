import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrekCard } from "@/components/trek/TrekCard";
import { Button } from "@/components/ui/button";
import { fetchTreks, fetchTrekBySlug } from "@/lib/trekApi";
import { fetchCMSPage, type CMSPage, type FAQItem } from "@/lib/api";
import TableOfContents from "@/components/content/TableOfContents";
import FAQAccordion from "@/components/content/FAQAccordion";
import Breadcrumb from "@/components/content/Breadcrumb";
import AuthorBlock from "@/components/content/AuthorBlock";
import SafetyDisclaimer from "@/components/content/SafetyDisclaimer";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema } from "@/lib/schema";
import {
  Bookmark, Share2, GitCompare, Sparkles, Clock, TrendingUp, Calendar,
  Shield, FileCheck, Backpack, Wallet, ChevronRight, Star, MapPin,
  Check, Mountain, Info,
} from "lucide-react";
import type { Trek } from "@/components/trek/TrekCard";

export async function generateStaticParams() {
  const treks = await fetchTreks();
  return treks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* not found */ }

  const trekRaw = await fetchTrekBySlug(params.slug).catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const title = cmsPage?.seo_title
    ? `${cmsPage.seo_title} | TrekYatra`
    : trekRaw?.name
    ? `${trekRaw.name} — Trek Guide | TrekYatra`
    : `${params.slug.replace(/-/g, " ")} | TrekYatra`;
  const description = cmsPage?.seo_description ?? trekRaw?.description ?? "";
  const canonicalUrl = `${siteUrl}/treks/${params.slug}`;
  const ogImage = cmsPage?.hero_image_url ?? trekRaw?.image ?? null;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TrekDetailPage({ params }: { params: { slug: string } }) {
  const [trekRaw, allTreks] = await Promise.all([
    fetchTrekBySlug(params.slug),
    fetchTreks(),
  ]);

  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* render with static data only */ }

  if (!trekRaw && !cmsPage) notFound();

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
  const tf = cmsPage?.content_json?.trek_facts ?? {};
  const facts = [
    { icon: Clock,      label: "Duration",    value: tf.duration    || trek.duration    || "—" },
    { icon: TrendingUp, label: "Max altitude", value: tf.altitude    || trek.altitude    || "—" },
    { icon: Mountain,   label: "Difficulty",  value: tf.difficulty  || trek.difficulty  || "—" },
    { icon: Calendar,   label: "Best season", value: tf.season      || trek.season      || "—" },
    { icon: FileCheck,  label: "Permits",     value: tf.permits     || "—" },
    { icon: MapPin,     label: "Base",        value: tf.base        || "—" },
  ];

  const heroImg = cmsPage?.hero_image_url ?? trek.image ?? "/images/trek-forest.jpg";

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

  // Structured FAQ items from CMS (auto-extracted or editor-supplied)
  const faqItems: FAQItem[] = cmsPage?.content_json?.faqs ?? [];

  // JSON-LD schemas
  const pageUrl = `/treks/${params.slug}`;
  const articleSchema = buildArticleSchema({
    title: cmsPage?.seo_title ?? trek.name,
    description: cmsPage?.seo_description ?? trek.description ?? "",
    url: pageUrl,
    publishedAt: cmsPage?.published_at ?? undefined,
    updatedAt: cmsPage?.updated_at ?? undefined,
    imageUrl: cmsPage?.hero_image_url ?? trek.image ?? undefined,
  });
  const faqSchema = faqItems.length ? buildFAQSchema(faqItems) : null;
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: trek.state || "Treks", href: "/explore" },
    { label: cmsDisplayName ?? trek.name },
  ]);

  return (
    <>
      <SchemaInjector schemas={[articleSchema, faqSchema, breadcrumbSchema]} />
      {/* Hero */}
      <section className="relative h-[78vh] min-h-[600px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={trek.name} className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-foreground/20" />
        </div>
        <div className="container-wide relative pb-12 text-surface">
          <Breadcrumb items={[
            { label: "Explore", href: "/explore" },
            { label: trek.state || "Himalayan Treks", href: "/explore" },
            { label: cmsDisplayName ?? trek.name },
          ]} />
          <div className="flex items-center gap-2 mt-3 mb-3 flex-wrap">
            {tf.difficulty && (
              <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-widest">{tf.difficulty.split(" ")[0]}</span>
            )}
            {trek.beginner && <span className="px-3 py-1 rounded-full glass-dark text-xs uppercase tracking-widest">Beginner-friendly</span>}
            <span className="px-3 py-1 rounded-full glass-dark text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Star className="h-3 w-3 text-accent fill-accent" /> {formatUpdatedAt(cmsPage?.published_at ?? cmsPage?.updated_at)}
            </span>
          </div>
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

      {/* Quick facts sticky strip */}
      <section id="quick-facts-strip" className="bg-card border-b border-border sticky top-16 z-30 hidden md:block">
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

      <section className="pt-16 pb-16 md:pt-20 md:pb-20">
        <div className="container-wide grid lg:grid-cols-[200px_1fr_320px] gap-10">

          {/* Left TOC sidebar — client component with scroll spy */}
          <aside className="hidden lg:block">
            <div className="sticky top-44">
              <TableOfContents items={toc} />
            </div>
          </aside>

          <article className="prose prose-lg max-w-none">
            <Block id="why-this-trek" eyebrow="Why this trek" title={`Why ${cmsDisplayName ?? trek.name} is on every trekker's list`}>
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

            {/* Quick facts — body-level anchor so TOC scroll works */}
            <section id="quick-facts" className="mb-12 scroll-mt-44">
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Quick facts</div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-5">At a glance</h2>
              <div className="not-prose grid grid-cols-2 sm:grid-cols-3 gap-3">
                {facts.filter(f => f.value !== "—").map(f => (
                  <div key={f.label} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
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

            <Block id="route-overview" eyebrow="Route overview" title="The route at a glance">
              {S("route_overview") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("route_overview")! }} />
              ) : (
                <p>This trek follows a well-established trail from the base village through forested ridgelines to the summit. The path is clearly marked for most of the route.</p>
              )}
            </Block>

            <Block id="itinerary" eyebrow="Day-wise itinerary" title="What each day actually looks like">
              {S("itinerary") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("itinerary")! }} />
              ) : (
                <p className="text-muted-foreground italic">Detailed itinerary coming soon. Contact us for a day-by-day breakdown.</p>
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
                  <p className="text-foreground/85 mb-4">Basic cardiovascular fitness is recommended. No technical climbing experience required.</p>
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
                  <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">Check with the local forest department for current permit requirements before starting the trek.</div>
                </div>
              )}
            </Block>

            <Block id="cost-estimate" eyebrow="Cost estimate" title="What this trek will cost you">
              {S("cost_estimate") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("cost_estimate")! }} />
              ) : (
                <div className="not-prose p-5 rounded-2xl bg-muted/50 border border-border flex gap-3">
                  <Wallet className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    Trek costs vary by operator, group size, and season. <Link href="/plan" className="text-accent underline">Get in touch</Link> for a tailored quote or compare operators on our planning page.
                  </div>
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
                  <SafetyDisclaimer />
                  <ul className="space-y-2">
                    {["Register with the Forest Department before entering the trail", "Never trek alone above base camp", "Carry an emergency whistle and headlamp", "Inform your guide of any health conditions"].map(s => (
                      <li key={s} className="flex items-start gap-2 text-sm"><Shield className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Block>

            {/* Alternatives */}
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

            {/* FAQs — structured accordion when CMS data available, fallback HTML otherwise */}
            <Block id="faqs" eyebrow="FAQs" title="Common questions answered">
              {faqItems.length > 0 ? (
                <div className="not-prose">
                  <FAQAccordion items={faqItems} />
                </div>
              ) : S("faqs") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("faqs")! }} />
              ) : (
                <p className="text-muted-foreground italic text-sm">No FAQs available yet. <Link href="/contact" className="text-accent underline">Ask us a question</Link>.</p>
              )}
            </Block>

            <AuthorBlock
              publishedAt={cmsPage?.published_at}
              updatedAt={cmsPage?.updated_at}
            />
          </article>

          {/* Right utility sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-44">
              <div className="max-h-[calc(100vh-13rem)] overflow-y-auto space-y-4">
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
