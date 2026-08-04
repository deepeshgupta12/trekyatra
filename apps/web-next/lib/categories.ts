/**
 * Curated Trek Category slugs — MIRRORS `services/api/app/modules/hubs/category_meta.py` (slugs only).
 * Lets the /trek-types/[slug] page decide whether to fetch member treks by curated `category`
 * (predicate match) or by keyword-cluster `cluster_id` / `theme`.
 */
export const TREK_CATEGORY_SLUGS = [
  "beginner-friendly-treks",
  "weekend-treks",
  "high-altitude-treks",
  "lake-treks",
  "snow-treks",
  "family-treks",
] as const;

export function isTrekCategorySlug(slug: string): boolean {
  return (TREK_CATEGORY_SLUGS as readonly string[]).includes(slug);
}
