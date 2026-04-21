import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "TrekYatra — India's Editorial Trekking Companion", template: "%s | TrekYatra" },
  description: "Discover, compare and plan India's best treks. Trail-tested guides, real permit updates, honest cost notes — from the Sahyadris to the high Himalayas.",
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
