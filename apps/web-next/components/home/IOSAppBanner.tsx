"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, MapPin, Bell, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { subscribeNewsletter } from "@/lib/api";
import { trackNewsletterSubscribed, trackEvent } from "@/lib/analytics";

const SOURCE = "ios_waitlist";

const FEATURES = [
  { icon: MapPin, text: "Downloadable maps & GPX for 200+ Indian trails" },
  { icon: Sparkles, text: "Plan a trek end-to-end in under a minute" },
  { icon: Bell, text: "Permit windows, weather shifts & safety alerts" },
];

type Status = "idle" | "loading" | "ok" | "err";

/**
 * iOS "coming soon" waitlist banner — last section of the home page, above the footer.
 * Email capture reuses the existing newsletter subscribe API (source_page="ios_waitlist").
 * App is under review, so the CTA is "Notify me" (no App Store link yet). When it goes live,
 * swap the pill + form for an App Store badge.
 */
export function IOSAppBanner() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const honeypot = useRef("");
  const sectionRef = useRef<HTMLElement>(null);
  const seen = useRef(false);

  // Fire a single impression event when the banner scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || seen.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !seen.current) {
          seen.current = true;
          trackEvent("engagement", "ios_banner_view", { source: SOURCE });
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot.current) return; // bot filled the hidden field
    const value = email.trim();
    if (!value || !value.includes("@") || !value.split("@")[1]?.includes(".")) {
      setStatus("err");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      const res = await subscribeNewsletter({ email: value, source_page: SOURCE });
      trackNewsletterSubscribed(SOURCE);
      trackEvent("conversion", "ios_waitlist_submit", { source: SOURCE, already_subscribed: res.already_subscribed });
      setStatus("ok");
      setMessage(res.already_subscribed ? "You're already on the list — we'll email you when it's live." : "You're on the list! We'll email you the moment TrekYatra for iOS is live.");
    } catch {
      setStatus("err");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <section ref={sectionRef} className="py-16 md:py-24" aria-labelledby="ios-banner-title">
      <div className="container-wide">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-12 md:px-14 md:py-16 text-surface"
          style={{ background: "linear-gradient(155deg, hsl(162 34% 11%) 0%, hsl(158 26% 16%) 55%, hsl(150 24% 12%) 100%)" }}
        >
          {/* soft mountain glow */}
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            {/* Left: copy + form */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface/90 ring-1 ring-white/15">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Coming to the App Store
              </span>

              <h2 id="ios-banner-title" className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mt-5">
                The trail fits in your pocket now.
                <br />
                <span className="text-accent">TrekYatra for iOS.</span>
              </h2>

              <p className="text-surface/75 text-base md:text-lg max-w-xl mt-4 leading-relaxed">
                Offline topo maps for the Himalayas and Sahyadris. AI trip planning in 60 seconds.
                Real-time weather alerts, permit reminders, and GPX tracks that work when the network doesn&apos;t.
              </p>

              <ul className="mt-6 space-y-2.5">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm md:text-[15px] text-surface/85">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-accent/15">
                      <Icon className="h-3.5 w-3.5 text-accent" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              {/* Notify me */}
              {status === "ok" ? (
                <div className="mt-8 flex items-start gap-3 rounded-2xl bg-white/8 px-4 py-4 ring-1 ring-white/12" role="status" aria-live="polite">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-pine">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </span>
                  <p className="text-sm text-surface/90">{message}</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-8 max-w-md" noValidate>
                  <label htmlFor="ios-waitlist-email" className="sr-only">Email address</label>
                  {/* honeypot */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                    onChange={(e) => (honeypot.current = e.target.value)}
                  />
                  <div className="flex flex-col gap-2.5 rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/15 sm:flex-row sm:items-center">
                    <input
                      id="ios-waitlist-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (status === "err") setStatus("idle"); }}
                      placeholder="Enter your email"
                      className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-surface placeholder:text-surface/45 focus:outline-none"
                    />
                    <Button type="submit" variant="hero" size="sm" disabled={status === "loading"} className="shrink-0">
                      {status === "loading" ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
                      ) : (
                        <>Notify me <ArrowRight className="h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                  {status === "err" && (
                    <p className="mt-2 text-xs text-red-300" role="alert" aria-live="assertive">{message}</p>
                  )}
                  <p className="mt-3 text-xs text-surface/50">
                    No spam. Unsubscribe anytime. We respect the mountains — and your inbox.
                  </p>
                </form>
              )}
            </div>

            {/* Right: preview card */}
            <div className="rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/12">
              <div className="flex justify-center">
                <Logo variant="light" size="lg" />
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-surface/80 ring-1 ring-white/15">
                iOS App Preview
              </span>
              <p className="mt-3 text-sm text-surface/60">Explore. Dream. Discover.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
