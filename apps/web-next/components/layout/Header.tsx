"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bookmark, User, Menu, X, ChevronDown, Mountain, Compass, Calendar, GitCompare, Backpack, FileCheck, Wallet, ShoppingBag, MapPin, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

const megaSections = [
  {
    title: "Top Regions",
    icon: MapPin,
    items: [
      { label: "Himachal Pradesh", to: "/regions/himachal" },
      { label: "Uttarakhand", to: "/regions/uttarakhand" },
      { label: "Kashmir", to: "/regions/kashmir" },
      { label: "Ladakh", to: "/regions/ladakh" },
      { label: "Maharashtra (Sahyadris)", to: "/regions/maharashtra" },
      { label: "Karnataka", to: "/regions/karnataka" },
      { label: "Sikkim & North East", to: "/regions/sikkim" },
    ],
  },
  {
    title: "By City",
    icon: Compass,
    items: [
      { label: "Weekend treks near Mumbai", to: "/explore?near=mumbai" },
      { label: "Beginner treks near Bangalore", to: "/explore?near=bangalore" },
      { label: "Winter treks near Delhi", to: "/explore?near=delhi" },
      { label: "Treks from Pune", to: "/explore?near=pune" },
      { label: "Treks from Chennai", to: "/explore?near=chennai" },
    ],
  },
  {
    title: "By Season",
    icon: Calendar,
    items: [
      { label: "Best Winter Treks", to: "/seasons/winter" },
      { label: "Monsoon Treks (Sahyadri)", to: "/seasons/monsoon" },
      { label: "Summer Himalayan Treks", to: "/seasons/summer" },
      { label: "Treks in December", to: "/seasons/december" },
      { label: "Treks in May", to: "/seasons/may" },
    ],
  },
  {
    title: "Trust & Planning",
    icon: FileCheck,
    items: [
      { label: "Permit guides", to: "/permits" },
      { label: "Packing checklists", to: "/packing" },
      { label: "Cost estimators", to: "/costs" },
      { label: "Safety hub", to: "/safety" },
      { label: "Beginner guides", to: "/beginner" },
    ],
  },
];

const primaryLinks = [
  { label: "Explore", to: "/explore", icon: Compass },
  { label: "Regions", to: "/regions/himachal", icon: MapPin, hasMega: true },
  { label: "Seasons", to: "/seasons/winter", icon: Calendar },
  { label: "Compare", to: "/compare", icon: GitCompare },
  { label: "Packing", to: "/packing", icon: Backpack },
  { label: "Permits", to: "/permits", icon: FileCheck },
  { label: "Gear", to: "/gear", icon: ShoppingBag },
];

const mobileLinks = [
  ...primaryLinks,
  { label: "Costs", to: "/costs", icon: Wallet },
];

export const Header = () => {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        <div className="glass border-b border-border/60">
          <div className="container-wide flex h-16 items-center gap-6">
            <Logo />

            <nav className="hidden lg:flex items-center gap-1 ml-2">
              {primaryLinks.map((link) => (
                <div
                  key={link.to}
                  onMouseEnter={() => link.hasMega && setMegaOpen(true)}
                  onMouseLeave={() => link.hasMega && setMegaOpen(false)}
                >
                  <Link
                    href={link.to}
                    className={`px-3 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-1 ${
                      pathname === link.to || pathname.startsWith(link.to + "/")
                        ? "text-accent"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                    {link.hasMega && <ChevronDown className="h-3 w-3 opacity-60" />}
                  </Link>
                </div>
              ))}
            </nav>

            <div className="flex-1" />

            <button className="hidden md:flex items-center gap-2 px-4 h-10 rounded-full border border-border bg-surface/60 text-sm text-muted-foreground hover:border-foreground/30 transition-all min-w-[200px]">
              <Search className="h-4 w-4" />
              <span>Search treks, regions…</span>
              <kbd className="ml-auto text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
            </button>

            <div className="flex items-center gap-1">
              <Link href="/saved" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted text-foreground/70 hover:text-foreground transition-colors" aria-label="Saved">
                <Bookmark className="h-4 w-4" />
              </Link>
              <Link href="/auth/sign-in" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted text-foreground/70 hover:text-foreground transition-colors" aria-label="Account">
                <User className="h-4 w-4" />
              </Link>
              <Link href="/plan" className="hidden md:block">
                <Button variant="hero" size="default">
                  <Sparkles className="h-4 w-4" /> Plan My Trek
                </Button>
              </Link>
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {megaOpen && (
            <div
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
              className="absolute left-0 right-0 top-16 bg-surface border-b border-border shadow-elevated animate-fade-up"
            >
              <div className="container-wide py-8 grid grid-cols-4 gap-8">
                {megaSections.map((section) => (
                  <div key={section.title}>
                    <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-widest text-muted-foreground">
                      <section.icon className="h-3.5 w-3.5 text-accent" />
                      {section.title}
                    </div>
                    <ul className="space-y-2.5">
                      {section.items.map((item) => (
                        <li key={item.to}>
                          <Link href={item.to} className="text-sm text-foreground/80 hover:text-accent transition-colors">
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="bg-muted/40 border-t border-border">
                <div className="container-wide py-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>250+ trek guides · Updated weekly · India-first</span>
                  <Link href="/explore" className="text-accent font-semibold hover:underline">Browse all treks →</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[90%] max-w-sm bg-background shadow-elevated overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <button className="w-full flex items-center gap-2 px-4 h-12 rounded-full border border-border bg-surface text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                <span>Search treks, regions…</span>
              </button>
            </div>
            <nav className="px-5 pb-5 space-y-1">
              {mobileLinks.map((link) => (
                <Link
                  key={link.to}
                  href={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-foreground"
                >
                  <link.icon className="h-4 w-4 text-accent" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-border space-y-1">
                <Link href="/saved" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted">
                  <Bookmark className="h-4 w-4" /> Saved Treks
                </Link>
                <Link href="/auth/sign-in" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted">
                  <User className="h-4 w-4" /> Sign in
                </Link>
              </div>
            </nav>
            <div className="p-5">
              <Link href="/plan" onClick={() => setMobileOpen(false)}>
                <Button variant="hero" size="lg" className="w-full">
                  <Sparkles className="h-4 w-4" /> Plan My Trek
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
