"""Internal-link sanitizer for published trek content.

Content agents (content_writing / seo_aeo) sometimes emit internal <a href> links to URLs that were
never published — invented slugs (`-complete-guide`, `-2026`), plural `/treks/…`, related treks that
were never published — so Google crawls them and reports 404s. This module builds the set of LIVE
internal URLs (published CMS pages mapped to their public path + static routes + curated hub
taxonomies) and UNWRAPS any internal anchor whose href is NOT live: it keeps the visible text and drops
the dead <a>, so prose stays readable. External links, mailto:/tel:, and in-page #anchors are left
untouched.

Used at publish time for `trek_guide` pages (single choke point in publish/service.py) and by
scripts/sanitize_trek_links.py for the one-off backfill of already-published trek pages.
"""
from __future__ import annotations

import re
from urllib.parse import urlsplit

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage

SITE_HOSTS = {"www.trekyatra.co.in", "trekyatra.co.in"}

# page_type → public path prefix. Mirrors apps/web-next/app/sitemap.ts PAGE_PREFIX + publish/service.py
# ("/trek/{slug}"). `editorial` maps to the site root and is handled specially.
_PAGE_PREFIX: dict[str, str] = {
    "trek_guide": "/trek",
    "news_article": "/news",
    "packing_list": "/packing",
    "packing_guide": "/packing",
    "permit_guide": "/permits",
    "cost_guide": "/guides",
    "gear_guide": "/guides",
    "beginner_guide": "/guides",
    "beginner_roundup": "/guides",
    "safety_guide": "/guides",
    "itinerary": "/guides",
    "expert_guide": "/guides",
    "premium_compendium": "/guides",
    "seasonal": "/seasons",
    "seasonal_hub": "/seasons",
    "regional_hub": "/regions",
    "cluster_hub": "/trek-types",
}

# Always-live static routes (mirrors apps/web-next public routes + sitemap core list).
_STATIC_ROUTES: set[str] = {
    "/", "/explore", "/search", "/compare", "/treksage", "/plan", "/plan/results", "/app",
    "/packing", "/permits", "/guides", "/regions", "/seasons", "/gear", "/costs", "/itineraries",
    "/beginner", "/moderate", "/challenging", "/operators", "/products", "/premium", "/news",
    "/about", "/about/authors", "/contact", "/methodology", "/privacy", "/terms",
    "/affiliate-disclosure", "/safety", "/safety-disclaimer", "/newsletter",
}

# Matches <a ... href="..."> ... </a> (single or double quoted href, attrs in any order, inner may
# contain other tags). Non-greedy inner + DOTALL so multi-line anchors are handled; nested <a> is
# invalid HTML and does not occur in generated content.
_ANCHOR_RE = re.compile(
    r'<a\b([^>]*?)\bhref\s*=\s*(["\'])(.*?)\2([^>]*)>(.*?)</a>',
    re.IGNORECASE | re.DOTALL,
)


def _normalize(path: str) -> str:
    """Drop a trailing slash (except root) so '/explore/' matches '/explore'."""
    if len(path) > 1 and path.endswith("/"):
        return path.rstrip("/")
    return path


def _is_internal(href: str) -> bool:
    """A link is internal if it is a root-relative path or an absolute URL on our host. mailto:/tel:,
    protocol-relative (//host), and pure in-page #fragments are NOT treated as internal (left alone)."""
    href = href.strip()
    if not href:
        return False
    if href.startswith("//"):
        return False
    if href.startswith("/"):
        return True
    if href.startswith(("http://", "https://")):
        return urlsplit(href).netloc.lower() in SITE_HOSTS
    return False


def _href_path(href: str) -> str:
    """The normalized path portion of an internal href (fragment + query stripped)."""
    return _normalize(urlsplit(href.strip()).path or "/")


def build_live_url_set(db: Session) -> set[str]:
    """The set of live internal URL paths: static routes + curated hub taxonomies + every PUBLISHED
    CMS page mapped to its public path. Used to decide which internal links are real."""
    from app.modules.hubs.category_meta import CATEGORIES
    from app.modules.hubs.region_meta import REGIONS
    from app.modules.hubs.season_meta import SEASONS

    live: set[str] = set(_STATIC_ROUTES)
    for r in REGIONS:
        live.add(f"/regions/{r.slug}")
    for season_slug in SEASONS.keys():
        live.add(f"/seasons/{season_slug}")
    for c in CATEGORIES:
        live.add(f"/trek-types/{c.slug}")

    rows = db.execute(
        select(CMSPage.page_type, CMSPage.slug).where(CMSPage.status == "published")
    ).all()
    for page_type, slug in rows:
        if page_type == "editorial":
            live.add(f"/{slug}")
            continue
        prefix = _PAGE_PREFIX.get(page_type)
        if prefix:
            live.add(f"{prefix}/{slug}")
    return live


def sanitize_html_links(html: str | None, live: set[str]) -> tuple[str, list[str]]:
    """Unwrap every internal anchor whose path is not in `live` (keep inner text, drop the <a>).
    Returns (new_html, list_of_removed_hrefs). External / mailto / #anchor links are untouched."""
    if not html:
        return html or "", []
    removed: list[str] = []

    def _repl(m: re.Match) -> str:
        href = m.group(3)
        inner = m.group(5)
        if _is_internal(href) and _href_path(href) not in live:
            removed.append(href.strip())
            return inner  # unwrap: keep the visible text, drop the dead link
        return m.group(0)

    return _ANCHOR_RE.sub(_repl, html), removed


def sanitize_content_json_links(content_json: dict | None, live: set[str]) -> tuple[dict | None, list[str]]:
    """Sanitize the HTML-bearing parts of a trek page's content_json: `sections` (name → html) and
    `faqs` (list of {q, a-html}). Returns (new_content_json, removed_hrefs). Non-HTML fields
    (trek_facts, etc.) are passed through unchanged."""
    if not content_json:
        return content_json, []
    removed: list[str] = []
    cj = dict(content_json)

    sections = cj.get("sections")
    if isinstance(sections, dict):
        new_sections: dict = {}
        for key, val in sections.items():
            if isinstance(val, str):
                nv, rem = sanitize_html_links(val, live)
                new_sections[key] = nv
                removed.extend(rem)
            else:
                new_sections[key] = val
        cj["sections"] = new_sections

    faqs = cj.get("faqs")
    if isinstance(faqs, list):
        new_faqs: list = []
        for f in faqs:
            if isinstance(f, dict) and isinstance(f.get("a"), str):
                na, rem = sanitize_html_links(f["a"], live)
                new_faqs.append({**f, "a": na})
                removed.extend(rem)
            else:
                new_faqs.append(f)
        cj["faqs"] = new_faqs

    return cj, removed


def sanitize_trek_page(page: CMSPage, live: set[str], *, apply: bool = True) -> list[str]:
    """Sanitize a trek page's content_html + content_json against `live`. When apply=True the cleaned
    values are written back onto the page (a new content_json dict is assigned so SQLAlchemy marks it
    dirty). Returns the list of removed (dead) hrefs — empty means nothing changed. apply=False makes it
    a pure dry-run that reports what WOULD be removed without mutating the page."""
    new_html, rem_html = sanitize_html_links(page.content_html, live)
    new_cj, rem_cj = sanitize_content_json_links(page.content_json, live)
    removed = rem_html + rem_cj
    if apply and removed:
        page.content_html = new_html
        page.content_json = new_cj
    return removed
