import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrekYatra — India's Editorial Trekking Companion",
    template: "%s | TrekYatra",
  },
  description:
    "Discover, compare and plan India's best treks. Trail-tested guides, real permit updates, honest cost notes — from the Sahyadris to the high Himalayas.",
  // Favicon — uses the TrekYatra logo PNG
  icons: {
    icon: [{ url: "/images/Logo_Trekyatra.png", type: "image/png" }],
    apple: "/images/Logo_Trekyatra.png",
    shortcut: "/images/Logo_Trekyatra.png",
  },
  // Author and publisher — shown by SEO tools and required for Google Rich Results
  authors: [{ name: "TrekYatra Editorial Team", url: `${SITE_URL}/about/authors` }],
  creator: "TrekYatra",
  publisher: "TrekYatra",
  openGraph: {
    siteName: "TrekYatra",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@trekyatra",
  },
  robots: { index: true, follow: true },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
      {/* GA4 — next/script ensures execution on initial load AND client-side navigations */}
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');`}
          </Script>
        </>
      )}
      {/* AdSense — loads after page is interactive */}
      {ADSENSE_ID && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
    </html>
  );
}
