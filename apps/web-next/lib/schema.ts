/**
 * JSON-LD schema builder utilities for Step 19.
 * All builders return plain objects; SchemaInjector renders them as <script> tags.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
const SITE_NAME = "TrekYatra";
const LOGO_URL = `${SITE_URL}/images/Logo_Trekyatra.png`;

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface FAQSchemaItem {
  q: string;
  a: string;
}

// ---------------------------------------------------------------------------
// Article schema
// ---------------------------------------------------------------------------
export function buildArticleSchema({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  imageUrl,
}: {
  title: string;
  description: string;
  url: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  imageUrl?: string | null;
}) {
  // Google Rich Results: headline must be ≤110 chars
  const headline = title.length > 110 ? `${title.slice(0, 107)}...` : title;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: `${SITE_URL}${url}`,
    // Required by Google Rich Results — Person or Organization
    author: {
      "@type": "Person",
      name: "TrekYatra Editorial Team",
      url: `${SITE_URL}/about/authors`,
    },
    // ImageObject with dimensions required for Google Image Rich Results
    ...(imageUrl
      ? { image: { "@type": "ImageObject", url: imageUrl, width: 1200, height: 630 } }
      : {}),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
    },
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(updatedAt ? { dateModified: updatedAt } : {}),
  };
}

// ---------------------------------------------------------------------------
// FAQPage schema
// ---------------------------------------------------------------------------
export function buildFAQSchema(faqs: FAQSchemaItem[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        // Strip HTML tags for schema (plain text only)
        text: a.replace(/<[^>]+>/g, "").trim(),
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// BreadcrumbList schema
// ---------------------------------------------------------------------------
export function buildBreadcrumbSchema(crumbs: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// ItemList schema (for packing lists, roundups)
// ---------------------------------------------------------------------------
export function buildItemListSchema(items: string[], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: `${SITE_URL}${url}`,
    itemListElement: items.map((name, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
    })),
  };
}

// ---------------------------------------------------------------------------
// TouristTrip schema for trek guide pages
// Follows Schema.org/TouristTrip and Google's structured data guidelines.
// Surfaces duration, altitude, difficulty, season, permits, base in rich results.
// ---------------------------------------------------------------------------
export interface TrekSchemaProps {
  name: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  routeImageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  // Facts strip fields
  duration?: string | null;
  altitude?: string | null;
  difficulty?: string | null;
  season?: string | null;
  permits?: string | null;
  base?: string | null;
  // Metadata columns
  trekState?: string | null;
  suitability?: string | null;
}

function parseDurationISO(duration: string): string | null {
  // "6 days" → "P6D", "15 days" → "P15D" per ISO 8601
  const match = duration.match(/(\d+)\s*day/i);
  return match ? `P${match[1]}D` : null;
}

export function buildTrekSchema({
  name, description, url, imageUrl, routeImageUrl, publishedAt, updatedAt,
  duration, altitude, difficulty, season, permits, base, trekState, suitability,
}: TrekSchemaProps) {
  const fullUrl = `${SITE_URL}${url}`;

  // additionalProperty: PropertyValue items for each fact strip element
  // Schema.org/PropertyValue is the recommended way to attach custom facts
  const additionalProperty = [
    duration  && { "@type": "PropertyValue", name: "Duration", value: duration },
    altitude  && { "@type": "PropertyValue", name: "Maximum Altitude", value: altitude },
    difficulty && { "@type": "PropertyValue", name: "Difficulty Level", value: difficulty },
    season    && { "@type": "PropertyValue", name: "Best Season", value: season },
    permits   && { "@type": "PropertyValue", name: "Permits Required", value: permits },
    base      && { "@type": "PropertyValue", name: "Base Village / Trailhead", value: base },
    suitability && { "@type": "PropertyValue", name: "Suitable For", value: suitability },
  ].filter(Boolean);

  const isoDuration = duration ? parseDurationISO(duration) : null;

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name,
    description,
    url: fullUrl,
    ...(imageUrl && routeImageUrl
      ? { image: [
          { "@type": "ImageObject", url: imageUrl, width: 1200, height: 630 },
          { "@type": "ImageObject", url: routeImageUrl, name: "Trail Route Map" },
        ] }
      : imageUrl
        ? { image: { "@type": "ImageObject", url: imageUrl, width: 1200, height: 630 } }
        : routeImageUrl
          ? { image: { "@type": "ImageObject", url: routeImageUrl, name: "Trail Route Map" } }
          : {}),
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(updatedAt   ? { dateModified: updatedAt } : {}),
    ...(isoDuration ? { duration: isoDuration } : {}),

    // Audience — suitability level (e.g. "Beginners", "Advanced / Experienced")
    ...(suitability
      ? { touristType: { "@type": "Audience", audienceType: suitability } }
      : {}),

    // Publisher / tour operator attribution
    offers: {
      "@type": "Offer",
      url: fullUrl,
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: LOGO_URL },
      },
    },

    // Location — state/region as Place
    ...(trekState
      ? {
          location: {
            "@type": "Place",
            name: trekState,
            address: {
              "@type": "PostalAddress",
              addressRegion: trekState,
              addressCountry: "IN",
            },
          },
        }
      : {}),

    // All facts strip elements as PropertyValue pairs
    ...(additionalProperty.length > 0 ? { additionalProperty } : {}),

    // Author / curator
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ---------------------------------------------------------------------------
// WebSite + Organization schema (homepage)
// ---------------------------------------------------------------------------
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "India's editorial trekking companion — trail-tested guides, real permit updates, honest cost notes.",
    // potentialAction enables Google Sitelinks search box
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      // Google requires logo with explicit dimensions (min 112×112, max 1000×1000)
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
        width: 512,
        height: 512,
        contentUrl: LOGO_URL,
      },
      sameAs: [
        "https://instagram.com/trekyatra",
        "https://youtube.com/trekyatra",
        "https://www.trekyatra.co.in",
      ],
    },
  };
}
