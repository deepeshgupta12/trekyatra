"""Step 73: TrekSage conversational AI agent for the /treksage chat page.

Uses Anthropic tool-calling (tools API) with up to MAX_TOOL_ROUNDS per turn,
backed by the existing trek_intelligence service functions. Every turn persists
the user message and assistant reply to treksage_chat_sessions/messages tables.

Cost note: each chat turn is a live Haiku call (not cached), up to MAX_TOOL_ROUNDS
tool-call round-trips. This is intentionally higher-cost than the stateless Q&A
endpoint (which is cached) — it's an interactive assistant, not a search widget.
"""
from __future__ import annotations

import json
import logging
import secrets
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.agents.client import get_anthropic_client
from app.modules.trek_intelligence import service as ti_service
from app.modules.trek_intelligence.models import TreksageChatMessage, TreksageChatSession

logger = logging.getLogger(__name__)

_HAIKU_MODEL = "claude-haiku-4-5-20251001"
MAX_TOOL_ROUNDS = 3
MAX_HISTORY_MESSAGES = 10

# ── Tool schemas ──────────────────────────────────────────────────────────────

_TOOLS = [
    {
        "name": "search_treks",
        "description": "Search published TrekYatra trek guides by keyword, state, difficulty, or budget.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Free-text search query"},
                "state": {"type": "string", "description": "Indian state name"},
                "difficulty": {"type": "string", "enum": ["easy", "moderate", "difficult"]},
                "max_budget": {"type": "integer", "description": "Max budget in INR"},
                "limit": {"type": "integer", "default": 5},
            },
        },
    },
    {
        "name": "recommend_treks",
        "description": "Recommend treks based on travel months, duration, budget, difficulty, themes, and traveller type.",
        "input_schema": {
            "type": "object",
            "properties": {
                "months": {"type": "array", "items": {"type": "string"}, "description": "Month names e.g. ['June', 'July']"},
                "duration_min": {"type": "integer", "default": 1},
                "duration_max": {"type": "integer", "default": 30},
                "budget_max": {"type": "integer", "description": "Max budget in INR"},
                "difficulty": {"type": "string", "enum": ["easy", "moderate", "difficult"]},
                "themes": {"type": "array", "items": {"type": "string"}},
                "beginner_friendly": {"type": "boolean"},
                "solo_friendly": {"type": "boolean"},
                "family_friendly": {"type": "boolean"},
                "limit": {"type": "integer", "default": 5},
            },
        },
    },
    {
        "name": "compare_treks",
        "description": "Compare 2-4 treks side-by-side on all structured attributes.",
        "input_schema": {
            "type": "object",
            "required": ["slugs"],
            "properties": {
                "slugs": {"type": "array", "items": {"type": "string"}, "description": "Trek slugs to compare (2-4)"},
            },
        },
    },
    {
        "name": "ask_trek_question",
        "description": "Answer a specific question about one trek grounded in its CMS content and structured data.",
        "input_schema": {
            "type": "object",
            "required": ["slug", "question"],
            "properties": {
                "slug": {"type": "string", "description": "Trek slug"},
                "question": {"type": "string", "description": "The traveller's question"},
            },
        },
    },
    {
        "name": "create_trek_plan_lead",
        "description": "Create an operator-help lead when the user wants expert help planning a trek.",
        "input_schema": {
            "type": "object",
            "required": ["name", "email", "trek_interest", "consent"],
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "trek_interest": {"type": "string"},
                "message": {"type": "string"},
                "consent": {"type": "boolean"},
            },
        },
    },
]

# ── Service function dispatch ─────────────────────────────────────────────────

def _call_tool(db: Session, name: str, inputs: dict) -> Any:
    try:
        if name == "search_treks":
            profiles = ti_service.search_treks(
                db,
                query=inputs.get("query"),
                state=inputs.get("state"),
                difficulty=inputs.get("difficulty"),
                max_budget=inputs.get("max_budget"),
                limit=min(inputs.get("limit", 5), 10),
            )
            return [_slim_profile(p) for p in profiles]

        if name == "recommend_treks":
            from app.schemas.plan import PlanRecommendRequest
            req = PlanRecommendRequest(
                months=inputs.get("months") or [],
                duration_min=inputs.get("duration_min", 1),
                duration_max=inputs.get("duration_max", 30),
                budget_max=inputs.get("budget_max"),
                difficulty=inputs.get("difficulty"),
                themes=inputs.get("themes") or [],
                beginner_friendly=inputs.get("beginner_friendly"),
                solo_friendly=inputs.get("solo_friendly"),
                family_friendly=inputs.get("family_friendly"),
                limit=min(inputs.get("limit", 5), 10),
            )
            results = ti_service.recommend_treks(db, req)
            return [_slim_profile(r.trek) for r in results] if results else []

        if name == "compare_treks":
            slugs = inputs.get("slugs", [])
            if len(slugs) < 2:
                return {"error": "Need at least 2 slugs to compare"}
            result = ti_service.compare_treks(db, slugs[:4])
            return {
                "treks": [_slim_profile(p) for p in result.treks],
                "ai_summary": result.ai_summary,
            }

        if name == "ask_trek_question":
            resp = ti_service.ask_trek_question(db, inputs["slug"], inputs["question"])
            return {"answer": resp.answer, "not_verified": resp.not_verified}

        if name == "create_trek_plan_lead":
            from app.schemas.trek_intelligence import OperatorHelpLeadRequest
            payload = OperatorHelpLeadRequest(**inputs)
            lead = ti_service.create_trek_plan_lead(db, payload)
            return {"lead_id": str(lead.id), "status": lead.status}

    except Exception as exc:
        logger.warning("treksage_agent tool %s failed: %s", name, exc)
        return {"error": str(exc)}

    return {"error": f"Unknown tool: {name}"}


def _slim_profile(p: Any) -> dict:
    return {
        "slug": p.slug,
        "name": p.name,
        "state": p.state,
        "difficulty": p.difficulty,
        "duration": p.duration,
        "season": p.season,
        "budget_min": p.budget_min,
        "budget_max": p.budget_max,
        "themes": p.themes,
        "crowd_level": p.crowd_level,
        "permit_required": p.permit_required,
        "beginner_friendly": p.beginner_friendly,
        "solo_friendly": p.solo_friendly,
        "family_friendly": p.family_friendly,
    }

# ── Session helpers ───────────────────────────────────────────────────────────

def get_or_create_session(db: Session, session_key: str | None) -> TreksageChatSession:
    if session_key:
        existing = db.query(TreksageChatSession).filter_by(session_key=session_key).first()
        if existing:
            return existing
    new_key = secrets.token_urlsafe(32)
    session = TreksageChatSession(
        id=uuid.uuid4(),
        session_key=new_key,
        created_at=datetime.now(timezone.utc),
        last_active_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_history(db: Session, session: TreksageChatSession) -> list[dict]:
    msgs = (
        db.query(TreksageChatMessage)
        .filter_by(session_id=session.id)
        .order_by(TreksageChatMessage.created_at)
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    return [{"role": m.role, "content": m.content} for m in msgs]


def _persist_messages(
    db: Session, session: TreksageChatSession,
    user_content: str, assistant_content: str,
    tool_calls: list[dict] | None = None,
) -> None:
    now = datetime.now(timezone.utc)
    db.add(TreksageChatMessage(
        id=uuid.uuid4(), session_id=session.id, role="user",
        content=user_content, created_at=now,
    ))
    db.add(TreksageChatMessage(
        id=uuid.uuid4(), session_id=session.id, role="assistant",
        content=assistant_content,
        tool_calls_json=tool_calls or None,
        created_at=now,
    ))
    session.last_active_at = now
    db.add(session)
    db.commit()

# ── Main chat function ────────────────────────────────────────────────────────

def chat(
    db: Session,
    session: TreksageChatSession,
    user_message: str,
) -> dict:
    """Run one conversational turn. Returns {reply, tool_calls, session_key}."""
    if not settings.anthropic_api_key:
        return {
            "reply": "TrekSage AI is not configured yet. Please contact the TrekYatra team.",
            "tool_calls": [],
            "session_key": session.session_key,
        }

    history = get_session_history(db, session)
    messages: list[dict] = [*history, {"role": "user", "content": user_message}]

    client = get_anthropic_client()
    tool_calls_log: list[dict] = []
    final_reply = ""

    for round_num in range(MAX_TOOL_ROUNDS + 1):
        response = client.messages.create(
            model=_HAIKU_MODEL,
            max_tokens=600,
            system=(
                "You are Myra, TrekYatra's AI trek planning assistant. Help users plan Himalayan "
                "treks, compare options, get permit and packing info, and find the perfect trek "
                "for their fitness and travel dates. Use the available tools to look up real trek "
                "data — never invent altitudes, permit requirements, or prices. Be friendly, "
                "concise (under 120 words per reply), and always suggest a next step."
            ),
            tools=_TOOLS,
            messages=messages,
        )

        # Collect text content from this response.
        text_parts = [block.text for block in response.content if block.type == "text"]
        tool_use_blocks = [block for block in response.content if block.type == "tool_use"]

        if not tool_use_blocks or round_num == MAX_TOOL_ROUNDS:
            final_reply = " ".join(text_parts).strip() or "I couldn't find an answer right now. Try rephrasing your question."
            break

        # Execute tool calls and build tool_result messages.
        messages.append({"role": "assistant", "content": response.content})
        tool_results = []
        for block in tool_use_blocks:
            result = _call_tool(db, block.name, block.input)
            tool_calls_log.append({"tool": block.name, "input": block.input, "result": result})
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result, default=str),
            })
        messages.append({"role": "user", "content": tool_results})

    _persist_messages(db, session, user_message, final_reply, tool_calls_log or None)
    return {
        "reply": final_reply,
        "tool_calls": tool_calls_log,
        "session_key": session.session_key,
    }
