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
  trek_altitude: string | null;
  trek_season: string | null;
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
    altitude: item.trek_altitude ?? "—",
    difficulty: item.difficulty ?? "Moderate",
    season: item.trek_season ?? "—",
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
            <span>Enable location in your browser to see treks near you.</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 border-t border-border">
      <div className="container-wide">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold">Treks Near You</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Distances from your current location · showing results within 300 km
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 pb-2" style={{ minWidth: "max-content" }}>
            {treks.map((trek) => (
              <div key={trek.slug} className="shrink-0 w-64 flex flex-col">
                <TrekCard trek={toTrek(trek)} />
                <div className="flex items-center gap-1.5 mt-2 px-1">
                  <MapPin className="h-3 w-3 text-accent shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {trek.distance_km} km from your location
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
