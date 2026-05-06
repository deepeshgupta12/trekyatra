"""TripPlannerAgent — 4-node LangGraph.

Nodes: gather_constraints → select_treks → build_itinerary → package_response

Falls back to a rule-based plan when ANTHROPIC_API_KEY is unset or any LLM
call fails. All exceptions are swallowed; the agent always returns a result.
"""
from __future__ import annotations

import json
import re
from typing import TypedDict

import anthropic as _anthropic
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.cms.models import CMSPage
from app.modules.cms.service import list_pages

MODEL = "claude-haiku-4-5-20251001"

_DIFFICULTY_MAP = {
    "beginner": ["easy", "beginner", "moderate-easy", "easy to moderate"],
    "intermediate": ["moderate", "intermediate", "moderate-difficult"],
    "advanced": ["difficult", "hard", "challenging", "strenuous", "advanced"],
}

_MONTH_SEASON = {
    "january": "winter", "february": "winter", "march": "spring",
    "april": "spring", "may": "spring", "june": "monsoon",
    "july": "monsoon", "august": "monsoon", "september": "post-monsoon",
    "october": "autumn", "november": "autumn", "december": "winter",
}


class TripPlanState(TypedDict):
    region: str | None
    duration_days: int | None
    experience: str | None
    month: str | None
    budget_inr: int | None
    group_size: str | None
    db: object  # Session passed through state
    candidate_treks: list[dict]
    selected_trek: dict | None
    itinerary: list[dict]
    output: dict | None
    fallback_used: bool


def _page_to_dict(page: CMSPage) -> dict:
    facts = (page.content_json or {}).get("trek_facts", {}) or {}
    sections = (page.content_json or {}).get("sections", {}) or {}
    return {
        "id": str(page.id),
        "slug": page.slug,
        "title": page.title,
        "difficulty": facts.get("difficulty", ""),
        "duration": facts.get("duration", ""),
        "season": facts.get("season", ""),
        "altitude": facts.get("altitude", ""),
        "permits": facts.get("permits", ""),
        "base": facts.get("base", ""),
        "cost_estimate": sections.get("cost_estimate", ""),
        "itinerary_text": sections.get("itinerary", ""),
        "packing_text": sections.get("packing", ""),
    }


def _score_trek(trek: dict, state: TripPlanState) -> int:
    score = 0
    region = (state.get("region") or "").lower()
    experience = (state.get("experience") or "").lower()
    month = (state.get("month") or "").lower()

    if region and region in trek["slug"].lower():
        score += 3
    if region and region in trek["title"].lower():
        score += 2

    diff = trek["difficulty"].lower()
    allowed = _DIFFICULTY_MAP.get(experience, [])
    if any(a in diff for a in allowed):
        score += 2

    season = _MONTH_SEASON.get(month, "")
    if season and season in trek["season"].lower():
        score += 2
    if month and month in trek["season"].lower():
        score += 1

    return score


def _fallback_itinerary(trek: dict, duration_days: int | None) -> list[dict]:
    days = duration_days or 5
    itinerary = [{"day": 1, "title": "Arrival & acclimatisation", "activities": ["Reach base village", "Rest and hydrate", "Trek briefing"], "notes": "Early arrival recommended."}]
    for d in range(2, days):
        itinerary.append({"day": d, "title": f"Trek Day {d - 1}", "activities": ["Trail trek", "Scenic viewpoints", "Camp setup"], "notes": None})
    itinerary.append({"day": days, "title": "Descent & departure", "activities": ["Return trek", "Travel back"], "notes": None})
    return itinerary


# ---------------------------------------------------------------------------
# LangGraph nodes
# ---------------------------------------------------------------------------

def gather_constraints(state: TripPlanState) -> TripPlanState:
    # Normalise experience
    exp = (state.get("experience") or "").lower()
    if exp not in ("beginner", "intermediate", "advanced"):
        state["experience"] = "intermediate"
    return state


def select_treks(state: TripPlanState) -> TripPlanState:
    db: Session = state["db"]  # type: ignore[assignment]
    try:
        pages = list_pages(db, status="published", page_type="trek_guide", limit=50)
        candidates = [_page_to_dict(p) for p in pages]
        # Score and sort
        scored = sorted(candidates, key=lambda t: _score_trek(t, state), reverse=True)
        state["candidate_treks"] = scored[:5]
        state["selected_trek"] = scored[0] if scored else None
    except Exception:
        state["candidate_treks"] = []
        state["selected_trek"] = None
    return state


def build_itinerary(state: TripPlanState) -> TripPlanState:
    trek = state.get("selected_trek")
    if not trek:
        state["itinerary"] = []
        state["fallback_used"] = True
        return state

    duration_days = state.get("duration_days") or 5

    # If itinerary text already exists in CMS, parse it as fallback
    existing_itinerary_text = trek.get("itinerary_text", "")

    if not settings.anthropic_api_key:
        state["itinerary"] = _fallback_itinerary(trek, duration_days)
        state["fallback_used"] = True
        return state

    prompt = (
        f"Trek: {trek['title']}\n"
        f"Duration: {duration_days} days\n"
        f"Difficulty: {trek['difficulty']}\n"
        f"Altitude: {trek['altitude']}\n"
        f"Existing itinerary notes: {existing_itinerary_text[:500] if existing_itinerary_text else 'none'}\n\n"
        f"Generate a {duration_days}-day trekking itinerary as a JSON array.\n"
        f"Each element: {{\"day\": N, \"title\": \"...\", \"activities\": [\"...\", \"...\"], \"notes\": \"...\"}}\n"
        f"Return ONLY the JSON array. No markdown fences."
    )

    try:
        client = _anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=MODEL,
            max_tokens=3000,
            system=[{
                "type": "text",
                "text": "You are a Himalayan trek planning expert. Output only valid JSON.",
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        raw = re.sub(r"```(?:json)?\s*", "", raw).strip("`").strip()
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            state["itinerary"] = parsed
            state["fallback_used"] = False
        else:
            raise ValueError("Not a list")
    except Exception:
        state["itinerary"] = _fallback_itinerary(trek, duration_days)
        state["fallback_used"] = True

    return state


def package_response(state: TripPlanState) -> TripPlanState:
    trek = state.get("selected_trek")
    if not trek:
        state["output"] = {
            "trek_slug": None,
            "trek_title": "No matching trek found",
            "itinerary": [],
            "cost_estimate": None,
            "gear_essentials": [],
            "permit_note": None,
            "operator_suggestion": None,
            "best_month": None,
            "difficulty": None,
        }
        return state

    # Build gear list from packing text (first 3 bullet items)
    packing = trek.get("packing_text", "") or ""
    gear = [line.lstrip("-•* ").strip() for line in packing.split("\n") if line.strip().startswith(("-", "•", "*"))][:5]
    if not gear:
        gear = ["Trekking shoes", "Warm layers", "Rain jacket", "First aid kit", "Headlamp"]

    state["output"] = {
        "trek_slug": trek["slug"],
        "trek_title": trek["title"],
        "itinerary": state.get("itinerary", []),
        "cost_estimate": trek.get("cost_estimate") or None,
        "gear_essentials": gear,
        "permit_note": trek.get("permits") or None,
        "operator_suggestion": None,
        "best_month": trek.get("season") or None,
        "difficulty": trek.get("difficulty") or None,
    }
    return state


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------

def build_graph() -> StateGraph:
    g = StateGraph(TripPlanState)
    g.add_node("gather_constraints", gather_constraints)
    g.add_node("select_treks", select_treks)
    g.add_node("build_itinerary", build_itinerary)
    g.add_node("package_response", package_response)
    g.set_entry_point("gather_constraints")
    g.add_edge("gather_constraints", "select_treks")
    g.add_edge("select_treks", "build_itinerary")
    g.add_edge("build_itinerary", "package_response")
    g.add_edge("package_response", END)
    return g.compile()


def run_trip_planner(
    db: Session,
    region: str | None,
    duration_days: int | None,
    experience: str | None,
    month: str | None,
    budget_inr: int | None,
    group_size: str | None,
) -> dict:
    """Run the TripPlannerAgent and return the output dict.

    Always returns a dict — never raises.
    """
    try:
        graph = build_graph()
        initial_state: TripPlanState = {
            "region": region,
            "duration_days": duration_days,
            "experience": experience,
            "month": month,
            "budget_inr": budget_inr,
            "group_size": group_size,
            "db": db,
            "candidate_treks": [],
            "selected_trek": None,
            "itinerary": [],
            "output": None,
            "fallback_used": False,
        }
        final_state = graph.invoke(initial_state)
        return {
            "output": final_state.get("output") or {},
            "fallback_used": final_state.get("fallback_used", False),
            "trek_slug": (final_state.get("output") or {}).get("trek_slug"),
        }
    except Exception:
        return {
            "output": {
                "trek_slug": None,
                "trek_title": "Plan generation failed — please try again.",
                "itinerary": [],
                "cost_estimate": None,
                "gear_essentials": [],
                "permit_note": None,
                "operator_suggestion": None,
                "best_month": None,
                "difficulty": None,
            },
            "fallback_used": True,
            "trek_slug": None,
        }
