import Link from "next/link";
import { fetchTreks } from "@/lib/trekApi";
import { TrekCard } from "@/components/trek/TrekCard";
import { Bookmark, BarChart2, Download, Bell } from "lucide-react";

const STATS = [
  { label: "Saved treks", value: "12", icon: Bookmark, href: "/account/saved" },
  { label: "Compare lists", value: "3", icon: BarChart2, href: "/account/compare" },
  { label: "Downloads", value: "7", icon: Download, href: "/account/downloads" },
  { label: "Alerts set", value: "2", icon: Bell, href: "/account/settings" },
];

export default async function AccountDashboard() {
  const treks = await fetchTreks();
  const recent = treks.slice(0, 3);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">My Dashboard</h1>
        <p className="text-muted-foreground">Your saved treks and planning workspace.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {STATS.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-surface rounded-2xl border border-border p-5 hover:border-accent/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <p className="font-display text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recently saved */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold">Recently saved</h2>
          <Link href="/account/saved" className="text-sm text-accent font-medium">View all</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recent.map(trek => <TrekCard key={trek.slug} trek={trek} />)}
        </div>
      </div>
    </div>
  );
}
