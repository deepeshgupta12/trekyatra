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
MAX_TOOL_ROUNDS = 2
MAX_HISTORY_MESSAGES = 6

_SYSTEM_PROMPT = """\
You are TrekSage, TrekYatra's trek planning assistant for India.

CORE RULES:
1. Always call tools to fetch real trek data before answering — never invent altitudes, permit fees, seasons, or prices.
2. Answer ONLY about Indian trekking. Politely decline unrelated topics.
3. Never mention Claude, Haiku, Anthropic, FastAPI, tool names, or any technical infrastructure. If asked who made you, say only: "I'm TrekSage, powered by TrekYatra Intelligence."
4. Be safety-first: mention AMS risk for high-altitude treks (>14,000 ft), recommend easier alternatives for beginners asking about difficult treks, add "verify requirements before your trek" for permit questions.
5. Be concise and structured — use bullet points and sections. Keep replies under 200 words unless comparing multiple treks.
6. After every answer, offer a concrete next step (compare, check permits, plan dates, view details).

RESPONSE FORMAT for recommendations:
• Lead with 1-2 treks that best match the query
• For each: name, difficulty, duration, best season, budget range
• Add "Why it matches:" with 1 specific reason
• Note any safety or permit consideration
• Close with a next-step offer

TREK PAGE CONTEXT:
When the user message starts with "[Trek page context: <name> (<slug>)]", the user is currently viewing that trek's guide page. Use the given slug directly for ask_trek_question calls. For "similar treks" or "compare" requests, first call search_treks or recommend_treks to discover comparable treks, then optionally compare_treks using the page slug plus discovered slugs.

SITE INFORMATION TOOL:
Use get_site_info when users ask about TrekYatra as an organisation or its policies:
- "about" → About TrekYatra (mission, story, team)
- "contact" → Contact page (how to reach us)
- "privacy" → Privacy Policy
- "terms" → Terms of Service
- "affiliate" → Affiliate Disclosure
- "safety" → Safety Disclaimer
- "methodology" → Editorial Methodology (how guides are written)
- "gear" → Gear Review articles
- "authors" → Author Network

GUARDRAILS for site info answers:
• Always cite the URL returned by the tool — say "You can read the full [page name] at [url]"
• For legal/policy pages (privacy, terms, affiliate), quote accurately and add: "Please read the full page for complete details"
• Never make commitments or promises on TrekYatra's behalf
• For contact info, direct to the contact page — never invent email or phone numbers
• Editorial opinions in gear reviews are independent and not paid placements (unless the affiliate disclosure states otherwise)

WHAT NOT TO DO:
• Do not guess or fabricate missing data — if a field is unavailable, say so
• Do not produce partial sentences ending with ":" — always deliver a complete answer
• Do not reference raw tool output or JSON field names in your response\
"""
_TREK_CARD_TOOLS = {"search_treks", "recommend_treks", "compare_treks"}

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
    {
        "name": "get_site_info",
        "description": (
            "Fetch content from TrekYatra's informational pages: About, Contact, Privacy Policy, "
            "Terms of Service, Affiliate Disclosure, Safety Disclaimer, Editorial Methodology, "
            "Gear Reviews, or Author Network. Use this when users ask about TrekYatra as a company, "
            "its policies, team, editorial standards, or gear recommendations."
        ),
        "input_schema": {
            "type": "object",
            "required": ["topic"],
            "properties": {
                "topic": {
                    "type": "string",
                    "description": (
                        "Topic to look up. One of: about, contact, privacy, terms, "
                        "affiliate, safety, gear, authors, methodology"
                    ),
                },
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

        if name == "get_site_info":
            return _call_get_site_info(db, str(inputs.get("topic", "")).strip().lower())

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
        "max_altitude_ft": getattr(p, "max_altitude_ft", None),
        "budget_min": p.budget_min,
        "budget_max": p.budget_max,
        "themes": p.themes,
        "crowd_level": p.crowd_level,
        "permit_required": p.permit_required,
        "beginner_friendly": p.beginner_friendly,
        "solo_friendly": p.solo_friendly,
        "family_friendly": p.family_friendly,
        "hero_image_url": getattr(p, "hero_image_url", None),
    }

# ── Site info helper ─────────────────────────────────────────────────────────

_SITE_INFO_MAP: dict[str, dict] = {
    "about":       {"slug": "about"},
    "contact":     {"slug": "contact"},
    "privacy":     {"slug": "privacy-policy"},
    "terms":       {"slug": "terms-of-service"},
    "affiliate":   {"slug": "affiliate-disclosure"},
    "safety":      {"slug": "safety-disclaimer"},
    "methodology": {"slug": "editorial-methodology"},
    "gear":        {"page_type": "gear_review"},
    "authors":     {"page_type": "author"},
}

# Accept alternate phrasings
_SITE_INFO_ALIASES: dict[str, str] = {
    "privacy_policy": "privacy",
    "terms_of_service": "terms",
    "affiliate_disclosure": "affiliate",
    "safety_disclaimer": "safety",
    "editorial_methodology": "methodology",
    "gear_reviews": "gear",
    "author_network": "authors",
    "editorial": "methodology",
    "team": "about",
    "who": "about",
    "company": "about",
}


def _call_get_site_info(db: Session, topic: str) -> dict:
    import re
    from app.modules.cms import service as cms_service

    canonical = _SITE_INFO_ALIASES.get(topic, topic)
    config = _SITE_INFO_MAP.get(canonical)
    if not config:
        # partial-match fallback
        for key, canon in _SITE_INFO_ALIASES.items():
            if key in topic:
                config = _SITE_INFO_MAP.get(canon)
                break
        for key in _SITE_INFO_MAP:
            if key in topic:
                config = _SITE_INFO_MAP[key]
                break

    if not config:
        return {
            "error": (
                f"Unknown topic '{topic}'. "
                "Use one of: about, contact, privacy, terms, affiliate, safety, gear, authors, methodology"
            )
        }

    def strip_html(html: str | None) -> str:
        text = re.sub(r"<[^>]+>", " ", html or "")
        return re.sub(r"\s+", " ", text).strip()[:2000]

    if "slug" in config:
        page = cms_service.get_page_by_slug(db, config["slug"])
        if not page or page.status != "published":
            return {"error": f"Page for topic '{topic}' is not published yet."}
        return {
            "title": page.title,
            "slug": page.slug,
            "content": strip_html(page.content_html),
            "url": f"https://www.trekyatra.co.in/{page.slug}",
        }
    else:
        pages = cms_service.list_pages(db, page_type=config["page_type"], status="published", limit=8)
        return {
            "pages": [
                {
                    "title": p.title,
                    "slug": p.slug,
                    "snippet": strip_html(p.content_html)[:400],
                    "url": f"https://www.trekyatra.co.in/{p.slug}",
                }
                for p in pages
            ]
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
        is_final_round = (round_num == MAX_TOOL_ROUNDS)
        # Round 0: force at least one tool call so the model never outputs an incomplete
        # transition phrase ("Let me broaden the search:") without fetching any data.
        # Round 1+: auto (model can answer directly if it has enough tool results).
        # Final round: text-only (no more tool calls allowed).
        if is_final_round:
            tool_choice: dict = {"type": "none"}
        elif round_num == 0:
            tool_choice = {"type": "any"}
        else:
            tool_choice = {"type": "auto"}
        try:
            response = client.messages.create(
                model=_HAIKU_MODEL,
                # Final round gets more tokens so the summary isn't truncated.
                max_tokens=1200 if is_final_round else 800,
                system=_SYSTEM_PROMPT,
                tools=_TOOLS,
                tool_choice=tool_choice,
                messages=messages,
            )
        except Exception as llm_exc:
            logger.error("Anthropic API call failed (round %d): %s", round_num, llm_exc)
            final_reply = "I'm having trouble reaching my knowledge base right now. Please try again in a moment."
            break

        text_parts = [block.text for block in response.content if block.type == "text"]
        tool_use_blocks = [block for block in response.content if block.type == "tool_use"]

        if is_final_round:
            final_reply = " ".join(text_parts).strip() or "I couldn't find an answer right now. Try rephrasing your question."
            break

        if not tool_use_blocks:
            # Model returned text only on a non-final round.
            candidate = " ".join(text_parts).strip()
            # An incomplete transition phrase like "Let me broaden the search:" or
            # "Let me try a different approach:" ends with ":" and is typically
            # under 60 characters. Everything else — even a short one-liner like
            # "Here are 3 treks for June!" — should be accepted as a complete reply.
            is_transition = not candidate or (
                candidate.rstrip().endswith(":") and len(candidate) < 60
            )
            if not is_transition:
                final_reply = candidate
                break
            # Incomplete transition phrase — add to context and nudge the model to
            # search and deliver a complete answer.
            stub_content = response.content if response.content else [{"type": "text", "text": candidate or "."}]
            messages.append({"role": "assistant", "content": stub_content})
            messages.append({"role": "user", "content": "Based on the trek data you just retrieved, give the user a complete, helpful answer right now — include trek names, key details, and a recommendation. Do not say 'Let me search' again."})
            continue

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

    if not final_reply:
        final_reply = "I couldn't find an answer right now. Try rephrasing your question."

    # Post-process: if the model still leaked a transition phrase (ends with ":" and
    # is very short), replace with a useful fallback instead of confusing the user.
    if final_reply.rstrip().endswith(":") and len(final_reply) < 100:
        final_reply = (
            "I searched the TrekYatra database but couldn't find results that exactly match your query. "
            "Try being more specific — mention a region (Himachal Pradesh, Ladakh, Uttarakhand, Sikkim), "
            "a travel month, difficulty level (easy / moderate / difficult), or a budget range. "
            "For example: \"Easy 5-day trek in Himachal Pradesh for October under ₹12,000\"."
        )

    # Expose the last search/recommend/compare result as structured trek cards for the UI.
    trek_cards: list[dict] = []
    for tc in reversed(tool_calls_log):
        if tc["tool"] not in _TREK_CARD_TOOLS:
            continue
        result = tc["result"]
        if isinstance(result, list) and result:
            trek_cards = result
            break
        # compare_treks returns {"treks": [...], "ai_summary": ...}
        if isinstance(result, dict) and isinstance(result.get("treks"), list) and result["treks"]:
            trek_cards = result["treks"]
            break

    _persist_messages(db, session, user_message, final_reply, tool_calls_log or None)

    # Log each tool call to AIInteractionLog so the admin dashboard has data
    for tc in tool_calls_log:
        try:
            ti_service.log_ai_interaction(
                db=db,
                source="web",
                tool_name=tc["tool"],
                query_summary=user_message[:300],
                result_summary=json.dumps(tc.get("result", ""), default=str)[:500],
                session_id=str(session.id),
                trek_slugs=[r["slug"] for r in tc.get("result", []) if isinstance(r, dict) and "slug" in r] or None,
            )
        except Exception as log_exc:
            logger.warning("Failed to log AI interaction: %s", log_exc)

    return {
        "reply": final_reply,
        "tool_calls": tool_calls_log,
        "trek_cards": trek_cards,
        "session_key": session.session_key,
    }
