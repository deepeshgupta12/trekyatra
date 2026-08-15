"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Sparkles, Map, CloudSun, Star } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { trackEvent } from "@/lib/analytics";
import { AppDownloadButton } from "@/components/home/AppDownload";

const SOURCE = "ios_app_live";

// Real app USPs (mirrors the App Store submission — no topo-map/GPX claims the app doesn't have).
const FEATURES = [
  { icon: Sparkles, text: "TrekSage AI answers + plan a full trek in 60 seconds" },
  { icon: Map, text: "Deep guides: route maps, permits, packing & costs" },
  { icon: CloudSun, text: "Live weather, trail conditions & real trip reports" },
];

/**
 * "TrekYatra is live on the App Store" home section (last section above the footer, desktop + mobile).
 * Replaces the pre-launch "Notify me" waitlist. CTA = the smart App Store download button
 * (opens the app if installed on iOS, else the App Store). Desktop additionally shows a scan-to-download
 * QR code; mobile shows only the download badge (see components/home/AppDownload.tsx).
 */
export function IOSAppBanner() {
  const [previewFailed, setPreviewFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const seen = useRef(false);

  // Fire a single impression event when the section scrolls into view.
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

  return (
    <section ref={sectionRef} className="py-16 md:py-24" aria-labelledby="ios-banner-title">
      <div className="container-wide">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-12 md:px-14 md:py-16 text-surface"
          style={{ background: "linear-gradient(155deg, hsl(162 34% 11%) 0%, hsl(158 26% 16%) 55%, hsl(150 24% 12%) 100%)" }}
        >
          {/* soft mountain glows */}
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-pine/20 blur-3xl" aria-hidden="true" />

          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            {/* Left: copy + download */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-surface/90 ring-1 ring-white/15">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Now live on the App Store
              </span>

              <h2 id="ios-banner-title" className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mt-5">
                The trail fits in your pocket.
                <br />
                <span className="text-accent">TrekYatra for iOS.</span>
              </h2>

              <p className="text-surface/75 text-base md:text-lg max-w-xl mt-4 leading-relaxed">
                India&apos;s most complete trek companion. Plan with AI, ask TrekSage anything, and follow full
                route, permit, packing and cost guides, with live trail conditions, trip reports, trek comparisons,
                and treks you save to open offline on the trail.
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

              {/* Download CTA: badge (all viewports) + scan-to-download QR (desktop only) */}
              <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div>
                  <AppDownloadButton label="home_hero" />
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-surface/60">
                    <span className="flex items-center gap-0.5 text-accent" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                    </span>
                    <span>Free · iPhone &amp; iPad · Explore. Dream. Discover.</span>
                  </div>
                </div>

                {/* Scan-to-download — desktop only */}
                <div className="hidden lg:flex items-center gap-3 rounded-2xl bg-white/8 p-3 ring-1 ring-white/12">
                  <div className="rounded-lg bg-white p-1.5">
                    <Image src="/images/app-store-qr.svg" alt="Scan to download TrekYatra for iOS" width={76} height={76} unoptimized />
                  </div>
                  <div className="max-w-[132px]">
                    <p className="text-sm font-semibold text-surface leading-tight">Scan to download</p>
                    <p className="mt-0.5 text-xs text-surface/55 leading-snug">Point your phone camera at the code</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: app preview phone */}
            {previewFailed ? (
              <div className="rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/12">
                <div className="flex justify-center"><Logo variant="light" size="lg" /></div>
                <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent ring-1 ring-accent/25">
                  Now on iOS
                </span>
                <p className="mt-3 text-sm text-surface/60">Explore. Dream. Discover.</p>
              </div>
            ) : (
              <div className="relative mx-auto w-full max-w-[300px]">
                <div
                  className="relative overflow-hidden rounded-[2rem] ring-1 ring-white/12 shadow-2xl"
                  style={{ aspectRatio: "1242 / 2560" }}
                >
                  <Image
                    src="/images/app-preview.png"
                    alt="TrekYatra for iOS app"
                    fill
                    sizes="300px"
                    className="object-cover"
                    style={{ objectPosition: "center bottom" }}
                    onError={() => setPreviewFailed(true)}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/55 to-transparent p-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white ring-1 ring-white/20">
                      Now available
                    </span>
                  </div>
                </div>
                {/* floating rating chip — WoW accent */}
                <div className="absolute -left-3 top-6 hidden rounded-xl bg-white px-3 py-2 shadow-xl sm:block">
                  <div className="flex items-center gap-0.5 text-accent" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold text-neutral-700">Loved by trekkers</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
