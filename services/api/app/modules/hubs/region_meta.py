"""Backend region taxonomy — source of truth for Regional hub generation (/admin/hubs).

MIRRORS `apps/web-next/lib/regions.ts` (`REGIONS`). The two must be kept in sync: the frontend
copy drives URL resolution / home + nav grouping / the code-rendered region page; this copy drives
the backend `RegionalContentAgent` that generates the `regional_hub` CMS page. Slugs, names, and
match rules must match exactly so the generated CMS page overlays the right `/regions/{slug}` page.

Region → treks matching mirrors the frontend `regionForState`: exact `match_states` first, then a
`match_word` substring on `trek_state` (so composite international values like
"Koshi Province, Nepal / Tibet, China" fold into the Nepal hub with no per-trek code).
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class RegionMeta:
    slug: str
    name: str
    tagline: str
    blurb: str
    country: str  # "India" | "Nepal" | "Pakistan" | "Tibet"
    match_word: str
    hero_image: str
    match_states: tuple[str, ...] = field(default_factory=tuple)


# Ordered India-first (so a composite border state resolves to the Indian hub), then international.
REGIONS: tuple[RegionMeta, ...] = (
    RegionMeta(
        slug="uttarakhand", name="Uttarakhand", match_word="uttarakhand", country="India",
        match_states=("Uttarakhand", "Uttrakhand"),
        tagline="Land of the great Himalayan snow treks",
        hero_image="/images/region-uttarakhand.webp",
        blurb="Garhwal and Kumaon hold India's most loved beginner snow treks — Kedarkantha, Brahmatal, Valley of Flowers, Roopkund.",
    ),
    RegionMeta(
        slug="himachal", name="Himachal Pradesh", match_word="himachal", country="India",
        tagline="The trekker's playground",
        hero_image="/images/region-himachal.webp",
        blurb="From the apple valleys of Kullu to the moonscapes of Spiti, Himachal offers the widest variety of treks of any Indian state.",
    ),
    RegionMeta(
        slug="kashmir", name="Kashmir", match_word="kashmir", country="India",
        match_states=("Jammu & Kashmir", "Kashmir"),
        tagline="Alpine lakes & turquoise meadows",
        hero_image="/images/region-jammu-kashmir.webp",
        blurb="Kashmir's high-altitude meadow treks are unrivalled in India. The Great Lakes trek alone draws trekkers from around the world.",
    ),
    RegionMeta(
        slug="ladakh", name="Ladakh", match_word="ladakh", country="India",
        tagline="High desert, high stakes, high reward",
        hero_image="/images/region-ladakh-hd.webp",
        blurb="Above 3,500 m on every trek. Markha Valley, Stok Kangri, the legendary Chadar — Ladakh trekking is not for first-timers.",
    ),
    RegionMeta(
        slug="maharashtra", name="Maharashtra (Sahyadris)", match_word="maharashtra", country="India",
        tagline="Monsoon trekking capital of India",
        hero_image="/images/region-sahyadri.webp",
        blurb="70+ documented treks from Mumbai and Pune. Best between June and February.",
    ),
    RegionMeta(
        slug="sikkim", name="Sikkim & North East", match_word="sikkim", country="India",
        tagline="Quiet, lush, photogenic",
        hero_image="/images/region-ladakh.webp",
        blurb="Goecha La, Sandakphu, Dzongri — North East treks pair stunning Kanchenjunga views with rich biodiversity.",
    ),
    RegionMeta(
        slug="karnataka", name="Karnataka", match_word="karnataka", country="India",
        tagline="Western Ghats from Bangalore",
        hero_image="/images/region-sahyadri.webp",
        blurb="Kudremukh, Kumara Parvatha, Tadiyandamol — beginner to challenging treks reachable in a weekend from Bangalore.",
    ),
    RegionMeta(
        slug="nepal", name="Nepal Himalaya", match_word="nepal", country="Nepal",
        tagline="The roof of the world",
        hero_image="/images/region-nepal.webp",
        blurb="Everest, Annapurna, Kanchenjunga, Makalu, Lhotse — the Nepal Himalaya holds the greatest concentration of 8000m giants and the world's most storied high-altitude treks and base-camp routes.",
    ),
    RegionMeta(
        slug="pakistan", name="Pakistan Karakoram", match_word="pakistan", country="Pakistan",
        tagline="Where the great peaks tower",
        hero_image="/images/region-pakistan.webp",
        blurb="K2, Nanga Parbat, the Gasherbrums, Broad Peak — Pakistan's Gilgit-Baltistan holds the most concentrated cluster of extreme high peaks on Earth. Serious, remote, and permit-heavy.",
    ),
    RegionMeta(
        slug="tibet", name="Tibet", match_word="tibet", country="Tibet",
        tagline="The high, remote north side",
        hero_image="/images/region-tibet.webp",
        blurb="The Tibetan side of the Himalaya — Everest's north approach, Cho Oyu, Shishapangma. High-altitude desert, big logistics, and strict permits.",
    ),
)

REGION_BY_SLUG: dict[str, RegionMeta] = {r.slug: r for r in REGIONS}


def region_by_slug(slug: str) -> RegionMeta | None:
    return REGION_BY_SLUG.get(slug)


# Per-country permit copy — mirrors the frontend region page's permitCopy().
PERMIT_COPY: dict[str, dict[str, str]] = {
    "Nepal": {
        "label": "Required",
        "answer": "Yes. Most treks in the {name} require a TIMS card plus the relevant national-park or "
                  "conservation-area entry permit, issued in Kathmandu or Pokhara. Restricted areas "
                  "(Upper Mustang, Manaslu, etc.) need a special permit and a registered guide.",
    },
    "Pakistan": {
        "label": "Required",
        "answer": "Yes. {name} treks need a Pakistan visa and, for peaks and restricted zones near the "
                  "borders, a trekking permit / NOC arranged through a licensed operator. Open-zone valley "
                  "treks are lighter on paperwork.",
    },
    "Tibet": {
        "label": "Required",
        "answer": "Yes, and they are strict. Trekking in {name} requires a Tibet Travel Permit, an Alien's "
                  "Travel Permit for many areas, and travel as part of an organised group with a registered "
                  "guide — independent trekking is not permitted.",
    },
    "India": {
        "label": "Varies by trek",
        "answer": "Many Himalayan treks in {name} require forest or wildlife-sanctuary permits, and some "
                  "border-area routes need an Inner Line Permit. Weekend Sahyadri and Western Ghats treks are "
                  "usually permit-free. Each trek guide lists the exact permits and where to get them.",
    },
}


def permit_copy(meta: RegionMeta) -> dict[str, str]:
    entry = PERMIT_COPY.get(meta.country, PERMIT_COPY["India"])
    return {"label": entry["label"], "answer": entry["answer"].format(name=meta.name)}
