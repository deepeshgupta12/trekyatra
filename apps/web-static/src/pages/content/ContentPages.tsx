import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Backpack, FileCheck, Wallet, Calendar, Mountain, Shield, Download, Check, ShoppingBag, Star, Sparkles, ArrowRight, Mail, AlertTriangle, ChevronRight } from "lucide-react";

/* Generic premium content page used by Packing, Permits, Costs, Itinerary, Beginner, Gear, Safety, Methodology, Author, About, Contact, Privacy, Terms, Disclosures */

type Block = { eyebrow?: string; title: string; body?: string; bullets?: string[]; cards?: { title: string; body: string; value?: string }[]; cta?: { label: string; to: string } };

export const ContentPage = ({
  eyebrow,
  title,
  subtitle,
  icon: Icon = Mountain,
  tone = "default",
  blocks = [],
  showDownload = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: any;
  tone?: "default" | "trust" | "monetize" | "calm";
  blocks?: Block[];
  showDownload?: boolean;
}) => {
  const heroBg = tone === "trust" ? "bg-gradient-pine text-surface" : tone === "calm" ? "bg-mist" : tone === "monetize" ? "bg-gradient-twilight text-surface" : "bg-gradient-paper";
  const isLight = tone === "trust" || tone === "monetize";

  return (
    <SiteLayout>
      <section className={`${heroBg} py-16 md:py-24 relative overflow-hidden`}>
        <div className="container-wide relative">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${isLight ? "glass-dark" : "bg-card border border-border"} text-xs uppercase tracking-widest mb-5`}>
            <Icon className={`h-3 w-3 ${isLight ? "text-accent-glow" : "text-accent"}`} /> {eyebrow}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-5 max-w-4xl">{title}</h1>
          <p className={`text-lg max-w-2xl ${isLight ? "text-surface/85" : "text-muted-foreground"}`}>{subtitle}</p>
          {showDownload && (
            <div className="flex flex-wrap gap-3 mt-8">
              <Button variant="hero" size="lg"><Download className="h-4 w-4" /> Download PDF</Button>
              <Button variant={isLight ? "glass" : "outline"} size="lg">Save for later</Button>
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container-narrow space-y-16">
          {blocks.map((b, i) => (
            <div key={i}>
              {b.eyebrow && <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">{b.eyebrow}</div>}
              <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-5">{b.title}</h2>
              {b.body && <p className="text-foreground/85 text-lg leading-relaxed mb-5">{b.body}</p>}
              {b.bullets && (
                <ul className="grid md:grid-cols-2 gap-3 mb-5">
                  {b.bullets.map(x => (
                    <li key={x} className="flex items-start gap-2.5 p-4 bg-card border border-border rounded-xl">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{x}</span>
                    </li>
                  ))}
                </ul>
              )}
              {b.cards && (
                <div className="grid md:grid-cols-3 gap-4">
                  {b.cards.map(c => (
                    <div key={c.title} className="p-6 bg-card border border-border rounded-2xl">
                      {c.value && <div className="font-display text-3xl font-semibold text-accent mb-2">{c.value}</div>}
                      <div className="font-display text-lg font-semibold mb-2">{c.title}</div>
                      <div className="text-sm text-muted-foreground">{c.body}</div>
                    </div>
                  ))}
                </div>
              )}
              {b.cta && (
                <Link to={b.cta.to} className="inline-flex items-center gap-1 text-accent font-medium mt-4">
                  {b.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
};

export const Packing = () => (
  <ContentPage eyebrow="Packing" title="The Indian trekker's packing system" subtitle="Season-tuned, trek-tested checklists. Built around layering, weight, and the realities of Indian trekking." icon={Backpack} showDownload
    blocks={[
      { eyebrow: "Clothing", title: "Layer like the mountains demand it", body: "Three layers, always: a moisture-wicking base, an insulating mid-layer (fleece or down), and a waterproof shell. Cotton kills above the snowline.",
        bullets: ["3 quick-dry t-shirts (no cotton)","2 thermal base layers","1 fleece + 1 down jacket","Waterproof shell jacket + pants","Trekking pants (avoid jeans)","Warm gloves + liner gloves","Woollen cap + sun cap","3-4 pairs woollen/synthetic socks"] },
      { eyebrow: "Footwear", title: "Boots — your single most important purchase", body: "High-ankle waterproof trekking boots, broken in over at least 50km before your trek. Microspikes and gaiters for snow." },
      { eyebrow: "Gear", title: "Backpack, sleeping & daypack",
        cards: [
          { title: "Backpack", body: "55-65L with rain cover" },
          { title: "Sleeping bag", body: "-10°C for snow, 0°C for summer" },
          { title: "Daypack", body: "20-30L for summit day" },
        ] },
      { eyebrow: "Documents", title: "What to carry in your wallet", bullets: ["Govt photo ID (mandatory)","Medical insurance","Emergency contacts (printed)","Cash + cards","Permits (printed)"] },
    ]} />
);

export const Permits = () => (
  <ContentPage eyebrow="Permits" title="India trekking permits — the complete map" subtitle="Who needs what, where to get it, and the mistakes that turn people back at the checkpost." icon={FileCheck} tone="calm"
    blocks={[
      { title: "Updated this week — last verified Jan 2026", body: "Permit rules change. We re-verify every guide every 14 days. Always cross-check at the local Forest office before your trek." },
      { eyebrow: "By region", title: "Quick permit map",
        cards: [
          { title: "Uttarakhand", body: "Forest Dept permits at trailhead. Usually arranged by operators." },
          { title: "Himachal", body: "Inner Line Permits for Spiti/Kinnaur. Standard treks need only Forest entry." },
          { title: "Ladakh", body: "ILP mandatory for non-Indians and most border treks. Apply online." },
        ] },
      { title: "Common permit mistakes", bullets: ["Carrying photocopies without the original ID","Permits expired by 1-2 days","Wrong issuing authority","Missing trekker insurance proof"] },
    ]} />
);

export const Costs = () => (
  <ContentPage eyebrow="Cost guides" title="What Indian trekking actually costs" subtitle="Honest, line-item breakdowns for budget, mid-range and premium trekking — including the costs people forget." icon={Wallet}
    blocks={[
      { eyebrow: "Tier overview", title: "Three ways to do most Himalayan treks",
        cards: [
          { value: "₹8K", title: "Budget", body: "Group fixed-departure, basic stay, shared dorm tents" },
          { value: "₹14K", title: "Mid-range", body: "Smaller groups, better food, twin-share tents" },
          { value: "₹25K+", title: "Premium", body: "Private group, certified guide, comfort tents" },
        ] },
      { title: "Hidden costs nobody tells you about", bullets: ["Travel to base town (₹2-5K)","Gear rental (₹1-3K)","Personal medication / energy bars","Mules for backpack offload","Tips for trek staff (₹500-1K)","Last-minute hotel before/after"] },
    ]} />
);

export const Itinerary = () => (
  <ContentPage eyebrow="Itinerary" title="Day-wise itineraries that actually work" subtitle="Built from real trekker logs, not brochure copy. Distance, altitude, time and stay — for every day." icon={Calendar} showDownload
    blocks={[
      { title: "How we build itineraries", body: "Every itinerary on TrekYatra is cross-referenced against operator schedules, trekker GPX logs and our editor's own field notes. We adjust them after every season." },
    ]} />
);

export const Beginner = () => (
  <ContentPage eyebrow="Beginner" title="Your first trek — start here" subtitle="If you've never trekked above 10,000 ft, read this before you book anything. India-specific, bullshit-free." icon={Mountain}
    blocks={[
      { eyebrow: "Mistakes", title: "11 mistakes first-time Indian trekkers make", bullets: ["Booking the cheapest operator","Not training for 4 weeks","Wearing brand new boots","Skipping the medical certificate","Underestimating altitude","Cotton clothing","Cheap rented sleeping bag","Booking peak weekend dates","Solo trekking unprepared","Skipping travel insurance","Not buffering 1 extra day"] },
      { eyebrow: "Picks", title: "Best first treks by city",
        cards: [
          { title: "From Mumbai", body: "Rajmachi, Kalsubai, Harishchandragad" },
          { title: "From Bangalore", body: "Kumara Parvatha, Tadiyandamol, Skandagiri" },
          { title: "From Delhi", body: "Nag Tibba, Kedarkantha, Brahmatal" },
        ] },
    ]} />
);

export const Gear = () => (
  <ContentPage eyebrow="Gear" title="Trekking gear — honest reviews from the field" subtitle="No paid placement. Editor picks, beginner picks, budget picks, and what to actually skip." icon={ShoppingBag}
    blocks={[
      { title: "Affiliate disclosure", body: "Some links here are affiliate. We only review gear our editors have used in the field for at least one full season." },
      { eyebrow: "Categories", title: "Browse by category",
        cards: [
          { title: "Backpacks", body: "55L–70L for multi-day treks" },
          { title: "Shoes & boots", body: "From weekend trail to expedition" },
          { title: "Sleeping bags", body: "0°C, -10°C, -20°C ratings" },
          { title: "Jackets", body: "Down, synthetic, rain shells" },
          { title: "Headlamps", body: "Battery & USB-C rechargeable" },
          { title: "Trekking poles", body: "Aluminium vs carbon" },
        ] },
    ]} />
);

export const Safety = () => (
  <ContentPage eyebrow="Safety" title="Trek safety — the things that actually matter" subtitle="Altitude, weather, evacuation, and the calls that experienced trekkers make differently." icon={Shield} tone="calm"
    blocks={[
      { title: "Altitude sickness — what to watch for", bullets: ["Persistent headache","Loss of appetite","Dizziness or confusion","Dry persistent cough","Nausea or vomiting","Difficulty sleeping"] },
      { title: "When to turn back", body: "Always. The mountain isn't going anywhere. We've yet to meet a trekker who regretted descending early." },
    ]} />
);

export const Plan = () => (
  <SiteLayout>
    <section className="bg-gradient-twilight text-surface py-16 md:py-24 relative overflow-hidden">
      <div className="container-wide grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-xs uppercase tracking-widest mb-5">
            <Sparkles className="h-3 w-3 text-accent-glow" /> Plan My Trek
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] mb-5">Tell us where you want to go. We'll handle the rest.</h1>
          <p className="text-surface/80 text-lg max-w-xl mb-6">Free planning help in 48 hours. Vetted operators, honest pricing, real human guidance.</p>
          <div className="flex items-center gap-6 text-sm text-surface/70">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> No spam</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> No pressure</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Vetted operators only</span>
          </div>
        </div>
        <form className="bg-card text-foreground rounded-2xl p-7 stack-shadow space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="text-xs uppercase tracking-widest text-accent mb-2">Step 1 of 3 · Your trek</div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Where would you like to trek?</label>
            <select className="w-full h-12 px-4 rounded-xl border border-border bg-surface mt-1.5">
              <option>Open to suggestions</option><option>Himachal Pradesh</option><option>Uttarakhand</option><option>Kashmir / Ladakh</option><option>Sahyadris</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fitness level</label>
              <select className="w-full h-12 px-4 rounded-xl border border-border bg-surface mt-1.5"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trip length</label>
              <select className="w-full h-12 px-4 rounded-xl border border-border bg-surface mt-1.5"><option>3-5 days</option><option>6-8 days</option><option>9+ days</option></select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <input type="email" placeholder="you@trail.in" className="w-full h-12 px-4 rounded-xl border border-border bg-surface mt-1.5" />
          </div>
          <Button variant="hero" size="lg" className="w-full">Continue <ArrowRight className="h-4 w-4" /></Button>
        </form>
      </div>
    </section>
  </SiteLayout>
);

export const Newsletter = () => (
  <ContentPage eyebrow="Newsletter" title="The Trail Letter" subtitle="One slow, considered email a month. Seasonal trek picks, permit changes, packing tips, and beginner lessons." icon={Mail}
    blocks={[
      { title: "What you'll get", bullets: ["Seasonal trek recommendations","Permit and safety updates","New comparison guides","Editor picks on gear","Beginner lessons series"] },
    ]} />
);

export const Products = () => (
  <ContentPage eyebrow="Digital Products" title="Planning resources, made by trekkers" subtitle="Notion templates, PDF planners, training programs and packing systems." icon={Download}
    blocks={[
      { title: "Featured downloads",
        cards: [
          { title: "The Himalayan Packing System", body: "24-page PDF · ₹299" },
          { title: "First Trek Training Plan", body: "4-week program · ₹499" },
          { title: "Trekking Cost Calculator", body: "Notion template · Free" },
        ] },
    ]} />
);

export const About = () => (
  <ContentPage eyebrow="About" title="Why we built TrekYatra" subtitle="Because Indian trekking deserves better than generic blog content. We're building the trekking platform we wished existed when we started." icon={Mountain}
    blocks={[
      { title: "Our editorial mission", body: "Every guide on TrekYatra is written by someone who has done the trek. Every permit page is re-verified every 14 days. Every comparison is built from actual trail data, not marketing copy." },
      { title: "Our promises", bullets: ["No paid placement in editorial guides","No fake reviews","Affiliate disclosures on every gear page","Public methodology page","Updated dates on every page"] },
    ]} />
);

export const Generic = ({ title, eyebrow, subtitle }: { title: string; eyebrow: string; subtitle: string }) => (
  <ContentPage eyebrow={eyebrow} title={title} subtitle={subtitle} tone="calm"
    blocks={[
      { title: "Overview", body: "This page outlines the policy and approach we take. Last updated: January 2026. Contact hello@trekyatra.in for questions." },
    ]} />
);
