import type { CMSPage, TrekFacts } from "@/lib/api";
import type { Trek } from "@/components/trek/TrekCard";

/** Convert a CMS trek_guide page to a Trek card-compatible object.
 *  Prefers trek_* DB columns (Step 46) over content_json.trek_facts. */
export function cmsPageToTrek(page: CMSPage): Trek {
  const tf = (page.content_json?.trek_facts ?? {}) as TrekFacts;
  const rawDiff = (page.trek_difficulty ?? tf.difficulty ?? "Moderate").trim();
  return {
    slug:        page.slug,
    name:        page.trek_name ?? page.title,
    region:      tf.base ?? page.trek_state ?? "",
    state:       page.trek_state ?? "",
    image:       page.hero_image_url ?? "/images/trek-forest.jpg",
    duration:    page.trek_duration  ?? tf.duration ?? "—",
    altitude:    (tf as Record<string, string>).altitude ?? "—",
    difficulty:  rawDiff,
    season:      page.trek_season ?? tf.season ?? "—",
    description: page.seo_description ?? "",
    beginner:    page.trek_suitability?.toLowerCase().includes("begin")
                   ?? rawDiff.toLowerCase().startsWith("easy"),
    suitability: page.trek_suitability ?? undefined,
    trek_best_months: page.trek_best_months ?? null,
    trek_open_months: page.trek_open_months ?? null,
  };
}
