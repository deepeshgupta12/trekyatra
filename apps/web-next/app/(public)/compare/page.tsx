import { Suspense } from "react";
import type { Metadata } from "next";
import { fetchCMSPages } from "@/lib/api";
import { treks as staticTreks } from "@/data/treks";
import { CompareClient, type CompareTrek } from "./CompareClient";

export const revalidate = 3600; // refresh CMS trek list hourly

const SITE_URL = "https://trekyatra.co.in";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Compare Treks Side by Side | TrekYatra",
    description:
      "Compare India's best treks by duration, altitude, difficulty, best season, and cost. Find the right Himalayan trek for your fitness and schedule.",
    keywords: [
      "compare treks india",
      "himalayan trek comparison",
      "best treks for beginners",
      "trek difficulty comparison",
    ],
    alternates: { canonical: `${SITE_URL}/compare` },
    openGraph: {
      title: "Compare Treks Side by Side | TrekYatra",
      description:
        "Compare duration, altitude, difficulty, and cost for India's top trekking routes.",
      url: `${SITE_URL}/compare`,
      type: "website",
    },
  };
}

export default async function ComparePage() {
  let treks: CompareTrek[] = [];

  try {
    const pages = await fetchCMSPages({
      page_type: "trek_guide",
      status: "published",
      limit: 200,
    });
    treks = pages.map((p) => ({
      slug: p.slug,
      name: p.trek_name ?? p.title,
      image: p.hero_image_url ?? "/images/trek-forest.jpg",
      difficulty:
        p.content_json?.trek_facts?.difficulty ?? p.trek_difficulty ?? "Moderate",
      duration:
        p.content_json?.trek_facts?.duration ?? p.trek_duration ?? "—",
      season:
        p.content_json?.trek_facts?.season ?? p.trek_season ?? "—",
      state: p.trek_state ?? "",
      region: p.trek_state ?? "",
      altitude: p.content_json?.trek_facts?.altitude ?? undefined,
      permits: p.content_json?.trek_facts?.permits ?? undefined,
      base: p.content_json?.trek_facts?.base ?? undefined,
      suitability: p.trek_suitability ?? undefined,
      description: p.seo_description ?? "",
    }));
  } catch {
    // fallback to static data if API unreachable (build-time / dev)
  }

  if (treks.length === 0) {
    treks = staticTreks.map((t) => ({
      slug: t.slug,
      name: t.name,
      image: t.image,
      difficulty: t.difficulty,
      duration: t.duration,
      season: t.season ?? "",
      state: t.state ?? t.region,
      region: t.region,
      altitude: t.altitude,
      permits: undefined,
      base: undefined,
      suitability: t.beginner ? "Beginner-friendly" : undefined,
      description: t.description,
    }));
  }

  return (
    <Suspense
      fallback={
        <div className="container-narrow py-12 text-center text-muted-foreground">
          Loading comparison…
        </div>
      }
    >
      <CompareClient initialTreks={treks} />
    </Suspense>
  );
}
