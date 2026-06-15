"""Step 72: TrekSage trek-intelligence service layer.

Shared by the REST routes (app.api.routes.treks/leads/ai_log) and the MCP
server (app.mcp_server). All ranking/matching/comparison is deterministic
Python; LLM (Claude Haiku, tight max_tokens) is used ONLY for:
  - ask_trek_question (Trek Detail Q&A)
  - compare_treks trade-off summary
  - backfill_trek_meta (admin-triggered draft)
  - translate_trek_content (existing Step 37 agent)
Every LLM answer is cached in trek_qa_cache so repeat queries cost nothing.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.agents.client import get_anthropic_client
from app.modules.cms.models import CMSPage
from app.modules.cms.service import get_page_by_slug
from app.modules.leads.models import LeadSubmission
from app.modules.plan.service import recommend_treks as _recommend_treks
from app.modules.trek_intelligence.models import AIInteractionLog, TrekQACache
from app.schemas.plan import PlanRecommendRequest, PlanRecommendResponse
from app.schemas.trek_intelligence import (
    AskTrekQuestionResponse,
    CompareTreksResponse,
    OperatorHelpLeadRequest,
    TrekComparisonRow,
    TrekDataQualityRow,
    TrekMetaPatch,
    TrekProfile,
)

logger = logging.getLogger(__name__)

_HAIKU_MODEL = "claude-haiku-4-5-20251001"

_NOT_VERIFIED_MSG = (
    "We don't have verified information for this yet. Please check with a TrekYatra "
    "expert or the operator before planning around this detail."
)


# ── Internal helpers ────────────────────────────────────────────────────────

def _trek_facts(page: CMSPage) -> dict:
    return (page.content_json or {}).get("trek_facts", {}) or {}


def page_to_profile(page: CMSPage) -> TrekProfile:
    tf = _trek_facts(page)
    confidence = page.trek_data_confidence or {}
    return TrekProfile(
        slug=page.slug,
        name=page.trek_name or page.title,
        title=page.title,
        state=page.trek_state,
        region=page.trek_region,
        difficulty=page.trek_difficulty or tf.get("difficulty"),
        duration=page.trek_duration or tf.get("duration"),
        duration_days_min=page.trek_duration_days_min,
        duration_days_max=page.trek_duration_days_max,
        season=page.trek_season or tf.get("season"),
        best_months=page.trek_best_months,
        open_months=page.trek_open_months,
        avoid_months=page.trek_avoid_months,
        max_altitude_ft=page.trek_max_altitude_ft,
        permit_required=page.trek_permit_required,
        permit_notes=page.trek_permit_notes,
        budget_min=page.trek_budget_min,
        budget_max=page.trek_budget_max,
        themes=page.trek_themes,
        crowd_level=page.trek_crowd_level,
        beginner_friendly=page.trek_beginner_friendly,
        solo_friendly=page.trek_solo_friendly,
        family_friendly=page.trek_family_friendly,
        operator_available=page.trek_operator_available,
        is_unsafe_closed=page.trek_is_unsafe_closed,
        suitability=page.trek_suitability,
        seo_description=page.seo_description,
        hero_image_url=page.hero_image_url,
        data_confidence=confidence,
        last_verified_at=page.trek_last_verified_at,
    )


def _cache_get(db: Session, cache_key: str) -> TrekQACache | None:
    return db.scalar(select(TrekQACache).where(TrekQACache.cache_key == cache_key))


def _cache_put(db: Session, cache_key: str, answer_text: str, model: str) -> None:
    db.add(TrekQACache(
        id=uuid.uuid4(),
        cache_key=cache_key,
        answer_text=answer_text,
        model=model,
        created_at=datetime.now(timezone.utc),
    ))
    db.commit()


# ── 1. search_treks ──────────────────────────────────────────────────────────

def search_treks(
    db: Session,
    query: str | None = None,
    state: str | None = None,
    difficulty: str | None = None,
    max_budget: int | None = None,
    limit: int = 10,
) -> list[TrekProfile]:
    stmt = select(CMSPage).where(
        CMSPage.page_type == "trek_guide",
        CMSPage.status == "published",
    )
    if state:
        stmt = stmt.where(CMSPage.trek_state.ilike(f"%{state}%"))
    if difficulty:
        stmt = stmt.where(CMSPage.trek_difficulty.ilike(f"%{difficulty}%"))
    pages = db.scalars(stmt.limit(200)).all()

    results: list[CMSPage] = []
    for page in pages:
        if query:
            haystack = " ".join(filter(None, [page.trek_name, page.title, page.seo_description])).lower()
            if query.lower() not in haystack:
                continue
        if max_budget is not None:
            if page.trek_budget_min is not None and page.trek_budget_min > max_budget:
                continue
        results.append(page)
        if len(results) >= limit:
            break

    return [page_to_profile(p) for p in results]


# ── 2. get_trek_details ──────────────────────────────────────────────────────

def get_trek_details(db: Session, slug: str) -> TrekProfile | None:
    page = get_page_by_slug(db, slug)
    if page is None or page.page_type != "trek_guide":
        return None
    return page_to_profile(page)


# ── 3. recommend_treks ───────────────────────────────────────────────────────

def recommend_treks(db: Session, req: PlanRecommendRequest) -> PlanRecommendResponse:
    return _recommend_treks(db, req)


# ── 4. compare_treks ──────────────────────────────────────────────────────────

_COMPARE_FIELDS: list[tuple[str, str]] = [
    ("difficulty", "Difficulty"),
    ("duration", "Duration"),
    ("season", "Best Season"),
    ("max_altitude_ft", "Max Altitude (ft)"),
    ("permit_required", "Permit Required"),
    ("budget_min", "Budget — From (INR)"),
    ("budget_max", "Budget — Up To (INR)"),
    ("crowd_level", "Crowd Level"),
    ("beginner_friendly", "Beginner Friendly"),
    ("solo_friendly", "Solo Friendly"),
    ("family_friendly", "Family Friendly"),
]


def compare_treks(db: Session, slugs: list[str]) -> CompareTreksResponse:
    profiles: list[TrekProfile] = []
    for slug in slugs:
        page = get_page_by_slug(db, slug)
        if page is None or page.page_type != "trek_guide":
            raise ValueError(f"Trek not found: {slug}")
        profiles.append(page_to_profile(page))

    rows: list[TrekComparisonRow] = []
    for field, label in _COMPARE_FIELDS:
        values = [getattr(p, field) for p in profiles]
        rows.append(TrekComparisonRow(field=field, label=label, values=values))

    ai_summary = _get_or_create_compare_summary(db, profiles)

    return CompareTreksResponse(treks=profiles, rows=rows, ai_summary=ai_summary)


def _get_or_create_compare_summary(db: Session, profiles: list[TrekProfile]) -> str | None:
    sorted_slugs = sorted(p.slug for p in profiles)
    cache_key = "compare:" + hashlib.sha256("|".join(sorted_slugs).encode()).hexdigest()[:32]

    cached = _cache_get(db, cache_key)
    if cached:
        return cached.answer_text

    if not settings.anthropic_api_key:
        return None

    facts_lines = []
    for p in profiles:
        facts_lines.append(
            f"- {p.name} ({p.slug}): difficulty={p.difficulty}, duration={p.duration}, "
            f"season={p.season}, altitude_ft={p.max_altitude_ft}, "
            f"budget={p.budget_min}-{p.budget_max} INR, crowd={p.crowd_level}, "
            f"beginner_friendly={p.beginner_friendly}, family_friendly={p.family_friendly}"
        )

    try:
        client = get_anthropic_client()
        response = client.messages.create(
            model=_HAIKU_MODEL,
            max_tokens=300,
            system=(
                "You are TrekSage, TrekYatra's trek comparison assistant. Given structured "
                "facts about 2-4 Himalayan treks, write a concise (max 80 words) trade-off "
                "summary highlighting which trek suits which kind of traveller. Only use the "
                "facts given — never invent permits, prices, or safety claims. If a fact is "
                "missing (None), do not mention it."
            ),
            messages=[{"role": "user", "content": "\n".join(facts_lines)}],
        )
        text = response.content[0].text.strip()
    except Exception as exc:
        logger.error("compare_treks summary failed (%s): %s", type(exc).__name__, exc)
        return None

    _cache_put(db, cache_key, text, _HAIKU_MODEL)
    return text


# ── 5. get_trek_content ──────────────────────────────────────────────────────

def get_trek_content(db: Session, slug: str, section: str) -> dict | list | str | None:
    page = get_page_by_slug(db, slug)
    if page is None or page.page_type != "trek_guide":
        return None
    content = page.content_json or {}
    return content.get(section)


# ── 6. ask_trek_question ─────────────────────────────────────────────────────

_QA_RELEVANT_FIELDS: dict[str, list[str]] = {
    "permit": ["permit_required", "permit_notes"],
    "budget": ["budget_min", "budget_max"],
    "cost": ["budget_min", "budget_max"],
    "price": ["budget_min", "budget_max"],
    "season": ["season", "best_months", "open_months", "avoid_months"],
    "month": ["season", "best_months", "open_months", "avoid_months"],
    "altitude": ["max_altitude_ft"],
    "beginner": ["beginner_friendly", "difficulty"],
    "solo": ["solo_friendly"],
    "family": ["family_friendly"],
    "crowd": ["crowd_level"],
}


def _relevant_fields_for_question(question: str) -> list[str]:
    q = question.lower()
    fields: list[str] = []
    for keyword, mapped_fields in _QA_RELEVANT_FIELDS.items():
        if keyword in q:
            fields.extend(mapped_fields)
    return fields


def ask_trek_question(db: Session, slug: str, question: str) -> AskTrekQuestionResponse:
    page = get_page_by_slug(db, slug)
    if page is None or page.page_type != "trek_guide":
        raise ValueError(f"Trek not found: {slug}")

    profile = page_to_profile(page)
    confidence = profile.data_confidence or {}

    def _is_missing(field: str) -> bool:
        if confidence.get(field) == "missing":
            return True
        return getattr(profile, field, None) is None

    relevant = _relevant_fields_for_question(question)
    if relevant and all(_is_missing(f) for f in relevant):
        return AskTrekQuestionResponse(answer=_NOT_VERIFIED_MSG, cached=False, not_verified=True)

    normalized_q = re.sub(r"\s+", " ", question.strip().lower())
    cache_key = "qa:" + hashlib.sha256(f"{slug}|{normalized_q}".encode()).hexdigest()[:32]

    cached = _cache_get(db, cache_key)
    if cached:
        return AskTrekQuestionResponse(answer=cached.answer_text, cached=True)

    if not settings.anthropic_api_key:
        return AskTrekQuestionResponse(answer=_NOT_VERIFIED_MSG, cached=False, not_verified=True)

    facts = profile.model_dump(exclude={"data_confidence"})
    facts_json = json.dumps({k: v for k, v in facts.items() if v is not None}, default=str)

    try:
        client = get_anthropic_client()
        response = client.messages.create(
            model=_HAIKU_MODEL,
            max_tokens=250,
            system=(
                "You are TrekSage, TrekYatra's trek expert assistant. Answer the traveller's "
                "question about this specific trek using ONLY the JSON facts provided. Keep "
                "the answer under 80 words, friendly and practical. If the fact needed to "
                f"answer isn't in the JSON, say: \"{_NOT_VERIFIED_MSG}\" — never invent "
                "permits, prices, altitudes, or safety claims."
            ),
            messages=[{"role": "user", "content": f"TREK FACTS: {facts_json}\n\nQUESTION: {question}"}],
        )
        text = response.content[0].text.strip()
    except Exception as exc:
        logger.error("ask_trek_question failed (%s): %s", type(exc).__name__, exc)
        return AskTrekQuestionResponse(answer=_NOT_VERIFIED_MSG, cached=False, not_verified=True)

    _cache_put(db, cache_key, text, _HAIKU_MODEL)
    return AskTrekQuestionResponse(answer=text, cached=False)


# ── 7. create_trek_plan_lead (operator-help fallback) ────────────────────────

def create_trek_plan_lead(db: Session, payload: OperatorHelpLeadRequest) -> LeadSubmission:
    if not payload.consent:
        raise ValueError("consent_required")

    lead = LeadSubmission(
        id=uuid.uuid4(),
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        trek_interest=payload.trek_interest,
        message=payload.message,
        source_page=payload.source_page,
        cta_type="operator_help",
        status="new",
        status_history=[{
            "status": "new",
            "changed_at": datetime.now(timezone.utc).isoformat(),
            "changed_by": "trek_intelligence",
        }],
        details_json={
            "trek_slug": payload.trek_slug,
            "travel_month": payload.travel_month,
            "traveller_count": payload.traveller_count,
            "city": payload.city,
            "budget_preference": payload.budget_preference,
            "transport_required": payload.transport_required,
        },
        created_at=datetime.now(timezone.utc),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


# ── 8. translate_trek_content ────────────────────────────────────────────────

def translate_trek_content(db: Session, slug: str, target_lang: str) -> dict:
    from app.modules.agents.translation.agent import translate_page

    page = get_page_by_slug(db, slug)
    if page is None or page.page_type != "trek_guide":
        raise ValueError(f"Trek not found: {slug}")

    faqs = (page.content_json or {}).get("faqs")
    return translate_page(
        title=page.title,
        content_html=page.content_html,
        target_language=target_lang,
        seo_title=page.seo_title,
        seo_description=page.seo_description,
        faqs=faqs,
    )


# ── log_ai_interaction (fire-and-forget) ─────────────────────────────────────

def log_ai_interaction(
    db: Session,
    source: str,
    tool_name: str,
    query_summary: str | None = None,
    result_summary: str | None = None,
    page_url: str | None = None,
    session_id: str | None = None,
    trek_slugs: list[str] | None = None,
) -> None:
    try:
        db.add(AIInteractionLog(
            id=uuid.uuid4(),
            source=source,
            tool_name=tool_name,
            query_summary=(query_summary or "")[:1000] or None,
            result_summary=(result_summary or "")[:1000] or None,
            page_url=page_url,
            session_id=session_id,
            trek_slugs=trek_slugs,
            created_at=datetime.now(timezone.utc),
        ))
        db.commit()
    except Exception as exc:
        logger.warning("log_ai_interaction failed (%s): %s", type(exc).__name__, exc)


# ── backfill_trek_meta (admin-triggered draft) ───────────────────────────────

_BACKFILL_FIELDS = [
    "trek_region", "trek_max_altitude_ft", "trek_duration_days_min", "trek_duration_days_max",
    "trek_best_months", "trek_open_months", "trek_avoid_months", "trek_permit_required",
    "trek_permit_notes", "trek_budget_min", "trek_budget_max", "trek_themes",
    "trek_crowd_level", "trek_beginner_friendly", "trek_solo_friendly", "trek_family_friendly",
]


def backfill_trek_meta(db: Session, slug: str) -> CMSPage:
    page = get_page_by_slug(db, slug)
    if page is None or page.page_type != "trek_guide":
        raise ValueError(f"Trek not found: {slug}")

    if not settings.anthropic_api_key:
        raise ValueError("anthropic_api_key_not_configured")

    confidence = dict(page.trek_data_confidence or {})
    source_text = json.dumps({
        "title": page.title,
        "seo_description": page.seo_description,
        "trek_state": page.trek_state,
        "trek_difficulty": page.trek_difficulty,
        "trek_duration": page.trek_duration,
        "trek_season": page.trek_season,
        "content_json": page.content_json,
    }, default=str)[:8000]

    client = get_anthropic_client()
    response = client.messages.create(
        model=_HAIKU_MODEL,
        max_tokens=400,
        system=(
            "You are a trek-data analyst for TrekYatra. From the JSON page content below, "
            "draft the following structured fields as a single JSON object with these exact "
            f"keys: {', '.join(_BACKFILL_FIELDS)}. Use null for any field you cannot confidently "
            "infer. trek_best_months/open_months/avoid_months are lists of month numbers (1-12). "
            "trek_themes is a list of short strings. Return ONLY the JSON object, no markdown."
        ),
        messages=[{"role": "user", "content": source_text}],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    drafted = json.loads(raw)

    for field in _BACKFILL_FIELDS:
        if field not in drafted:
            continue
        # Never overwrite a field an admin has already verified.
        if confidence.get(field) == "verified":
            continue
        value = drafted[field]
        setattr(page, field, value)
        confidence[field] = "missing" if value is None else "draft"

    page.trek_data_confidence = confidence
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


# ── Admin: trek data-quality dashboard ───────────────────────────────────────

def list_trek_data_quality(db: Session) -> list[TrekDataQualityRow]:
    pages = db.scalars(
        select(CMSPage).where(CMSPage.page_type == "trek_guide").order_by(CMSPage.title)
    ).all()
    rows: list[TrekDataQualityRow] = []
    for page in pages:
        confidence = page.trek_data_confidence or {}
        statuses = [confidence.get(f, "missing") for f in _BACKFILL_FIELDS]
        rows.append(TrekDataQualityRow(
            slug=page.slug,
            name=page.trek_name or page.title,
            verified_count=statuses.count("verified"),
            draft_count=statuses.count("draft"),
            missing_count=statuses.count("missing"),
            is_unsafe_closed=page.trek_is_unsafe_closed,
            last_verified_at=page.trek_last_verified_at,
        ))
    return rows


def update_trek_meta(db: Session, slug: str, patch: "TrekMetaPatch") -> TrekProfile:
    page = get_page_by_slug(db, slug)
    if page is None or page.page_type != "trek_guide":
        raise ValueError(f"Trek not found: {slug}")

    updates = patch.model_dump(exclude_unset=True)
    confidence = dict(page.trek_data_confidence or {})
    touched_backfill_field = False
    for field, value in updates.items():
        setattr(page, field, value)
        if field in _BACKFILL_FIELDS:
            confidence[field] = "verified"
            touched_backfill_field = True

    page.trek_data_confidence = confidence
    if touched_backfill_field:
        page.trek_last_verified_at = datetime.now(timezone.utc)

    db.add(page)
    db.commit()
    db.refresh(page)
    return page_to_profile(page)


# ── Admin: AI interaction log viewer ─────────────────────────────────────────

def list_ai_interaction_logs(db: Session, limit: int = 50) -> list[AIInteractionLog]:
    return list(db.scalars(
        select(AIInteractionLog).order_by(AIInteractionLog.created_at.desc()).limit(limit)
    ).all())
