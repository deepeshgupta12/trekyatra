import type { Metadata } from "next";
import TreksageChat from "./TreksageChat";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

export const metadata: Metadata = {
  title: "TrekSage AI — Your Himalayan Trek Planning Assistant | TrekYatra",
  description:
    "Chat with TrekSage, TrekYatra's AI trek planning assistant. Discover treks, compare options, check permits and plan your perfect Indian Himalayan adventure.",
  // Self-canonical → dedupes the crawled ?q= query-param variants (GSC "duplicate without canonical").
  alternates: { canonical: `${SITE_URL}/treksage` },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function TreksagePage({ searchParams }: Props) {
  const { q } = await searchParams;
  return (
    <main className="flex-1 min-h-0 overflow-hidden">
      <TreksageChat initialQuery={q} />
    </main>
  );
}
