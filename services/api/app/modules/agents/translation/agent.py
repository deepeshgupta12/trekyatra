from __future__ import annotations

import json
import os
from typing import Any

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


def translate_page(
    title: str,
    content_html: str,
    target_language: str,
    seo_title: str | None = None,
    seo_description: str | None = None,
    faqs: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Translate a CMS page to target_language.

    Translates title, content_html, seo_title, seo_description, and FAQs.
    Returns a dict with all translated fields plus fallback flag.
    Falls back gracefully when ANTHROPIC_API_KEY is unset or the LLM call fails.
    """
    lang_name = SUPPORTED_LANGUAGES.get(target_language, target_language)
    proper_nouns = load_glossary()

    if not settings.anthropic_api_key:
        return {
            "title": title,
            "content_html": content_html,
            "seo_title": seo_title or title,
            "seo_description": seo_description or "",
            "faqs": faqs or [],
            "fallback": "true",
        }

    # Build combined input with all translatable fields
    parts: list[str] = [
        f"TITLE: {title}",
    ]
    if seo_title:
        parts.append(f"SEO_TITLE: {seo_title}")
    if seo_description:
        parts.append(f"SEO_DESCRIPTION: {seo_description}")
    if faqs:
        parts.append(f"FAQS_JSON: {json.dumps(faqs, ensure_ascii=False)}")
    parts.append(f"CONTENT:\n{content_html}")
    combined = "\n\n".join(parts)

    # Build dynamic output schema description for the system prompt
    output_schema_parts = ['"title": "<translated title>"']
    if seo_title:
        output_schema_parts.append('"seo_title": "<translated seo title>"')
    if seo_description:
        output_schema_parts.append('"seo_description": "<translated seo description>"')
    if faqs:
        output_schema_parts.append('"faqs": [{"question": "<translated>", "answer": "<translated>"}]')
    output_schema_parts.append('"content_html": "<translated html>"')
    output_schema = "{\n  " + ",\n  ".join(output_schema_parts) + "\n}"

    try:
        client = _anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=12000,
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
                        f"5. For FAQS_JSON: translate both the 'question' and 'answer' fields. "
                        f"   Preserve the same list structure and number of FAQ items.\n"
                        f"6. Return ONLY a JSON object with this exact structure:\n{output_schema}\n"
                        f"7. No markdown code fences around the JSON."
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
            "seo_title": result.get("seo_title", seo_title or title),
            "seo_description": result.get("seo_description", seo_description or ""),
            "faqs": result.get("faqs", faqs or []),
            "fallback": "false",
        }
    except Exception:
        return {
            "title": title,
            "content_html": content_html,
            "seo_title": seo_title or title,
            "seo_description": seo_description or "",
            "faqs": faqs or [],
            "fallback": "true",
        }
