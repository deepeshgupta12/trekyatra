"""NewsAgent — 4-node LangGraph.

Nodes: fetch_news → filter_relevant → write_article → store_cms

Uses Google News RSS (free, no API key) to fetch trek-related news items,
then generates a structured HTML article. Falls back to a template-based
article when ANTHROPIC_API_KEY is unset or the LLM call fails.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, TypedDict
from xml.etree import ElementTree as ET

import httpx
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.cms.models import CMSPage
from app.modules.cms.service import create_page, get_page_by_slug, update_page
from app.schemas.cms import CMSPageCreate, CMSPagePatch

log = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN%3Aen"
_MAX_RAW = 10
_MAX_RELEVANT = 6


class NewsState(TypedDict):
    trek_slug: str
    trek_name: str
    trek_state: str | None
    db: object  # Session
    raw_items: list[dict]
    relevant_items: list[dict]
    article_html: str
    article_title: str
    week_label: str  # YYYY-WW  e.g. 2026-22
    news_slug: str
    seo_title: str
    seo_description: str
    faqs: list[dict]
    result: dict[str, Any] | None
    error: str | None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _current_week_label() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.year}-{now.isocalendar()[1]:02d}"


def _fetch_rss(query: str) -> list[dict]:
    encoded = query.replace(" ", "+")
    url = _NEWS_RSS.format(query=encoded)
    try:
        resp = httpx.get(url, timeout=15, headers={"User-Agent": "TrekYatra-NewsBot/1.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        items: list[dict] = []
        for item in root.findall(".//item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub_date = (item.findtext("pubDate") or "").strip()
            description = re.sub(r"<[^>]+>", "", item.findtext("description") or "").strip()
            source_el = item.find("source")
            source = (source_el.text or "").strip() if source_el is not None else ""
            if title:
                items.append({
                    "title": title,
                    "link": link,
                    "published": pub_date,
                    "summary": description[:400],
                    "source": source,
                })
        return items[:_MAX_RAW]
    except Exception as exc:
        log.warning("RSS fetch failed for query=%r: %s", query, exc)
        return []


def _fallback_article(trek_name: str, week_display: str, items: list[dict]) -> str:
    if not items:
        return (
            f"<article>\n"
            f"<h1>{trek_name} Trek News — {week_display}</h1>\n"
            f"<p>No recent news found for {trek_name} trek this week. "
            f"Check our full trek guide for the latest trail information.</p>\n"
            f"</article>"
        )
    items_html = "\n".join(
        f'<li><a href="{i["link"]}" target="_blank" rel="noopener noreferrer nofollow">'
        f'{i["title"]}</a>'
        + (f' <span>— {i["source"]}</span>' if i.get("source") else "")
        + (f'<p>{i["summary"]}</p>' if i.get("summary") else "")
        + "</li>"
        for i in items
    )
    slug_name = trek_name.lower().replace(" ", "-")
    return (
        f"<article>\n"
        f"<h1>{trek_name} Trek News — {week_display}</h1>\n"
        f"<nav><ul>\n"
        f"<li><a href=\"#latest-updates\">Latest Updates</a></li>\n"
        f"<li><a href=\"#what-this-means\">What This Means for Trekkers</a></li>\n"
        f"<li><a href=\"#faqs\">Frequently Asked Questions</a></li>\n"
        f"</ul></nav>\n"
        f"<h2 id=\"latest-updates\">Latest Updates</h2>\n"
        f"<ul class=\"news-list\">\n{items_html}\n</ul>\n"
        f"<h2 id=\"what-this-means\">What This Means for Trekkers</h2>\n"
        f"<p>Stay updated with the latest news from {trek_name} trek. Always verify trail "
        f"conditions, permit requirements, and weather forecasts before your trek. "
        f"Check with local operators and the forest department for real-time information.</p>\n"
        f"<h2 id=\"faqs\">Frequently Asked Questions</h2>\n"
        f"<dl>\n"
        f"<dt>Is {trek_name} trek open this week?</dt>\n"
        f"<dd>Trail status changes with season and weather. Check with local authorities "
        f"or registered operators for the most current updates.</dd>\n"
        f"<dt>What permits are required for {trek_name}?</dt>\n"
        f"<dd>Permit requirements vary by season and route. "
        f'Consult our <a href="/trek/{slug_name}">full trek guide</a> for permit details.</dd>\n'
        f"<dt>How do I stay updated on {trek_name} trek news?</dt>\n"
        f"<dd>Bookmark this page. We publish weekly updates every Monday with the latest "
        f"news from verified trekking sources.</dd>\n"
        f"</dl>\n"
        f"</article>"
    )


# ---------------------------------------------------------------------------
# LangGraph nodes
# ---------------------------------------------------------------------------

def fetch_news(state: NewsState) -> NewsState:
    trek_name = state["trek_name"]
    trek_state = state.get("trek_state") or ""

    items: list[dict] = []
    seen_titles: set[str] = set()

    for query in [f"{trek_name} trek", f"{trek_name} {trek_state} trek"]:
        for item in _fetch_rss(query):
            if item["title"] not in seen_titles:
                items.append(item)
                seen_titles.add(item["title"])
        if len(items) >= _MAX_RAW:
            break

    return {**state, "raw_items": items}


def filter_relevant(state: NewsState) -> NewsState:
    trek_name_lower = state["trek_name"].lower()
    trek_slug_lower = state["trek_slug"].lower()
    name_words = [w for w in trek_name_lower.split() if len(w) > 3]
    raw = state["raw_items"]

    relevant = [
        item for item in raw
        if any(w in (item["title"] + " " + item["summary"]).lower() for w in name_words)
        or trek_slug_lower in (item["title"] + " " + item["summary"]).lower()
    ]

    # Fallback: if nothing matches keyword filter, use all raw items
    if not relevant and raw:
        relevant = raw[:_MAX_RELEVANT]

    return {**state, "relevant_items": relevant[:_MAX_RELEVANT]}


def write_article(state: NewsState) -> NewsState:
    trek_name = state["trek_name"]
    week_label = state["week_label"]
    relevant = state["relevant_items"]

    year, week = week_label.split("-")
    week_display = f"Week {week}, {year}"
    article_title = f"{trek_name} Trek News — {week_display}"

    # No relevant news → minimal article
    if not relevant:
        return {
            **state,
            "article_html": _fallback_article(trek_name, week_display, []),
            "article_title": article_title,
            "seo_title": f"{trek_name} Latest Trek News — {week_display}",
            "seo_description": (
                f"No recent news for {trek_name} trek this week. "
                f"Check our guide for trail conditions and permit updates."
            )[:160],
            "faqs": [],
        }

    # No API key → template-based fallback
    if not settings.anthropic_api_key:
        return {
            **state,
            "article_html": _fallback_article(trek_name, week_display, relevant),
            "article_title": article_title,
            "seo_title": f"{trek_name} Latest Trek News — {week_display}",
            "seo_description": (
                f"Latest {trek_name} trek news for {week_display}. "
                f"Trail conditions, permits, and trekking updates."
            )[:160],
            "faqs": [
                {
                    "q": f"Is {trek_name} safe to trek this week?",
                    "a": "Check the latest trail conditions and weather before heading out. "
                         "Always carry permits and register with local authorities.",
                },
                {
                    "q": f"What permits are required for {trek_name}?",
                    "a": f"Permits for {trek_name} can be obtained from the local forest "
                         "department. Requirements may change seasonally.",
                },
                {
                    "q": f"What is the best time to trek {trek_name}?",
                    "a": "The best time varies by elevation and region. Consult our full trek "
                         "guide for detailed seasonal recommendations.",
                },
            ],
        }

    # LLM article generation
    try:
        import anthropic as _anthropic
        from app.modules.agents.news.prompts import ARTICLE_PROMPT

        prompt = ARTICLE_PROMPT.format(
            trek_name=trek_name,
            week_display=week_display,
            week_label=week_label,
            trek_state=state.get("trek_state") or "India",
            items_json=json.dumps(relevant, ensure_ascii=False, indent=2),
        )

        client = _anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=MODEL,
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.content[0].text.strip()

        # Parse HTML + metadata separated by |||
        if "|||" in raw_text:
            html_part, meta_part = raw_text.split("|||", 1)
            html = html_part.strip()
            meta_part = meta_part.strip()
            if meta_part.startswith("```"):
                meta_part = meta_part.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            meta = json.loads(meta_part)
        else:
            html = raw_text
            meta = {}

        return {
            **state,
            "article_html": html,
            "article_title": article_title,
            "seo_title": (meta.get("seo_title") or f"{trek_name} Latest Trek News — {week_display}")[:160],
            "seo_description": (meta.get("seo_description") or f"Latest news for {trek_name} trek — {week_display}.")[:160],
            "faqs": meta.get("faqs") or [],
        }
    except Exception as exc:
        log.error("write_article LLM failed: %s", exc)
        return {
            **state,
            "article_html": _fallback_article(trek_name, week_display, relevant),
            "article_title": article_title,
            "seo_title": f"{trek_name} Latest Trek News — {week_display}",
            "seo_description": f"Latest {trek_name} trek news for {week_display}."[:160],
            "faqs": [],
        }


def store_cms(state: NewsState) -> NewsState:
    db: Session = state["db"]  # type: ignore[assignment]
    news_slug = state["news_slug"]

    content_json: dict[str, Any] = {
        "trek_slug": state["trek_slug"],
        "week_label": state["week_label"],
        "faqs": state["faqs"],
        "news_items": state["relevant_items"],
    }

    existing = get_page_by_slug(db, news_slug)
    try:
        if existing:
            patch = CMSPagePatch(
                title=state["article_title"],
                content_html=state["article_html"],
                content_json=content_json,
                seo_title=state["seo_title"],
                seo_description=state["seo_description"],
                status="published",
            )
            page = update_page(db, page=existing, patch=patch)
        else:
            create_data = CMSPageCreate(
                slug=news_slug,
                page_type="news_article",
                title=state["article_title"],
                content_html=state["article_html"],
                content_json=content_json,
                status="published",
                seo_title=state["seo_title"],
                seo_description=state["seo_description"],
            )
            page = create_page(db, data=create_data)

        db.commit()
        return {
            **state,
            "result": {
                "slug": news_slug,
                "title": state["article_title"],
                "page_id": str(page.id),
                "week_label": state["week_label"],
                "items_count": len(state["relevant_items"]),
                "updated": existing is not None,
            },
            "error": None,
        }
    except Exception as exc:
        log.error("store_cms failed: %s", exc)
        db.rollback()
        return {**state, "result": None, "error": str(exc)}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_news_agent():
    graph: StateGraph = StateGraph(NewsState)
    graph.add_node("fetch_news", fetch_news)
    graph.add_node("filter_relevant", filter_relevant)
    graph.add_node("write_article", write_article)
    graph.add_node("store_cms", store_cms)

    graph.set_entry_point("fetch_news")
    graph.add_edge("fetch_news", "filter_relevant")
    graph.add_edge("filter_relevant", "write_article")
    graph.add_edge("write_article", "store_cms")
    graph.add_edge("store_cms", END)

    return graph.compile()


def generate_news(trek_slug: str, trek_name: str, trek_state: str | None, db: Session) -> dict[str, Any]:
    """Run the NewsAgent for a single trek. Returns a result dict or raises on catastrophic failure."""
    week_label = _current_week_label()
    news_slug = f"{trek_slug}-news-{week_label}"

    agent = build_news_agent()
    final_state = agent.invoke({
        "trek_slug": trek_slug,
        "trek_name": trek_name,
        "trek_state": trek_state,
        "db": db,
        "raw_items": [],
        "relevant_items": [],
        "article_html": "",
        "article_title": "",
        "week_label": week_label,
        "news_slug": news_slug,
        "seo_title": "",
        "seo_description": "",
        "faqs": [],
        "result": None,
        "error": None,
    })

    return final_state.get("result") or {
        "error": final_state.get("error", "Unknown error"),
        "slug": news_slug,
    }
