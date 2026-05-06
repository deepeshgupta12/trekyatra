from __future__ import annotations

import json
import os

import anthropic as _anthropic

from app.core.config import settings

SUPPORTED_LANGUAGES: dict[str, str] = {
    "hi": "Hindi",
    "mr": "Marathi",
}

_GLOSSARY_PATH = os.path.join(os.path.dirname(__file__), "../../../data/glossary_hi.json")


def load_glossary() -> list[str]:
    try:
        with open(_GLOSSARY_PATH) as f:
            return json.load(f).get("proper_nouns", [])
    except Exception:
        return []


def translate_page(title: str, content_html: str, target_language: str) -> dict[str, str]:
    """Translate title + content_html to target_language.

    Returns {"title": str, "content_html": str, "fallback": bool}.
    Falls back gracefully when ANTHROPIC_API_KEY is unset or the LLM call fails.
    """
    lang_name = SUPPORTED_LANGUAGES.get(target_language, target_language)
    proper_nouns = load_glossary()

    if not settings.anthropic_api_key:
        return {
            "title": title,
            "content_html": content_html,
            "fallback": "true",
        }

    combined = f"TITLE: {title}\n\nCONTENT:\n{content_html}"

    try:
        client = _anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8000,
            system=[
                {
                    "type": "text",
                    "text": (
                        f"You are a professional translator specialising in Indian travel and trekking content.\n"
                        f"Translate the provided content to {lang_name}.\n\n"
                        f"RULES:\n"
                        f"1. Preserve ALL HTML tags exactly — only translate the visible text within tags.\n"
                        f"2. Do NOT translate these proper nouns: {', '.join(proper_nouns[:40])}.\n"
                        f"3. Do NOT translate trek names, mountain names, region names, or place names.\n"
                        f"4. Do NOT translate URLs, slugs, or technical terms.\n"
                        f"5. Return ONLY a JSON object with keys \"title\" and \"content_html\".\n"
                        f"6. No markdown code fences around the JSON."
                    ),
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": combined}],
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(raw)
        return {
            "title": result.get("title", title),
            "content_html": result.get("content_html", content_html),
            "fallback": "false",
        }
    except Exception:
        return {
            "title": title,
            "content_html": content_html,
            "fallback": "true",
        }
