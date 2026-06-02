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

const FAQ_SCHEMA_ITEMS = [
  {
    name: "Which is easier — Kedarkantha or Brahmatal?",
    answer:
      "Both are beginner-friendly winter treks in Uttarakhand. Kedarkantha (3,810 m) has a steeper summit push but a shorter overall distance. Brahmatal (3,741 m) is longer with a gentler gradient and fewer crowds. For a first Himalayan snow trek, either works well.",
  },
  {
    name: "What is the easiest trek in India for beginners?",
    answer:
      "Kedarkantha, Dayara Bugyal, and Chopta-Tungnath are excellent beginner choices — 4–6 days, altitude under 4,000 m, well-marked trails with operator support.",
  },
  {
    name: "How do I compare treks by difficulty?",
    answer:
      "TrekYatra rates treks as Easy, Moderate, Challenging, or Difficult based on daily altitude gain, trail grade, and required fitness. Use the dropdowns to pick any two treks and compare difficulty, duration, and altitude gain in the table.",
  },
  {
    name: "Can I compare more than two treks?",
    answer:
      "Yes — TrekYatra's compare tool supports up to 3 treks simultaneously. Click the '+ Add third trek' button to add a third column.",
  },
  {
    name: "Which trek has the highest altitude?",
    answer:
      "Stok Kangri (6,153 m) is among the highest listed treks. Most beginner treks peak between 3,000–4,500 m. Use the 'Max altitude' row in the comparison table.",
  },
  {
    name: "How much does a Himalayan trek cost?",
    answer:
      "Independent treks cost ₹5,000–₹12,000 including travel, accommodation, and food. Operator-led packages range from ₹8,000–₹25,000 per person for 5–7 day treks, including guides, permits, and camping gear.",
  },
];

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
      difficulty: p.trek_difficulty ?? "Moderate",
      duration: p.trek_duration ?? "—",
      season: p.trek_season ?? "—",
      state: p.trek_state ?? "",
      region: p.trek_state ?? "",
      altitude: undefined,
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
      description: t.description,
    }));
  }

  // JSON-LD: WebPage
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/compare`,
    name: "Compare Treks Side by Side | TrekYatra",
    description:
      "Compare India's best treks by duration, altitude, difficulty, best season, and cost.",
    url: `${SITE_URL}/compare`,
    publisher: {
      "@type": "Organization",
      name: "TrekYatra",
      url: SITE_URL,
    },
  };

  // JSON-LD: ItemList (top 6 treks by list order)
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Popular Indian Treks",
    description:
      "Top trekking routes in India available for side-by-side comparison on TrekYatra",
    itemListElement: treks.slice(0, 6).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `${SITE_URL}/trek/${t.slug}`,
    })),
  };

  // JSON-LD: FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SCHEMA_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.name,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Suspense
        fallback={
          <div className="container-narrow py-12 text-center text-muted-foreground">
            Loading comparison…
          </div>
        }
      >
        <CompareClient initialTreks={treks} />
      </Suspense>
    </>
  );
}
