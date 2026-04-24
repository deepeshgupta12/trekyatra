from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

import markdown as md_lib
import redis
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.cms.models import CMSPage
from app.modules.content.models import ContentDraft
from app.schemas.cms import CMSPageCreate, CMSPagePatch

# ---------------------------------------------------------------------------
# Redis cache helpers — DB 2, 5-min TTL (same pool as before)
# ---------------------------------------------------------------------------

_CMS_CACHE_DB = 2
_TTL_SECONDS = 300


def _redis() -> redis.Redis:
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        db=_CMS_CACHE_DB,
        decode_responses=True,
    )


def _cms_key(slug: str) -> str:
    return f"cms:page:{slug}"


def cache_invalidate(slugs: list[str]) -> None:
    try:
        r = _redis()
        if slugs:
            r.delete(*[_cms_key(s) for s in slugs])
    except Exception:
        pass


def cache_invalidate_all() -> None:
    try:
        r = _redis()
        keys = r.keys("cms:page:*")
        if keys:
            r.delete(*keys)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def create_page(db: Session, *, data: CMSPageCreate) -> CMSPage:
    payload = data.model_dump()
    payload["content_json"] = _process_content_json(payload.get("content_json"))
    page = CMSPage(**payload)
    db.add(page)
    db.flush()
    return page


def get_page_by_slug(db: Session, slug: str) -> CMSPage | None:
    return db.scalar(select(CMSPage).where(CMSPage.slug == slug))


def get_page_by_id(db: Session, page_id: uuid.UUID) -> CMSPage | None:
    return db.scalar(select(CMSPage).where(CMSPage.id == page_id))


def list_pages(
    db: Session,
    *,
    status: str | None = None,
    page_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[CMSPage]:
    q = select(CMSPage).order_by(CMSPage.updated_at.desc())
    if status:
        q = q.where(CMSPage.status == status)
    if page_type:
        q = q.where(CMSPage.page_type == page_type)
    q = q.limit(limit).offset(offset)
    return list(db.scalars(q).all())


def update_page(db: Session, *, page: CMSPage, patch: CMSPagePatch) -> CMSPage:
    updates = patch.model_dump(exclude_unset=True)
    if "content_json" in updates:
        updates["content_json"] = _process_content_json(updates["content_json"])
    for field, value in updates.items():
        setattr(page, field, value)
    if updates.get("status") == "published" and page.published_at is None:
        page.published_at = datetime.now(timezone.utc)
    db.flush()
    cache_invalidate([page.slug])
    return page


def delete_page(db: Session, *, page: CMSPage) -> None:
    cache_invalidate([page.slug])
    db.delete(page)
    db.flush()


def _md_to_html(text: str | None) -> str:
    if not text:
        return ""
    return md_lib.markdown(
        text,
        extensions=["extra", "tables", "nl2br", "sane_lists"],
    )


# Maps regex patterns (matched against lowercase headings) to section keys.
# Order matters — first match wins. faqs MUST come before why_this_trek so
# "Frequently Asked Questions About the X Trek" matches faqs, not about.*trek.
_SECTION_HEADING_MAP: list[tuple[str, str]] = [
    (r"faq|frequently asked|questions answered|common question|people also ask|q&a|queries", "faqs"),
    (r"safety|emergency|risk|precaution|tip|warning|hazard|ams|altitude sickness", "safety"),
    (r"pack|gear|equipment|what to bring|what to carry|clothing|kit|bag", "packing"),
    (r"cost|budget|price|fee|expense|how much|package|charges|rate", "cost_estimate"),
    (r"permit", "permits"),
    (r"difficulty|difficult\b|fitness|experience required|who can|suitable for|level|grade|strenuous", "difficulty"),
    (r"best time|when to go|season|visit.*time|weather|climate|month", "best_time"),
    (r"itinerary|day.wise|day by day|what each day|day \d|schedule", "itinerary"),
    (r"route|trail|reach|access|how to get|getting there|from.*to.*trek|trek.*path|trek.*track|altitude.*distance|trail overview|route overview", "route_overview"),
    (r"why.*trek|why.*choose|why.*visit|why.*special|about.*trek|overview.*trek|introduction|hidden gem|key facts|overview", "why_this_trek"),
]


def _parse_sections_from_markdown(text: str) -> dict[str, str]:
    """Split a markdown document into named sections keyed by content type.

    Only H1 and H2 headings act as section boundaries; H3+ are treated as content
    so sub-headings (e.g. "### May – June") don't reset the active section.
    H1 (document title) always opens why_this_trek so intro paragraphs are captured.
    """
    sections: dict[str, list[str]] = {}
    current_key: str | None = "why_this_trek"
    current_lines: list[str] = []

    for line in text.splitlines():
        # Only H1/H2 are section boundaries; H3+ fall through as content
        m = re.match(r"^(#{1,2})\s+(.+)$", line)
        if m:
            if current_key and current_lines:
                sections.setdefault(current_key, []).extend(current_lines)
            hashes, heading_text = m.group(1), m.group(2)
            heading = re.sub(r"[?!:]+$", "", heading_text.lower()).strip()
            if len(hashes) == 1:
                # H1 = document title; content that follows before first H2 is intro
                current_key = "why_this_trek"
            else:
                current_key = None
                for pattern, key in _SECTION_HEADING_MAP:
                    if re.search(pattern, heading):
                        current_key = key
                        break
            current_lines = []
        elif current_key is not None:
            current_lines.append(line)

    if current_key and current_lines:
        sections.setdefault(current_key, []).extend(current_lines)

    return {k: _md_to_html("\n".join(v).strip()) for k, v in sections.items() if v}


# Patterns to auto-extract trek facts from raw markdown (key: value style).
# Handles bold-label lists ("**Duration:** 5 days"), table rows, and "Permit Required:" formats.
_FACT_EXTRACT: list[tuple[str, str, re.Pattern]] = [
    ("duration",   "duration",   re.compile(r"(?:\*\*)?duration(?:\*\*)?[:\s*]+([^\n|*]{3,60}?)(?:\n|\||$)", re.I)),
    ("altitude",   "altitude",   re.compile(r"(?:\*\*)?(?:max(?:imum)?\s+)?(?:altitude|elevation|height)(?:\*\*)?[:\s*]+([^\n|*]{3,60}?)(?:\n|\||$)", re.I)),
    ("difficulty", "difficulty", re.compile(r"(?:\*\*)?difficulty(?:\s+level)?(?:\*\*)?[:\s*]+([^\n|*]{3,50}?)(?:\n|\||$)", re.I)),
    ("season",     "season",     re.compile(r"(?:\*\*)?(?:best\s+(?:time|season)|ideal\s+season|best\s+season|season)(?:\*\*)?[:\s*]+([^\n|*]{3,80}?)(?:\n|\||$)", re.I)),
    # "**Permit Required:** Yes — ..." — matches bold close + optional second colon before value
    ("permits",    "permits",    re.compile(r"(?:\*\*)?permit\b[^*:\n]{0,20}(?::?\*\*)?:?\s+([^\n|*]{3,80}?)(?:\n|\||$)", re.I)),
    # "**Nearest Base Villages:** Nohradhar / Sarahan *(Note:...)*" — note stripped via [^\n|*(]
    ("base",       "base",       re.compile(r"(?:\*\*)?(?:(?:nearest\s+)?base\s+(?:villages?|camp|town)|starting\s+(?:point|village)|trailhead)(?::?\*\*)?:?\s+([^\n|*(]{3,50}?)(?:\s*\*|\n|\||$)", re.I)),
]


def _extract_trek_facts_from_markdown(text: str) -> dict[str, str]:
    """Extract duration, altitude, difficulty, season, permits, base from raw markdown."""
    facts: dict[str, str] = {}
    for key, _label, pattern in _FACT_EXTRACT:
        m = pattern.search(text)
        if m:
            val = m.group(1).strip().strip("*").strip(" /–-")
            if val and len(val) > 1:
                facts[key] = val
    return facts


def _extract_faq_section_raw(text: str) -> str:
    """Return the raw markdown lines belonging to the FAQ section."""
    lines = text.splitlines()
    faq_start: int | None = None
    for i, line in enumerate(lines):
        m = re.match(r"^#{1,2}\s+(.+)$", line)
        if m:
            heading = re.sub(r"[?!:]+$", "", m.group(1).lower()).strip()
            if re.search(r"faq|frequently asked|questions answered|common question|people also ask", heading):
                faq_start = i + 1
                break
    if faq_start is None:
        return ""
    result: list[str] = []
    for line in lines[faq_start:]:
        if re.match(r"^#{1,2}\s", line):
            break
        result.append(line)
    return "\n".join(result)


def _parse_faqs_from_section(faq_raw: str) -> list[dict]:
    """Parse FAQ markdown with bold-question / paragraph-answer format into [{q, a}] list.

    Handles both: '**Question?**\\nAnswer' and '**Q: Question?**\\n**A:** Answer'.
    Answers are converted to HTML via _md_to_html so the FE can render them safely.
    """
    faqs: list[dict] = []
    current_q: str | None = None
    current_a_lines: list[str] = []

    for line in faq_raw.splitlines():
        # Bold standalone line = question ("**Some question?**" or "**Q: Some question?**")
        m = re.match(r"^\*\*(?:Q:\s*)?(.+?)\*\*\s*$", line.strip())
        if m:
            if current_q is not None and current_a_lines:
                answer_md = "\n".join(current_a_lines).strip()
                if answer_md:
                    faqs.append({"q": current_q, "a": _md_to_html(answer_md)})
            q_text = m.group(1).strip()
            # Normalise: strip trailing punctuation, then add ?
            q_text = re.sub(r"[?!.]+$", "", q_text).strip() + "?"
            current_q = q_text
            current_a_lines = []
        elif current_q is not None:
            # Skip "**A:**" answer-label lines (some formats include them)
            clean = re.sub(r"^\*\*A:\*\*\s*", "", line)
            current_a_lines.append(clean)

    if current_q is not None and current_a_lines:
        answer_md = "\n".join(current_a_lines).strip()
        if answer_md:
            faqs.append({"q": current_q, "a": _md_to_html(answer_md)})

    return faqs


def _process_content_json(content_json: dict | None) -> dict | None:
    """Convert markdown strings inside content_json.sections to HTML.
    Values already in HTML (start with '<') are passed through unchanged to
    prevent double-processing of pipeline-generated sections."""
    if not content_json:
        return content_json
    sections = content_json.get("sections")
    if isinstance(sections, dict):
        content_json = {
            **content_json,
            "sections": {
                k: (v if not isinstance(v, str) or v.lstrip().startswith("<") else _md_to_html(v))
                for k, v in sections.items()
            },
        }
    return content_json


def reparse_sections_from_draft(db: Session, *, page: CMSPage) -> CMSPage:
    """Re-parse content_json.sections from the page's associated ContentDraft markdown."""
    from sqlalchemy import select as sa_select

    if not page.brief_id:
        raise ValueError("CMS page has no brief_id — cannot locate source draft")

    draft = db.scalar(
        sa_select(ContentDraft)
        .where(ContentDraft.brief_id == page.brief_id)
        .order_by(ContentDraft.created_at.desc())
        .limit(1)
    )
    if not draft:
        raise ValueError(f"No draft found for brief_id {page.brief_id}")

    raw_markdown = draft.optimized_content or draft.content_markdown or ""
    if not raw_markdown.strip():
        raise ValueError("Draft has no content to parse")

    sections = _parse_sections_from_markdown(raw_markdown)
    if not sections:
        raise ValueError("No sections could be extracted from the draft markdown")

    extracted_facts = _extract_trek_facts_from_markdown(raw_markdown)
    faq_raw = _extract_faq_section_raw(raw_markdown)
    extracted_faqs = _parse_faqs_from_section(faq_raw) if faq_raw else []

    existing_json = dict(page.content_json) if page.content_json else {}
    # Merge: editor-supplied trek_facts override auto-extracted values
    existing_facts = existing_json.get("trek_facts") or {}
    merged_facts = {**extracted_facts, **{k: v for k, v in existing_facts.items() if v}}
    # Merge FAQs: editor-supplied pairs take priority; extracted ones fill in when editor list is empty
    existing_faqs = existing_json.get("faqs") or []
    merged_faqs = existing_faqs if existing_faqs else extracted_faqs
    page.content_json = {**existing_json, "sections": sections, "trek_facts": merged_facts, "faqs": merged_faqs}
    db.flush()
    cache_invalidate([page.slug])
    return page


def upsert_page_from_draft(db: Session, *, draft: ContentDraft) -> CMSPage:
    """Create or update a CMSPage from a ContentDraft at publish time."""
    existing = get_page_by_slug(db, draft.slug)
    raw_markdown = draft.optimized_content or draft.content_markdown or ""
    content_html = _md_to_html(raw_markdown)
    sections = _parse_sections_from_markdown(raw_markdown)
    trek_facts = _extract_trek_facts_from_markdown(raw_markdown)
    faq_raw = _extract_faq_section_raw(raw_markdown)
    faqs = _parse_faqs_from_section(faq_raw) if faq_raw else []
    content_json: dict | None = None
    if sections or trek_facts or faqs:
        content_json = {}
        if sections:
            content_json["sections"] = sections
        if trek_facts:
            content_json["trek_facts"] = trek_facts
        if faqs:
            content_json["faqs"] = faqs

    if existing:
        existing.title = draft.title
        existing.content_html = content_html
        existing.content_json = content_json
        existing.seo_title = draft.meta_title
        existing.seo_description = draft.meta_description
        existing.status = "published"
        existing.published_at = datetime.now(timezone.utc)
        existing.brief_id = draft.brief_id
        db.flush()
        cache_invalidate([existing.slug])
        return existing

    page = CMSPage(
        slug=draft.slug,
        page_type="trek_guide",
        title=draft.title,
        content_html=content_html,
        content_json=content_json,
        seo_title=draft.meta_title,
        seo_description=draft.meta_description,
        status="published",
        published_at=datetime.now(timezone.utc),
        brief_id=draft.brief_id,
    )
    db.add(page)
    db.flush()
    return page
