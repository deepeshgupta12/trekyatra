"""
Delete CMS pages that have wrong slugs (created with seed script v1).

Run from the DO App Platform Console (api component):
  python scripts/cleanup_wrong_slugs.py

Then immediately run:
  python scripts/seed_static_cms_pages.py
"""
from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.modules.cms import service as cms

WRONG_SLUGS = [
    "privacy-policy",
    "terms-of-service",
    "editorial-methodology",
]


def cleanup() -> None:
    db = SessionLocal()
    try:
        deleted = 0
        for slug in WRONG_SLUGS:
            page = cms.get_page_by_slug(db, slug)
            if page:
                cms.delete_page(db, page=page)
                print(f"  DELETED: /{slug}")
                deleted += 1
            else:
                print(f"  NOT FOUND (skipped): /{slug}")
        db.commit()
        print(f"\nDone — {deleted} pages deleted.")
        print("Now run: python scripts/seed_static_cms_pages.py")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Cleaning up wrong-slug CMS pages...")
    cleanup()
