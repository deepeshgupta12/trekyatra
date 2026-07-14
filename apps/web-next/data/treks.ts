import type { Trek } from "@/components/trek/TrekCard";

// The static trek dataset has been removed — the CMS is now the sole source of trek
// data (see #4 / Step 81). Previously this held 12 hardcoded "stub" treks used as an
// offline fallback, which rendered thin stub pages at /trek/<slug> for any slug lacking
// a published CMS page. Kept as an empty typed export so existing importers compile and
// fall through to CMS content instead of static stubs.
export const treks: Trek[] = [];
