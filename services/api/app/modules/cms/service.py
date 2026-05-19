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


# Strips LLM inline fact-check markers before/after HTML conversion.
# The LLM produces many variants: "flagged for verification", "flagged for review",
# "flagged – please verify", "flagged for review by editor", etc.
_FLAG_CORE = r"flagged(?:\s+for\s+(?:review|verification|fact.?check|editor|editorial|update))?(?:\s*[–—-][^)\]<\n]*)?"
# Parenthesis forms: *(flagged for review)*, (flagged — please verify)
_FLAG_MD = re.compile(
    r"\s*[\*_]?\(\s*" + _FLAG_CORE + r"\s*\)[\*_]?",
    re.I,
)
# Bracket form: [flagged for review — rates vary by season]
_FLAG_MD_BRACKET = re.compile(
    r"\s*\[\s*" + _FLAG_CORE + r"\s*[^\]]*\]",
    re.I,
)
# Bold/italic form: **flagged for review** or *flagged*
_FLAG_MD_BOLD = re.compile(
    r"\s*\*{1,2}\s*" + _FLAG_CORE + r"\s*\*{1,2}",
    re.I,
)
# HTML form: <em>(flagged...)</em> or <strong>flagged</strong>
_FLAG_HTML = re.compile(
    r"\s*<(?:em|strong)>\s*(?:\()?" + _FLAG_CORE.replace(r"[^)\]<\n]*", r"[^<]*") + r"\s*(?:\))?\s*<\/(?:em|strong)>",
    re.I,
)


def _strip_flagged_markers(text: str) -> str:
    """Remove LLM fact-check markers from raw markdown before HTML conversion."""
    text = _FLAG_MD.sub("", text)
    text = _FLAG_MD_BRACKET.sub("", text)
    text = _FLAG_MD_BOLD.sub("", text)
    return text


def _strip_flagged_markers_html(html: str) -> str:
    """Remove rendered <em>(flagged...)</em> markers from already-converted HTML."""
    return _FLAG_HTML.sub("", html)


def _md_to_html(text: str | None) -> str:
    if not text:
        return ""
    cleaned = _strip_flagged_markers(text)
    return md_lib.markdown(
        cleaned,
        extensions=["extra", "tables", "nl2br", "sane_lists"],
    )


# Maps regex patterns (matched against lowercase headings) to section keys.
# Order matters — first match wins. faqs MUST come before why_this_trek so
# "Frequently Asked Questions About the X Trek" matches faqs, not about.*trek.
_SECTION_HEADING_MAP: list[tuple[str, str]] = [
    (r"faq|frequently asked|questions answered|common question|people also ask|q&a|queries", "faqs"),
    (r"safety|emergency|risk|precaution|tip|warning|hazard|ams|altitude sickness|medical|health.*altitude|mountain.*safe|safe.*trek|know before", "safety"),
    (r"pack|gear|equipment|what to bring|what to carry|clothing|kit|bag", "packing"),
    (r"cost|budget|price|fee|expense|how much|package|charges|rate|invest|spend|financial|tariff|expenditure", "cost_estimate"),
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


# Table-row patterns: "| **Key** | Value |" — highest fidelity, tried first.
# LLMs produce variants like "**Nearest Base**", "**Permits Required**", "**Start Village**"
# so each pattern is broad enough to match prefixed/suffixed header words.
_FACT_TABLE: list[tuple[str, re.Pattern]] = [
    ("duration",   re.compile(r"\|\s*\*\*Duration\b[^|*]*\*\*\s*\|\s*([^|\n]+?)\s*\|", re.I)),
    ("altitude",   re.compile(r"\|\s*\*\*(?:Max(?:imum)?\s+)?(?:Altitude|Elevation|Height)\b[^|*]*\*\*\s*\|\s*([^|\n]+?)\s*\|", re.I)),
    ("difficulty", re.compile(r"\|\s*\*\*Difficulty\b[^|*]*\*\*\s*\|\s*([^|\n]+?)\s*\|", re.I)),
    ("season",     re.compile(r"\|\s*\*\*(?:Best\s+)?Season\b[^|*]*\*\*\s*\|\s*([^|\n]+?)\s*\|", re.I)),
    ("permits",    re.compile(r"\|\s*\*\*Permits?\b[^|*]*\*\*\s*\|\s*([^|\n]+?)\s*\|", re.I)),
    # Base: match "**Base**", "**Nearest Base**", "**Start/Starting**", "**Trailhead**", "**Base Village**"
    ("base",       re.compile(r"\|\s*\*\*(?:(?:Nearest\s+)?Base|Start(?:ing)?|Trailhead|Last\s+Village|Base\s+Village|Base\s+Camp)\b[^|*]*\*\*\s*\|\s*([^|\n]+?)\s*\|", re.I)),
]

# Key:value patterns.  Separator is `\*{0,2}:\*{0,2}\s*` which matches all three
# formats: "**Key:** val"  → `:**` after keyword; "**Key**: val" → `**:` after keyword;
# "Key: val" → `:`.  The colon is REQUIRED so headings ("Best Season for X") never match.
_FACT_KV: list[tuple[str, re.Pattern]] = [
    ("duration",   re.compile(r"(?:\*\*)?duration(?:\*\*)?(?:\*{0,2}:\*{0,2}\s*)([^\n|*]{3,60}?)(?:\n|\||$)", re.I)),
    ("altitude",   re.compile(r"(?:\*\*)?(?:max(?:imum)?\s+)?(?:altitude|elevation|height)(?:\*\*)?(?:\*{0,2}:\*{0,2}\s*)([^\n|*]{3,60}?)(?:\n|\||$)", re.I)),
    ("difficulty", re.compile(r"(?:\*\*)?difficulty(?:\s+level)?(?:\*\*)?(?:\*{0,2}:\*{0,2}\s*)([^\n|*]{3,50}?)(?:\n|\||$)", re.I)),
    ("season",     re.compile(r"(?:\*\*)?(?:best\s+season|ideal\s+season|season)(?:\*\*)?(?:\*{0,2}:\*{0,2}\s*)([^\n|*]{3,80}?)(?:\n|\||$)", re.I)),
    # Permits: broader prefix match, longer value capture (permit names can be verbose)
    ("permits",    re.compile(r"(?:\*\*)?permits?(?:\s+required)?(?:\*\*)?(?:\*{0,2}:\*{0,2}\s*)([^\n|*]{3,150}?)(?:\n|\||$)", re.I)),
    # Base: match "base:", "base village:", "nearest base:", "starting point:", "trailhead:"
    ("base",       re.compile(r"(?:\*\*)?(?:(?:nearest\s+)?base(?:\s+(?:villages?|camp|town))?|starting\s+(?:point|village)|trailhead)(?:\*\*)?(?:\*{0,2}:\*{0,2}\s*)([^\n|*(]{3,80}?)(?:\s*\*|\n|\||$)", re.I)),
]


# Canonical state name mapping — catches LLM misspellings and old names.
# Keys are lowercase; values are the canonical display name used in breadcrumbs and filters.
_STATE_ALIASES: dict[str, str] = {
    # Uttarakhand variants
    "uttrakhand": "Uttarakhand",
    "uttaranchal": "Uttarakhand",
    "uttranchal": "Uttarakhand",
    "uttrakand": "Uttarakhand",
    "uttarakhand": "Uttarakhand",
    # Himachal Pradesh variants
    "himachal": "Himachal Pradesh",
    "hp": "Himachal Pradesh",
    "h.p.": "Himachal Pradesh",
    "himachal pradesh": "Himachal Pradesh",
    # J&K variants
    "j&k": "Jammu & Kashmir",
    "j & k": "Jammu & Kashmir",
    "jammu and kashmir": "Jammu & Kashmir",
    "jammu & kashmir": "Jammu & Kashmir",
    "kashmir": "Jammu & Kashmir",
    # Others
    "ladakh": "Ladakh",
    "maharashtra": "Maharashtra",
    "sikkim": "Sikkim",
    "west bengal": "West Bengal",
    "karnataka": "Karnataka",
}


def _normalize_state(raw: str) -> str:
    """Normalize an LLM-extracted state name to canonical spelling and casing."""
    if not raw:
        return ""
    lc = raw.strip().lower()
    # Exact lookup first
    if lc in _STATE_ALIASES:
        return _STATE_ALIASES[lc]
    # Prefix fallback for subtle variants (e.g. "Uttarkashi District, Uttrakhand")
    for alias, canonical in _STATE_ALIASES.items():
        if lc.startswith(alias) or alias.startswith(lc):
            return canonical
    # Return with leading/trailing space trimmed if no alias match
    return raw.strip()


def _state_from_base(base: str) -> str:
    """Extract and normalize state name from base-camp field.

    Input formats handled:
      "Sankri, Uttarakhand"         → "Uttarakhand"
      "Sankri, Uttrakhand"          → "Uttarakhand"   (LLM misspelling corrected)
      "Sankri, Uttarkashi, Uttarakhand" → "Uttarakhand"
    """
    if not base:
        return ""
    parts = [p.strip() for p in base.split(",")]
    raw_state = parts[-1] if len(parts) >= 2 else ""
    return _normalize_state(raw_state)


def _suitability_from_difficulty(difficulty: str) -> str:
    """Derive suitability label from difficulty string."""
    d = difficulty.lower()
    if any(w in d for w in ("easy", "beginner", "moderate-easy")):
        return "Beginners"
    if any(w in d for w in ("moderate",)):
        return "Beginners, Intermediate"
    if any(w in d for w in ("difficult", "hard", "challenging", "strenuous")):
        return "Experienced trekkers"
    return ""


def _extract_trek_facts_from_markdown(text: str) -> dict[str, str]:
    """Extract duration, altitude, difficulty, season, permits, base from raw markdown.

    Tries table-row format first ("| **Duration** | 7 days |"), then falls back to
    key:value format ("**Duration:** 7 days"). The key:value patterns require an
    explicit colon so H2/H3 headings are never mistakenly captured.
    """
    facts: dict[str, str] = {}
    # Pass 1 — table rows (highest fidelity)
    for key, pattern in _FACT_TABLE:
        m = pattern.search(text)
        if m:
            val = m.group(1).strip().strip("*").strip(" /–-")
            if val and len(val) > 1:
                facts[key] = val
    # Pass 2 — key:value (fill any gaps not found in table)
    for key, pattern in _FACT_KV:
        if key in facts:
            continue
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
    """Parse FAQ markdown into [{q, a}] list.

    Handles three common LLM output formats:
      1. H3 heading question: "### Is Kedarkantha for beginners?\\nAnswer text"
      2. Bold standalone: "**Question?**\\nAnswer text"
      3. Bold Q/A labels: "**Q: Question?**\\n**A:** Answer text"

    Answers are converted to HTML via _md_to_html.
    """
    faqs: list[dict] = []
    current_q: str | None = None
    current_a_lines: list[str] = []

    def _flush() -> None:
        nonlocal current_q, current_a_lines
        if current_q is not None and current_a_lines:
            answer_md = "\n".join(current_a_lines).strip()
            if answer_md:
                faqs.append({"q": current_q, "a": _md_to_html(answer_md)})
        current_q = None
        current_a_lines = []

    for line in faq_raw.splitlines():
        stripped = line.strip()
        # Format 1: ### H3 heading as question
        h3 = re.match(r"^###\s+(.+)$", stripped)
        # Format 2/3: **Question?** or **Q: Question?** (entire line bold)
        bold = re.match(r"^\*\*(?:Q:\s*)?(.+?)\*\*\s*$", stripped)

        if h3 or bold:
            _flush()
            q_raw = (h3 or bold).group(1).strip()  # type: ignore[union-attr]
            q_text = re.sub(r"[?!.]+$", "", q_raw).strip() + "?"
            current_q = q_text
            current_a_lines = []
        elif current_q is not None:
            clean = re.sub(r"^\*\*A:\*\*\s*", "", line)
            current_a_lines.append(clean)

    _flush()
    return faqs


def _process_content_json(content_json: dict | None) -> dict | None:
    """Convert markdown strings inside content_json.sections to HTML.
    Values already in HTML (start with '<') have flagged markers stripped
    to prevent double-processing of pipeline-generated sections."""
    if not content_json:
        return content_json
    sections = content_json.get("sections")
    if isinstance(sections, dict):
        content_json = {
            **content_json,
            "sections": {
                k: (
                    _strip_flagged_markers_html(v)
                    if isinstance(v, str) and v.lstrip().startswith("<")
                    else _md_to_html(v)
                )
                for k, v in sections.items()
            },
        }
    return content_json


def reparse_sections_from_draft(db: Session, *, page: CMSPage) -> CMSPage:
    """Re-parse content_json.sections + trek_facts + faqs from the draft markdown.

    Graceful behaviour:
    - If no draft is linked (no brief_id), falls back to re-parsing content_html.
    - If sections extraction fails (unusual heading format), updates only trek_facts
      and faqs without overwriting existing sections.
    - Never raises — always returns the page in the best state possible.
    """
    from sqlalchemy import select as sa_select
    import logging as _logging
    _log = _logging.getLogger(__name__)

    raw_markdown: str = ""

    # Primary: pull from the source ContentDraft
    if page.brief_id:
        draft = db.scalar(
            sa_select(ContentDraft)
            .where(ContentDraft.brief_id == page.brief_id)
            .order_by(ContentDraft.created_at.desc())
            .limit(1)
        )
        if draft:
            raw_markdown = draft.optimized_content or draft.content_markdown or ""
        else:
            _log.warning("reparse: no draft found for brief_id=%s (page=%s)", page.brief_id, page.slug)
    else:
        _log.warning("reparse: page '%s' has no brief_id — falling back to content_html", page.slug)

    if not raw_markdown.strip():
        # Fallback: attempt to invert content_html back to approximate markdown
        raise ValueError(
            f"No markdown source found for '{page.slug}'. "
            "Ensure the page was published via the pipeline and the draft still exists."
        )

    # Extract facts and FAQs — always safe
    extracted_facts = _extract_trek_facts_from_markdown(raw_markdown)
    faq_raw = _extract_faq_section_raw(raw_markdown)
    extracted_faqs = _parse_faqs_from_section(faq_raw) if faq_raw else []

    existing_json = dict(page.content_json) if page.content_json else {}
    existing_facts = existing_json.get("trek_facts") or {}
    # Merge: extracted values fill gaps; editor-supplied values take precedence
    merged_facts = {**extracted_facts, **{k: v for k, v in existing_facts.items() if v}}
    existing_faqs = existing_json.get("faqs") or []
    merged_faqs = existing_faqs if existing_faqs else extracted_faqs

    # Attempt section extraction — non-fatal if empty (unusual heading format)
    sections = _parse_sections_from_markdown(raw_markdown)
    if sections:
        _log.info("reparse: extracted %d sections for '%s'", len(sections), page.slug)
        page.content_json = {**existing_json, "sections": sections, "trek_facts": merged_facts, "faqs": merged_faqs}
    else:
        _log.warning(
            "reparse: no H2 sections extracted for '%s' — updating trek_facts/faqs only. "
            "Check that the LLM output uses ## headings.", page.slug
        )
        # Update trek_facts and FAQs without overwriting existing sections
        page.content_json = {**existing_json, "trek_facts": merged_facts, "faqs": merged_faqs}

    # Also update trek metadata columns if facts were extracted
    if merged_facts:
        _apply_trek_meta(db, page, {
            "trek_name": page.title.split("—")[0].split(":")[0].strip() or None,
            "trek_state": _state_from_base(merged_facts.get("base", "")) or None,
            "trek_difficulty": merged_facts.get("difficulty") or None,
            "trek_duration": merged_facts.get("duration") or None,
            "trek_season": merged_facts.get("season") or None,
            "trek_suitability": _suitability_from_difficulty(merged_facts.get("difficulty", "")) or None,
        })

    db.flush()
    cache_invalidate([page.slug])
    return page


def _apply_trek_meta(db: Session, page: CMSPage, trek_meta: dict) -> None:
    """Apply trek metadata columns using a savepoint.

    Uses a nested transaction so a missing column (migration 0034 not yet applied)
    never blocks the publish flow — the savepoint rolls back silently and publish
    succeeds without trek metadata. Once alembic upgrade head is run on the target
    database the next publish will populate the columns automatically.
    """
    import logging as _logging
    _log = _logging.getLogger(__name__)
    savepoint = db.begin_nested()
    try:
        for col, val in trek_meta.items():
            setattr(page, col, val)
        db.flush()
        savepoint.commit()
    except Exception as exc:
        savepoint.rollback()
        _log.warning(
            "Trek metadata columns not available (run alembic upgrade head): %s", exc
        )


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

    # Build trek metadata from extracted facts
    trek_meta: dict[str, str | None] = {}
    if trek_facts:
        trek_meta = {
            "trek_name": draft.title.split("—")[0].split(":")[0].strip() or None,
            "trek_state": _state_from_base(trek_facts.get("base", "")) or None,
            "trek_difficulty": trek_facts.get("difficulty") or None,
            "trek_duration": trek_facts.get("duration") or None,
            "trek_season": trek_facts.get("season") or None,
            "trek_suitability": _suitability_from_difficulty(trek_facts.get("difficulty", "")) or None,
        }

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
        # Apply trek metadata in a savepoint — never blocks publish if migration 0034
        # has not yet been applied on this database instance.
        if trek_meta:
            _apply_trek_meta(db, existing, trek_meta)
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
    # Apply trek metadata in a savepoint — never blocks publish if migration 0034
    # has not yet been applied on this database instance.
    if trek_meta:
        _apply_trek_meta(db, page, trek_meta)
    return page
