import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
  // Display font (headings) — not preloaded so its woff2 doesn't compete with the LCP hero
  // image on slow connections. `display: swap` shows fallback text immediately, then swaps.
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
  // Mono font is never above the fold — don't preload it (keeps its woff2 off the critical path).
  preload: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrekYatra — India's Editorial Trekking Companion",
    template: "%s | TrekYatra",
  },
  description:
    "Discover, compare and plan India's best treks. Trail-tested guides, real permit updates, honest cost notes — from the Sahyadris to the high Himalayas.",
  icons: {
    icon: [
      { url: "/images/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/images/Logo_Trekyatra.png",
    shortcut: "/images/favicon-32.png",
  },
  // Author and publisher — shown by SEO tools and required for Google Rich Results
  authors: [{ name: "TrekYatra Editorial Team", url: `${SITE_URL}/about/authors` }],
  creator: "TrekYatra",
  publisher: "TrekYatra",
  openGraph: {
    siteName: "TrekYatra",
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    // Default fallback OG image — individual pages override this with hero images
    images: [
      {
        url: `${SITE_URL}/images/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "TrekYatra — India's Editorial Trekking Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@trekyatra",
    // Default fallback twitter image
    images: [`${SITE_URL}/images/og-default.jpg`],
  },
  robots: { index: true, follow: true },
  // iOS Safari Smart App Banner ("Open in the TrekYatra app") + ties the site to the App Store app.
  itunes: { appId: "6795408094", appArgument: `${SITE_URL}/app` },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      {/* No manual preconnect: all images are served same-origin via /_next/image (the optimizer
          fetches from Spaces server-side), so the browser never connects to the Spaces host —
          a preconnect to it was flagged unused by Lighthouse. Next injects <head> metadata itself. */}
      <body>
        <Providers>{children}</Providers>
      </body>
      {/* GA4 — the gtag shim + config load early (so page_view calls always queue into dataLayer,
          even before the heavy library finishes), while the library itself stays lazyOnload (low TBT).
          send_page_view:false — page_views are sent manually from lib/analytics.ts trackEvent, which
          skips /admin + internal traffic, so admin routes never reach GA4. */}
      {GA4_ID && (
        <>
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}',{send_page_view:false});`}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="lazyOnload"
          />
        </>
      )}
      {/* AdSense — deferred until idle */}
      {ADSENSE_ID && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      )}
    </html>
  );
}
