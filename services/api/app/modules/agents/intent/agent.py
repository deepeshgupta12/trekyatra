"""Intent classifier — lightweight one-shot Anthropic call with prompt caching.

Falls back to rule-based classification when ANTHROPIC_API_KEY is unset or the
API call fails. All exceptions are swallowed; classification always returns a result.
"""
from __future__ import annotations

import json
import re

import anthropic as _anthropic

from app.core.config import settings
from app.schemas.monetization import IntentClassification

MODEL = "claude-haiku-4-5-20251001"

_MODULE_MAP = {
    "research": "affiliate",
    "booking_ready": "lead",
    "inspiration": "newsletter",
    "buyer": "product",
}

_SYSTEM_PROMPT = """You classify the monetization intent of a trekking website visitor.

Classify into one of four intents:
- research: user is comparing options, exploring gear, or comparing multiple treks
- booking_ready: user has a specific trek in mind and is ready to take action
- inspiration: user is broadly browsing without a clear destination
- buyer: user has purchased before or is actively looking to purchase a product

Respond with a JSON object only:
{"intent": "<intent>", "confidence": 0.0}

Confidence is 0.0–1.0. Output only JSON, no commentary."""


def _rule_based(page_type: str, has_bookmarks: bool, has_purchases: bool) -> IntentClassification:
    if has_purchases:
        intent = "buyer"
    elif has_bookmarks:
        intent = "booking_ready"
    elif page_type in ("gear_guide", "packing_guide", "comparison"):
        intent = "research"
    else:
        intent = "inspiration"
    return IntentClassification(
        intent=intent,
        confidence=0.7,
        recommended_module=_MODULE_MAP[intent],
    )


def classify_intent(
    page_type: str,
    page_slug: str,
    has_bookmarks: bool = False,
    has_purchases: bool = False,
) -> IntentClassification:
    if not settings.anthropic_api_key:
        return _rule_based(page_type, has_bookmarks, has_purchases)

    user_context = (
        f"Page type: {page_type}\n"
        f"Page slug: {page_slug}\n"
        f"User has saved/bookmarked treks: {has_bookmarks}\n"
        f"User has made past purchases: {has_purchases}"
    )

    try:
        client = _anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=MODEL,
            max_tokens=64,
            system=[
                {
                    "type": "text",
                    "text": _SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_context}],
        )
        raw = response.content[0].text.strip()
        # strip markdown fences if model wraps output
        raw = re.sub(r"```(?:json)?\s*", "", raw).strip("`").strip()
        parsed = json.loads(raw)
        intent = parsed.get("intent", "inspiration")
        if intent not in _MODULE_MAP:
            intent = "inspiration"
        confidence = float(parsed.get("confidence", 0.8))
        return IntentClassification(
            intent=intent,
            confidence=confidence,
            recommended_module=_MODULE_MAP[intent],
        )
    except Exception:
        return _rule_based(page_type, has_bookmarks, has_purchases)
