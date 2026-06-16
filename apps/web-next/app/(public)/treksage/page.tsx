import type { Metadata } from "next";
import TreksageChat from "./TreksageChat";

export const metadata: Metadata = {
  title: "TrekSage AI — Plan Your Himalayan Trek | TrekYatra",
  description:
    "Chat with TrekSage, TrekYatra's AI trek planning assistant. Plan a trek, compare options, check permits and packing — all in one conversation.",
};

export default function TreksagePage() {
  return (
    <main className="min-h-screen bg-[#0c0e14] py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Page heading */}
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-accent mb-2">TrekSage AI</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-3">
            Plan your perfect Himalayan trek
          </h1>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Ask TrekSage anything — from choosing the right trek to comparing routes, permit requirements, packing lists, and more.
          </p>
        </div>

        {/* Chat widget */}
        <div className="bg-[#0f1117] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <TreksageChat />
        </div>

        <p className="text-center text-white/20 text-xs mt-4">
          TrekSage uses real TrekYatra data. Always verify permits and safety conditions with the local forest department before trekking.
        </p>
      </div>
    </main>
  );
}
