"""Delete non-curated cluster_hub CMS pages (per-trek / keyword-cluster junk /trek-types URLs).

Only the curated thematic Trek Categories (app.modules.hubs.category_meta.CATEGORIES) are valid
/trek-types pages. Any other cluster_hub page — e.g. `trek-types/tarsar-marsar-trek-guide` created
from a per-trek keyword_cluster — duplicates the `/trek/{slug}` detail page and cannibalises SEO, so
it must be removed. After removal the /trek-types route 404s those slugs and they are already excluded
from the sitemap.

Run from the DO api component console (or locally with the venv), from `services/api`:
    python scripts/cleanup_cluster_hubs.py            # DRY-RUN: list what WOULD be deleted
    python scripts/cleanup_cluster_hubs.py --apply    # actually delete the junk pages
"""
from __future__ import annotations

import sys

from sqlalchemy import select

from app.db.session import SessionLocal
from app.modules.cms.models import CMSPage
from app.modules.hubs.category_meta import CATEGORIES


def main() -> None:
    apply = "--apply" in sys.argv
    valid_slugs = {f"trek-types/{c.slug}" for c in CATEGORIES}

    with SessionLocal() as db:
        rows = list(db.scalars(select(CMSPage).where(CMSPage.page_type == "cluster_hub")).all())
        junk = [p for p in rows if p.slug not in valid_slugs]
        keep = [p for p in rows if p.slug in valid_slugs]

        print(f"cluster_hub pages total: {len(rows)}")
        print(f"  curated (KEEP):   {len(keep)}  -> {sorted(p.slug for p in keep)}")
        print(f"  non-curated (JUNK): {len(junk)}")
        for p in junk:
            print(f"    {'DELETING' if apply else 'would delete'}: {p.slug}  (status={p.status}, id={p.id})")
            if apply:
                db.delete(p)

        if apply and junk:
            db.commit()
            print(f"\nDeleted {len(junk)} non-curated cluster_hub page(s). Purge the Cloudflare/CDN cache "
                  f"and request re-crawl in Search Console for the removed URLs.")
        elif not junk:
            print("\nNothing to delete — all cluster_hub pages are curated categories.")
        else:
            print("\nDRY-RUN only. Re-run with --apply to delete the junk pages.")


if __name__ == "__main__":
    main()
