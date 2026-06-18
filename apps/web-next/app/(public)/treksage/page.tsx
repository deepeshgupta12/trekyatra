import type { Metadata } from "next";
import TreksageChat from "./TreksageChat";

export const metadata: Metadata = {
  title: "TrekSage AI — Your Himalayan Trek Planning Assistant | TrekYatra",
  description:
    "Chat with TrekSage, TrekYatra's AI trek planning assistant. Discover treks, compare options, check permits and plan your perfect Indian Himalayan adventure.",
};

export default function TreksagePage() {
  return (
    // h-16 = 64px header (Header.tsx uses h-16). overflow-hidden keeps the chat from
    // triggering page-level scroll — messages scroll inside TreksageChat's container ref.
    <main className="h-[calc(100vh-4rem)] overflow-hidden">
      <TreksageChat />
    </main>
  );
}
