"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Mail, Instagram, Youtube, ArrowRight, MapPin, Phone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const cols = [
  {
    title: "Discover",
    links: [
      ["Explore all treks", "/explore"],
      ["Top regions", "/regions/himachal"],
      ["Seasonal picks", "/seasons/winter"],
      ["Beginner treks", "/beginner"],
      ["Trek comparisons", "/compare"],
    ],
  },
  {
    title: "Plan",
    links: [
      ["Packing checklists", "/packing"],
      ["Permit guides", "/permits"],
      ["Cost estimators", "/costs"],
      ["Itineraries", "/itineraries"],
      ["Plan My Trek", "/plan"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Gear reviews", "/gear"],
      ["Digital products", "/products"],
      ["Newsletter", "/newsletter"],
      ["Author network", "/about/authors"],
      ["Editorial methodology", "/methodology"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["About TrekYatra", "/about"],
      ["Contact", "/contact"],
      ["Privacy Policy", "/privacy"],
      ["Terms", "/terms"],
      ["Affiliate disclosure", "/affiliate-disclosure"],
      ["Safety disclaimer", "/safety-disclaimer"],
    ],
  },
];

export const Footer = () => (
  <footer className="bg-gradient-twilight text-surface mt-24 relative overflow-hidden">
    <svg className="absolute top-0 left-0 right-0 w-full" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,80 L0,50 L120,28 L240,46 L360,18 L480,40 L600,12 L720,38 L840,22 L960,44 L1080,20 L1200,42 L1200,80 Z" fill="hsl(var(--background))" />
    </svg>

    <div className="container-wide pt-36 pb-24 lg:pb-12 relative">
      {/* pt-36 (144px) ensures the card sits clearly BELOW the 80px mountain SVG */}
      <div className="rounded-2xl border border-white/20 bg-white/[0.07] p-8 md:p-10 mb-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-3">The Trail Letter</div>
          <h3 className="font-display text-3xl md:text-4xl text-surface leading-tight mb-3">
            Seasonal trek picks. Permit updates. Honest gear notes.
          </h3>
          <p className="text-surface/70 text-sm">One slow, considered email every month. No spam, ever.</p>
        </div>
        <form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="you@trail.in"
            className="flex-1 h-12 px-5 rounded-full bg-surface/10 border border-surface/20 text-surface placeholder:text-surface/40 focus:outline-none focus:border-accent"
          />
          <Button variant="hero" size="lg" type="submit" className="w-full sm:w-auto">
            Subscribe <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="grid lg:grid-cols-6 gap-12 mb-12">
        <div className="lg:col-span-2">
          <Logo variant="light" size="lg" />
          <p className="mt-5 text-sm text-surface/70 leading-relaxed max-w-xs">
            India&apos;s editorial trekking companion. We map routes, surface trust, and help you choose the right trail — from the Sahyadris to the high Himalayas.
          </p>
          <div className="flex items-center gap-3 mt-6">
            {([
              [Instagram, "TrekYatra on Instagram"],
              [Youtube, "TrekYatra on YouTube"],
              [Mail, "Contact TrekYatra"],
            ] as const).map(([Icon, label], i) => (
              <a key={i} href="#" aria-label={label} className="h-10 w-10 rounded-full bg-surface/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <div className="text-xs uppercase tracking-widest text-accent-glow mb-4">{col.title}</div>
            <ul className="space-y-2.5">
              {col.links.map(([label, to]) => (
                <li key={to}>
                  <Link href={to} className="text-sm text-surface/75 hover:text-surface transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-surface/10 pt-8 flex flex-col gap-3 md:flex-row md:justify-between md:items-center text-xs text-surface/50">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
          {/* suppressHydrationWarning: the year is computed at render time, so a page cached
              as static/ISR can render one year in the build's HTML and a different one on the
              client across a New-Year boundary (a #425 text mismatch). This is React's official
              escape hatch for timestamps — it keeps the correct year in the server HTML (good
              for SEO, no flash) and silences the spurious warning without a mount-guard. */}
          <span suppressHydrationWarning className="flex items-center gap-1.5 font-medium text-surface/60">
            © 2023–{new Date().getFullYear()} TrekYatra. All rights reserved.
          </span>
          <span className="flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-accent fill-accent" /> in India.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Gurgaon · India</span>
          <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> explore@trekyatra.co.in</span>
        </div>
      </div>
    </div>
  </footer>
);
