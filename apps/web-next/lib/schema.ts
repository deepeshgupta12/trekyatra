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
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: LOGO_URL },
      sameAs: [
        "https://instagram.com/trekyatra",
        "https://youtube.com/trekyatra",
      ],
    },
  };
}
