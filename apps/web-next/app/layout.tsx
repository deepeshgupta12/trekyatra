import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrekYatra — India's Editorial Trekking Companion",
    template: "%s | TrekYatra",
  },
  description:
    "Discover, compare and plan India's best treks. Trail-tested guides, real permit updates, honest cost notes — from the Sahyadris to the high Himalayas.",
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
