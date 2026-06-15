import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "TrekYatra Datacenter",
    template: "%s | TrekYatra Datacenter",
  },
  description: "Structured trek intelligence data, served for TrekSage and the TrekYatra apps.",
  robots: { index: false, follow: false },
};

export default function DatacenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0e14] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <span className="font-display text-lg font-semibold">TrekYatra Datacenter</span>
        <span className="text-white/40 text-xs ml-2">Structured trek intelligence — for TrekSage</span>
      </header>
      <main className="px-6 py-8 max-w-3xl mx-auto">{children}</main>
    </div>
  );
}
