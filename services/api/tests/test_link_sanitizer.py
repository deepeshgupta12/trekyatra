"""Internal-link sanitizer — unwrap agent-inserted dead internal links (keep text), preserve live
internal + external links. Fixes GSC 404s from links to never-published URLs."""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.modules.cms.models import CMSPage
from app.modules.cms.link_sanitizer import (
    build_live_url_set,
    sanitize_content_json_links,
    sanitize_html_links,
    sanitize_trek_page,
)

LIVE = {"/", "/explore", "/plan", "/regions/kashmir", "/trek/kedarkantha", "/guides/best-gear"}


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


# ── Pure sanitiser (no DB) ────────────────────────────────────────────────────
def test_unwraps_dead_internal_link_keeps_text():
    html = 'See the <a href="/trek/roopkund-trek-complete-guide">Roopkund guide</a> for more.'
    out, removed = sanitize_html_links(html, LIVE)
    assert out == "See the Roopkund guide for more."          # <a> gone, text kept
    assert removed == ["/trek/roopkund-trek-complete-guide"]


def test_keeps_live_internal_link():
    html = 'Try the <a href="/trek/kedarkantha">Kedarkantha trek</a>.'
    out, removed = sanitize_html_links(html, LIVE)
    assert out == html and removed == []


def test_keeps_external_and_anchor_and_mailto():
    html = (
        '<a href="https://indiahikes.com/x">ext</a> '
        '<a href="#faq">jump</a> '
        '<a href="mailto:a@b.com">mail</a>'
    )
    out, removed = sanitize_html_links(html, LIVE)
    assert out == html and removed == []


def test_absolute_own_host_and_query_fragment_normalised():
    # absolute URL on our host, live path with a query + fragment → kept
    keep = '<a href="https://www.trekyatra.co.in/explore?state=Kashmir#top">explore</a>'
    out, removed = sanitize_html_links(keep, LIVE)
    assert out == keep and removed == []
    # dead absolute own-host link → unwrapped
    dead = '<a href="https://www.trekyatra.co.in/treks/kashmir">dead</a>'
    out2, removed2 = sanitize_html_links(dead, LIVE)
    assert out2 == "dead" and removed2 == ["https://www.trekyatra.co.in/treks/kashmir"]


def test_trailing_slash_matches():
    out, removed = sanitize_html_links('<a href="/explore/">go</a>', LIVE)
    assert out == '<a href="/explore/">go</a>' and removed == []


def test_content_json_sections_and_faqs():
    cj = {
        "sections": {"intro": 'Read <a href="/treks/bad">this</a> and <a href="/plan">plan</a>.'},
        "faqs": [{"q": "Q?", "a": 'See <a href="/regions/kashmirKashmir">Kashmir</a>.'}],
        "trek_facts": {"duration": "6 days"},
    }
    new_cj, removed = sanitize_content_json_links(cj, LIVE)
    assert new_cj["sections"]["intro"] == "Read this and <a href=\"/plan\">plan</a>."
    assert new_cj["faqs"][0]["a"] == "See Kashmir."
    assert new_cj["trek_facts"] == {"duration": "6 days"}      # untouched
    assert set(removed) == {"/treks/bad", "/regions/kashmirKashmir"}


# ── DB-backed: allow-list + page sanitise ─────────────────────────────────────
def test_build_live_url_set_includes_published_excludes_unpublished(db):
    pub = f"ls-pub-{uuid.uuid4().hex[:8]}"
    unpub = f"ls-unpub-{uuid.uuid4().hex[:8]}"
    db.add_all([
        CMSPage(slug=pub, page_type="trek_guide", title="Pub", status="published"),
        CMSPage(slug=unpub, page_type="trek_guide", title="Unpub", status="draft"),
    ])
    db.commit()
    try:
        live = build_live_url_set(db)
        assert f"/trek/{pub}" in live
        assert f"/trek/{unpub}" not in live
        # curated + static always present
        assert "/regions/kashmir" in live and "/seasons/winter" in live
        assert "/explore" in live and "/trek-types/lake-treks" in live
    finally:
        db.execute(delete(CMSPage).where(CMSPage.slug.in_([pub, unpub])))
        db.commit()


def test_sanitize_trek_page_mutates_and_dry_run(db):
    slug = f"ls-page-{uuid.uuid4().hex[:8]}"
    page = CMSPage(
        slug=slug, page_type="trek_guide", title="X", status="published",
        content_html='Link to <a href="/trek/does-not-exist">nowhere</a> and <a href="/explore">explore</a>.',
        content_json={"faqs": [{"q": "q", "a": '<a href="/treks/bad">bad</a>'}]},
    )
    db.add(page)
    db.commit()
    try:
        live = build_live_url_set(db)
        # dry-run: reports but does NOT mutate
        removed_dry = sanitize_trek_page(page, live, apply=False)
        assert "/trek/does-not-exist" in removed_dry and "/treks/bad" in removed_dry
        assert "does-not-exist" in page.content_html  # unchanged

        # apply: mutates
        removed = sanitize_trek_page(page, live, apply=True)
        assert set(removed) == {"/trek/does-not-exist", "/treks/bad"}
        assert 'href="/trek/does-not-exist"' not in page.content_html
        assert "nowhere" in page.content_html                       # text kept
        assert 'href="/explore"' in page.content_html               # live link kept
        assert page.content_json["faqs"][0]["a"] == "bad"           # faq dead link unwrapped
    finally:
        db.execute(delete(CMSPage).where(CMSPage.slug == slug))
        db.commit()


# ── public_path_for: page_type → public URL (2026-09-22 GSC 404 fix) ──────────
# publish/service.py used to hardcode "/trek/{slug}" for EVERY published page, which labelled news
# articles (real URL /news/{slug}) as /trek/{slug}. These lock the mapping in.
def test_public_path_for_news_article_is_news_prefix():
    from app.modules.cms.link_sanitizer import public_path_for
    assert public_path_for("news_article", "kareri-lake-reopens-2026-09") == "/news/kareri-lake-reopens-2026-09"


def test_public_path_for_trek_guide_is_trek_prefix():
    from app.modules.cms.link_sanitizer import public_path_for
    assert public_path_for("trek_guide", "kedarkantha") == "/trek/kedarkantha"


def test_public_path_for_editorial_is_site_root():
    from app.modules.cms.link_sanitizer import public_path_for
    assert public_path_for("editorial", "privacy") == "/privacy"


def test_public_path_for_covers_every_known_page_type():
    """Every page_type in _PAGE_PREFIX must resolve to its own prefix — never silently to /trek."""
    from app.modules.cms.link_sanitizer import _PAGE_PREFIX, public_path_for
    for page_type, prefix in _PAGE_PREFIX.items():
        assert public_path_for(page_type, "s") == f"{prefix}/s", page_type


def test_public_path_for_unknown_type_falls_back_to_trek():
    from app.modules.cms.link_sanitizer import public_path_for
    assert public_path_for("totally-unknown-type", "s") == "/trek/s"


def test_sanitizer_unwraps_dead_links_on_non_trek_page_types(db):
    """The publish link gate now runs for EVERY page type, not just trek_guide. A news article with a
    hallucinated /gear/… link must have it unwrapped exactly like a trek page."""
    slug = f"ls-news-{uuid.uuid4().hex[:8]}"
    page = CMSPage(
        slug=slug, page_type="news_article", title="N", status="published",
        content_html='See the <a href="/gear/trekking-gear-checklist">gear checklist</a> and <a href="/explore">explore</a>.',
    )
    db.add(page)
    db.commit()
    try:
        removed = sanitize_trek_page(page, build_live_url_set(db), apply=True)
        assert removed == ["/gear/trekking-gear-checklist"]
        assert "gear checklist" in page.content_html          # text kept
        assert 'href="/gear/' not in page.content_html        # dead link unwrapped
        assert 'href="/explore"' in page.content_html         # live link untouched
    finally:
        db.execute(delete(CMSPage).where(CMSPage.slug == slug))
        db.commit()
