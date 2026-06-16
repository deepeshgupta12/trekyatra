"""Step 72 — "TrekSage" MCP server.

Exposes the trek_intelligence service layer as MCP tools, consumable by
ChatGPT, Claude, and any other MCP-compatible client. Mounted as a
Streamable HTTP sub-app at /mcp on the main FastAPI app (app/main.py).

Read-only tools (search_treks, get_trek_details, recommend_treks,
compare_treks, get_trek_content, ask_trek_question) require no auth — they
expose only published trek_guide content, never PII.

Write / LLM-cost tools (create_trek_plan_lead, translate_trek_content)
require an `mcp_key` argument matching `settings.mcp_shared_secret`.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Any

from mcp.server.fastmcp import FastMCP

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.trek_intelligence import service as ti_service
from app.schemas.plan import PlanRecommendRequest
from app.schemas.trek_intelligence import OperatorHelpLeadRequest

mcp = FastMCP("TrekSage", streamable_http_path="/")


@contextmanager
def _db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _compact_profile(profile) -> dict[str, Any]:
    """Trim a TrekProfile for search/list results — strips heavy fields to save tokens."""
    data = profile.model_dump(exclude_none=True)
    data.pop("data_confidence", None)
    data.pop("content_sections", None)
    data.pop("faqs", None)
    if "seo_description" in data and len(data["seo_description"]) > 200:
        data["seo_description"] = data["seo_description"][:200] + "..."
    return data


def _check_mcp_key(mcp_key: str | None) -> bool:
    return bool(settings.mcp_shared_secret) and mcp_key == settings.mcp_shared_secret


@mcp.tool()
def search_treks(
    query: str | None = None,
    state: str | None = None,
    difficulty: str | None = None,
    max_budget: int | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Search published TrekYatra trek guides. Filter by free-text query (matches
    trek name/title/description), Indian state, difficulty (easy/moderate/difficult),
    and/or max budget in INR. Returns compact trek summaries (slug, name, state,
    difficulty, duration, season, budget range, themes)."""
    with _db() as db:
        profiles = ti_service.search_treks(
            db, query=query, state=state, difficulty=difficulty,
            max_budget=max_budget, limit=min(limit, 20),
        )
        return [_compact_profile(p) for p in profiles]


@mcp.tool()
def get_trek_details(slug: str) -> dict[str, Any]:
    """Get the full structured profile for one TrekYatra trek by its slug
    (region, altitude, duration, season/best-months, permits, budget range,
    themes, crowd level, suitability, and a data_confidence map showing which
    fields are verified vs draft vs missing)."""
    with _db() as db:
        profile = ti_service.get_trek_details(db, slug)
        if profile is None:
            return {"error": f"Trek not found: {slug}"}
        return profile.model_dump(mode="json")


@mcp.tool()
def recommend_treks(
    months: list[str] | None = None,
    duration_min: int = 1,
    duration_max: int = 30,
    experience_level: str = "moderate",
    fitness_level: str = "average",
    budget_min: int | None = None,
    budget_max: int | None = None,
    region: str | None = None,
    intent: list[str] | None = None,
    comfort_preferences: list[str] | None = None,
    traveller_type: str | None = None,
) -> dict[str, Any]:
    """Recommend up to 5 TrekYatra treks matching the traveller's preferences:
    travel months (e.g. ["Dec","Jan"]), trip duration range in days, experience
    level (never|easy|moderate|experienced|expert), fitness level
    (low|average|good|very_good), budget range in INR, preferred region/state,
    intent tags (e.g. ["beginner","snow"]), and traveller type
    (solo|friends|couple|family|corporate|first-time). Never recommends treks
    closed/unsafe for the requested months."""
    with _db() as db:
        req = PlanRecommendRequest(
            intent=intent or [],
            months=months or [],
            duration_min=duration_min,
            duration_max=duration_max,
            experience_level=experience_level,
            fitness_level=fitness_level,
            budget_min=budget_min,
            budget_max=budget_max,
            region=region,
            comfort_preferences=comfort_preferences or [],
            traveller_type=traveller_type,
        )
        resp = ti_service.recommend_treks(db, req)
        return resp.model_dump(mode="json")


@mcp.tool()
def compare_treks(slugs: list[str]) -> dict[str, Any]:
    """Compare 2-4 TrekYatra treks side-by-side (difficulty, duration, season,
    altitude, permits, budget, crowd level, beginner/solo/family suitability)
    plus a short AI-generated trade-off summary. Pass trek slugs as returned
    by search_treks or get_trek_details."""
    with _db() as db:
        try:
            resp = ti_service.compare_treks(db, slugs)
        except ValueError as exc:
            return {"error": str(exc)}
        return resp.model_dump(mode="json")


@mcp.tool()
def get_trek_content(slug: str, section: str) -> dict[str, Any]:
    """Get one structured content section (e.g. "itinerary", "packing_list",
    "faqs", "safety") for a TrekYatra trek by slug, for grounding detailed
    answers. Returns {"error": ...} if the trek or section is not found."""
    with _db() as db:
        content = ti_service.get_trek_content(db, slug, section)
        if content is None:
            return {"error": f"Trek or section not found: {slug}/{section}"}
        return {"slug": slug, "section": section, "content": content}


@mcp.tool()
def ask_trek_question(slug: str, question: str) -> dict[str, Any]:
    """Ask a specific question about one TrekYatra trek (e.g. "Is this
    beginner-friendly?", "What's the best month?", "Do I need a permit?",
    "What should I pack?"). Answers are grounded in verified trek data only —
    if the relevant fact isn't verified yet, returns a "not verified" disclaimer
    instead of guessing."""
    with _db() as db:
        try:
            resp = ti_service.ask_trek_question(db, slug, question)
        except ValueError as exc:
            return {"error": str(exc)}
        return resp.model_dump(mode="json")


@mcp.tool()
def create_trek_plan_lead(
    mcp_key: str,
    name: str,
    email: str,
    trek_interest: str,
    consent: bool,
    phone: str | None = None,
    trek_slug: str | None = None,
    message: str | None = None,
    travel_month: str | None = None,
    traveller_count: int | None = None,
    city: str | None = None,
    budget_preference: str | None = None,
    transport_required: bool | None = None,
) -> dict[str, Any]:
    """Hand off a traveller to a TrekYatra trek-planning expert when no good
    automated match is found. Requires explicit user consent (consent=true)
    and a valid mcp_key (shared secret configured by TrekYatra)."""
    if not _check_mcp_key(mcp_key):
        return {"error": "unauthorized"}
    with _db() as db:
        try:
            lead = ti_service.create_trek_plan_lead(db, OperatorHelpLeadRequest(
                name=name,
                email=email,
                phone=phone,
                trek_slug=trek_slug,
                trek_interest=trek_interest,
                message=message,
                consent=consent,
                travel_month=travel_month,
                traveller_count=traveller_count,
                city=city,
                budget_preference=budget_preference,
                transport_required=transport_required,
                source_page="mcp",
            ))
        except ValueError as exc:
            return {"error": str(exc)}
        return {"status": "submitted", "lead_id": str(lead.id)}


@mcp.tool()
def translate_trek_content(mcp_key: str, slug: str, target_lang: str) -> dict[str, Any]:
    """Translate a TrekYatra trek guide's content into another language (e.g.
    "hi" for Hindi). Returns a draft translation. Requires a valid mcp_key
    (shared secret configured by TrekYatra)."""
    if not _check_mcp_key(mcp_key):
        return {"error": "unauthorized"}
    with _db() as db:
        try:
            return ti_service.translate_trek_content(db, slug, target_lang)
        except ValueError as exc:
            return {"error": str(exc)}
