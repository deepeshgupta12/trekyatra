"""
Backfill: normalize every TrekYatra contact email in CMS page content to the
single canonical address `explore@trekyatra.co.in`.

WHY: Live static pages (about/contact/privacy/terms/methodology/affiliate-disclosure)
were seeded/edited with a mix of role addresses (support@, editorial@, privacy@,
legal@, partners@, partnerships@, hello@, newsletter@…). The owner consolidated all
contact to explore@trekyatra.co.in. Editing the seed script only affects future seeds;
the already-published rows in the prod DB need this one-off. Re-seeding is unsafe (it
would overwrite live CMS edits), so this rewrites ONLY the email strings and leaves all
other content untouched.

Scope: any `<name>@trekyatra.(com|co.in)` in content_html / content_json / seo_title /
seo_description → explore@trekyatra.co.in (explore@ itself is left as-is). Idempotent.

Run from the DO App Platform Console (api component), from services/api:
  python scripts/backfill_cms_emails.py --dry-run   # preview affected pages
  python scripts/backfill_cms_emails.py             # execute
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal  # noqa: E402
from app.modules.cms.models import CMSPage  # noqa: E402

CANONICAL = "explore@trekyatra.co.in"
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@trekyatra\.(?:com|co\.in)")


def _fix(text: str | None) -> tuple[str | None, bool]:
    """Replace any trekyatra email (except the canonical) with explore@. Returns (new, changed)."""
    if not text:
        return text, False
    changed = False

    def repl(m: re.Match) -> str:
        nonlocal changed
        if m.group(0) == CANONICAL:
            return m.group(0)
        changed = True
        return CANONICAL

    return EMAIL_RE.sub(repl, text), changed


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize CMS contact emails to explore@trekyatra.co.in.")
    parser.add_argument("--dry-run", action="store_true", help="List affected pages, make no writes.")
    args = parser.parse_args()

    db = SessionLocal()
    scanned = 0
    changed_pages = 0
    try:
        pages = db.query(CMSPage).all()
        for page in pages:
            scanned += 1
            page_changed = False

            new_html, c1 = _fix(page.content_html)
            new_title, c2 = _fix(page.seo_title)
            new_desc, c3 = _fix(page.seo_description)

            # content_json: serialize → replace → parse (preserves structure)
            new_json = page.content_json
            c4 = False
            if page.content_json is not None:
                dumped = json.dumps(page.content_json, ensure_ascii=False)
                fixed, c4 = _fix(dumped)
                if c4:
                    new_json = json.loads(fixed)

            if c1 or c2 or c3 or c4:
                page_changed = True
                changed_pages += 1
                print(f"  {'would fix' if args.dry_run else 'fixing'} /{page.slug} "
                      f"(html={c1} json={c4} seo_title={c2} seo_desc={c3})")
                if not args.dry_run:
                    page.content_html = new_html
                    page.seo_title = new_title
                    page.seo_description = new_desc
                    page.content_json = new_json

        if not args.dry_run and changed_pages:
            db.commit()

        verb = "would change" if args.dry_run else "changed"
        print(f"\nDone. scanned={scanned} {verb}={changed_pages} (canonical={CANONICAL})")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
