"""Backfill: strip agent-inserted DEAD internal links from ALREADY-PUBLISHED CMS pages.

Runs the same `link_sanitizer` used by the publish gate and unwraps internal <a href> links whose path
is not live (keeps the text). DRY-RUN by default — it only reports what WOULD change; pass --apply to
persist + invalidate the CMS cache.

Scope (2026-09-22): covers **every published page type**, not just `trek_guide`. The publish gate was
un-gated at the same time, so this backfill must match it — news articles in particular had never been
sanitized and were found to carry dead `/treks/{slug}` links (wrong plural prefix; they 308 to
/explore). Use --page-type to restrict to one type.

    # from the project root:
    PYTHONPATH=services/api .venv/bin/python services/api/scripts/sanitize_trek_links.py                        # dry-run, ALL types
    PYTHONPATH=services/api .venv/bin/python services/api/scripts/sanitize_trek_links.py --apply                # persist
    PYTHONPATH=services/api .venv/bin/python services/api/scripts/sanitize_trek_links.py --page-type news_article
"""
from __future__ import annotations

import sys

from sqlalchemy import select

from app.db.session import SessionLocal
from app.modules.cms.link_sanitizer import build_live_url_set, sanitize_trek_page
from app.modules.cms.models import CMSPage


def main(apply: bool, page_type: str | None) -> None:
    db = SessionLocal()
    try:
        live = build_live_url_set(db)
        stmt = select(CMSPage).where(CMSPage.status == "published")
        if page_type:
            stmt = stmt.where(CMSPage.page_type == page_type)
        pages = db.scalars(stmt).all()
        mode = "APPLY" if apply else "DRY-RUN"
        scope = page_type or "ALL page types"
        print(f"mode={mode} | scope={scope} | live URLs={len(live)} | published pages={len(pages)}\n")

        changed_slugs: list[str] = []
        total_removed = 0
        per_type: dict[str, int] = {}
        for p in pages:
            removed = sanitize_trek_page(p, live, apply=apply)
            if removed:
                changed_slugs.append(p.slug)
                total_removed += len(removed)
                per_type[p.page_type] = per_type.get(p.page_type, 0) + len(removed)
                sample = ", ".join(sorted(set(removed))[:8])
                print(f"  [{p.page_type}] {p.slug}: {len(removed)} dead link(s) -> {sample}")

        print(f"\nPages affected: {len(changed_slugs)} | dead internal links: {total_removed}")
        for pt, n in sorted(per_type.items(), key=lambda kv: -kv[1]):
            print(f"  {pt}: {n} dead link(s)")

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


def _arg(flag: str) -> str | None:
    """Value of `--flag value` or `--flag=value`, else None."""
    for i, a in enumerate(sys.argv):
        if a == flag and i + 1 < len(sys.argv):
            return sys.argv[i + 1]
        if a.startswith(f"{flag}="):
            return a.split("=", 1)[1]
    return None


if __name__ == "__main__":
    main(apply="--apply" in sys.argv, page_type=_arg("--page-type"))
