"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";

interface NearbyTrekItem {
  slug: string;
  distance_km: number;
  name: string | null;
  difficulty: string | null;
  state: string | null;
  hero_image_url: string | null;
  trek_duration: string | null;
}

interface NearbyTreksResponse {
  treks: NearbyTrekItem[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

function toTrek(item: NearbyTrekItem): Trek {
  return {
    slug: item.slug,
    name: item.name ?? item.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    region: item.state ?? "Himalayas",
    state: item.state ?? "",
    image: item.hero_image_url ?? "/images/trek-forest.jpg",
    duration: item.trek_duration ?? "—",
    altitude: "—",
    difficulty: item.difficulty ?? "Moderate",
    season: "—",
    description: "",
  };
}

export function NearbyTreksSection() {
  const [treks, setTreks] = useState<NearbyTrekItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "done">("idle");

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `${API_BASE}/api/v1/mobile/nearby?lat=${latitude}&lon=${longitude}&limit=8`
          );
          if (!res.ok) { setStatus("done"); return; }
          const data: NearbyTreksResponse = await res.json();
          setTreks(data.treks ?? []);
          setStatus("done");
        } catch {
          setStatus("done");
        }
      },
      () => setStatus("denied"),
      { timeout: 8000, maximumAge: 30 * 60 * 1000 }
    );
  }, []);

  if (status === "idle" || status === "loading" || (status === "done" && treks.length === 0)) {
    return null;
  }

  if (status === "denied") {
    return (
      <section className="py-10 border-t border-border">
        <div className="container-wide">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Navigation className="h-4 w-4 shrink-0" />
            <span>
              Enable location in your browser to see treks near you.
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 border-t border-border">
      <div className="container-wide">
        <div className="flex items-center gap-2 mb-5">
          <MapPin className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold">Treks Near You</h2>
          <span className="text-xs text-muted-foreground ml-1">within 300 km</span>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 pb-2" style={{ minWidth: "max-content" }}>
            {treks.map((trek) => (
              <div key={trek.slug} className="relative w-64 shrink-0">
                <TrekCard trek={toTrek(trek)} />
                <div className="absolute top-2 right-2 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                  {trek.distance_km} km
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
