import type { Metadata } from "next";
import TreksageChat from "./TreksageChat";

export const metadata: Metadata = {
  title: "TrekSage AI — Your Himalayan Trek Planning Assistant | TrekYatra",
  description:
    "Chat with TrekSage, TrekYatra's AI trek planning assistant. Discover treks, compare options, check permits and plan your perfect Indian Himalayan adventure.",
};

export default function TreksagePage() {
  return (
    <main className="min-h-screen bg-[#FAF5EE] py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <TreksageChat />
        <p className="text-center text-[#1D3A2E]/25 text-xs mt-4">
          TrekSage uses verified TrekYatra data. Always check permit requirements and trail conditions with local authorities before trekking.
        </p>
      </div>
    </main>
  );
}
