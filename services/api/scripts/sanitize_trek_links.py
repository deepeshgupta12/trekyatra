"""One-off backfill: strip agent-inserted DEAD internal links from already-published trek guides.

Runs the same `link_sanitizer` used by the publish gate over every published `trek_guide` page and
unwraps internal <a href> links whose path is not live (keeps the text). DRY-RUN by default — it only
reports what WOULD change; pass --apply to persist + invalidate the CMS cache.

    # from the project root:
    PYTHONPATH=services/api .venv/bin/python services/api/scripts/sanitize_trek_links.py           # dry-run (report)
    PYTHONPATH=services/api .venv/bin/python services/api/scripts/sanitize_trek_links.py --apply    # persist changes
"""
from __future__ import annotations

import sys

from sqlalchemy import select

from app.db.session import SessionLocal
from app.modules.cms.link_sanitizer import build_live_url_set, sanitize_trek_page
from app.modules.cms.models import CMSPage


def main(apply: bool) -> None:
    db = SessionLocal()
    try:
        live = build_live_url_set(db)
        pages = db.scalars(
            select(CMSPage).where(
                CMSPage.page_type == "trek_guide", CMSPage.status == "published"
            )
        ).all()
        mode = "APPLY" if apply else "DRY-RUN"
        print(f"mode={mode} | live URLs={len(live)} | published trek pages={len(pages)}\n")

        changed_slugs: list[str] = []
        total_removed = 0
        for p in pages:
            removed = sanitize_trek_page(p, live, apply=apply)
            if removed:
                changed_slugs.append(p.slug)
                total_removed += len(removed)
                sample = ", ".join(sorted(set(removed))[:8])
                print(f"  {p.slug}: {len(removed)} dead link(s) -> {sample}")

        print(f"\nPages affected: {len(changed_slugs)} | dead internal links: {total_removed}")

        if apply and changed_slugs:
            db.commit()
            try:
                from app.modules.cms.service import cache_invalidate
                cache_invalidate(changed_slugs)
                print("APPLIED + CMS cache invalidated.")
            except Exception as exc:  # noqa: BLE001
                print(f"APPLIED (cache invalidate skipped: {exc}).")
            print("Datacenter JSON reads content_json live from the DB — no separate refresh needed.")
        elif apply:
            print("Nothing to change.")
        else:
            print("DRY-RUN only — nothing written. Review the list above, then re-run with --apply.")
    finally:
        db.close()


if __name__ == "__main__":
    main(apply="--apply" in sys.argv)
