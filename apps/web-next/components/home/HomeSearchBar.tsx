"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const PILLS = [
  "Beginner snow treks",
  "Weekend treks near Mumbai",
  "December in Uttarakhand",
  "Monsoon Sahyadri",
  "First Himalayan trek",
];

export default function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [season, setSeason] = useState("");

  function handleDiscover() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (region) params.set("region", region);
    if (season) params.set("season", season);
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  }

  function handlePill(pill: string) {
    router.push(`/search?q=${encodeURIComponent(pill)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleDiscover();
  }

  return (
    <div className="relative max-w-4xl animate-fade-up" style={{ animationDelay: "0.15s" }}>
      <div className="absolute -inset-2 bg-accent/20 blur-2xl rounded-3xl" />
      <div className="relative glass rounded-2xl p-3 md:p-4 shadow-elevated">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto] gap-1 items-center">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Trek name or keyword"
              className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div className="hidden md:block w-px h-8 bg-border" />
          <div className="flex items-center gap-3 px-4 py-2.5">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              aria-label="Filter treks by region"
              className="bg-transparent outline-none w-full text-sm appearance-none"
            >
              <option value="">Any region</option>
              <option value="Himachal">Himachal</option>
              <option value="Uttarakhand">Uttarakhand</option>
              <option value="Kashmir">Kashmir</option>
              <option value="Sahyadris">Sahyadris</option>
            </select>
          </div>
          <div className="hidden md:block w-px h-8 bg-border" />
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              aria-label="Filter treks by season"
              className="bg-transparent outline-none w-full text-sm appearance-none"
            >
              <option value="">Any season</option>
              <option value="Winter">Winter (Dec–Feb)</option>
              <option value="Monsoon">Monsoon (Jun–Sep)</option>
              <option value="Summer">Summer (Mar–Jun)</option>
            </select>
          </div>
          <Button variant="hero" size="lg" className="md:ml-2" onClick={handleDiscover}>
            <Search className="h-4 w-4" /> Discover
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-5">
        {PILLS.map((pill) => (
          <button
            key={pill}
            onClick={() => handlePill(pill)}
            className="text-xs px-3.5 py-1.5 rounded-full glass-dark text-surface/90 hover:bg-accent hover:text-accent-foreground transition-all"
          >
            {pill}
          </button>
        ))}
      </div>
    </div>
  );
}
