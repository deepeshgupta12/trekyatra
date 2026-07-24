"""
Purge news_article entries from the internal-linking graph (`pages` table).

WHY: The weekly news agent creates page_type="news_article" CMS pages. Before
news_article was added to linking.service._EXCLUDED_FROM_LINKING, `linking.sync_pages`
imported them into the trek linking graph (typed as the default "trek_guide"), so they
appeared in the trek "In this cluster" sidebar with a /trek/{slug} URL — a duplicate of
the canonical /news/{slug}. This one-off removes those already-synced news rows.

NOTE: This is the SAME purge the scheduled `linking.sync_pages` task now performs (Step 1
of sync_pages_from_cms deletes Page rows whose CMS page_type is excluded). Running this is
optional once the fix is deployed + a sync has run — it just lets you clean immediately
without re-syncing the whole graph. It does NOT delete any CMS page — news articles stay
live at /news/{slug}; only their stale linking-graph rows are removed. Idempotent.

Run from the DO App Platform Console (api component), from services/api:
  python scripts/purge_news_from_linking.py            # execute
  python scripts/purge_news_from_linking.py --dry-run  # preview only
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import delete as sa_delete
from sqlalchemy import select

from app.db.session import SessionLocal
from app.modules.cms.models import CMSPage
from app.modules.linking.models import Page


def purge(dry_run: bool = False) -> None:
    db = SessionLocal()
    try:
        # Match by slug against news_article CMS pages — Page.slug == CMSPage.slug, and this
        # mirrors the proven, FK-safe delete used by sync_pages_from_cms (Step 1).
        news_slugs_subq = select(CMSPage.slug).where(CMSPage.page_type == "news_article")
        targets = db.scalars(select(Page).where(Page.slug.in_(news_slugs_subq))).all()

        print(f"news_article rows currently in the linking graph: {len(targets)}")
        for p in targets[:20]:
            print(f"  - {p.slug} (linking page_type={p.page_type})")
        if len(targets) > 20:
            print(f"  ... and {len(targets) - 20} more")

        if dry_run:
            print("\nDRY RUN — nothing deleted.")
            return

        deleted = db.execute(
            sa_delete(Page).where(Page.slug.in_(news_slugs_subq))
        ).rowcount
        db.commit()
        print(f"\nDone — purged {deleted} news entries from the linking graph.")
        print("They no longer appear in 'In this cluster'; /trek/{news-slug} 308-redirects to /news/{slug}.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    print("Purging news_article entries from the linking graph..." + (" (dry run)" if dry else ""))
    purge(dry_run=dry)
