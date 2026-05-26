"""NewsAgent — LangGraph pipeline: one CMS page per RSS news item.

Nodes: fetch_news → filter_relevant → write_and_store_articles

For each relevant RSS item, generates a focused 300-word news article and
stores it as a separate CMS page (page_type=news_article).
Slug is derived from the article headline for SEO-friendliness.
Falls back to template HTML when ANTHROPIC_API_KEY is unset or LLM fails.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from typing import Any, TypedDict
from xml.etree import ElementTree as ET

import httpx
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.cms.models import CMSPage
from app.modules.cms.service import create_page, get_page_by_slug
from app.schemas.cms import CMSPageCreate

log = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN%3Aen"
_MAX_RAW = 12
_MAX_RELEVANT = 6


class NewsState(TypedDict):
    trek_slug: str
    trek_name: str
    trek_state: str | None
    db: object  # Session
    raw_items: list[dict]
    relevant_items: list[dict]
    articles: list[dict]  # one entry per CMS page created/skipped
    error: str | None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _current_week_label() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.year}-{now.isocalendar()[1]:02d}"


def _slug_from_title(trek_slug: str, title: str) -> str:
    """Generate SEO-friendly slug from a news headline.

    Strips source attribution (everything after ` - ` or ` — `),
    slugifies the remainder, caps at 60 chars, appends YYYY-MM to prevent
    collisions between identical headlines in different months.
    """
    # Remove source attribution suffix common in Google News titles
    clean = re.split(r"\s*[-—]\s+", title)[0]
    slug = re.sub(r"[^a-z0-9]+", "-", clean.lower()).strip("-")
    if len(slug) > 60:
        slug = slug[:60].rsplit("-", 1)[0]
    ym = datetime.now(timezone.utc).strftime("%Y-%m")
    return f"{slug}-{ym}"


def _clean_title(title: str) -> str:
    """Return headline without the source attribution suffix."""
    return re.split(r"\s*[-—]\s+", title)[0].strip()


def _is_recent(pub_date_str: str, days: int = 90) -> bool:
    """Return True if pub_date_str (RFC 2822) is within the last `days` days.
    Returns True when date is missing or unparseable to avoid silently dropping items.
    """
    if not pub_date_str:
        return True
    try:
        pub_dt = parsedate_to_datetime(pub_date_str)
        cutoff = datetime.now(pub_dt.tzinfo or timezone.utc) - timedelta(days=days)
        return pub_dt >= cutoff
    except Exception:
        return True


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
            if title and _is_recent(pub_date, days=90):
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


def _fallback_for_item(trek_name: str, item: dict) -> str:
    """Template HTML article for a single news item (no LLM required)."""
    clean_title = _clean_title(item["title"])
    summary = item.get("summary", "")
    source = item.get("source", "")
    link = item.get("link", "")

    source_html = ""
    if link:
        src_label = source or "Read original"
        source_html = (
            f'<p>Source: <a href="{link}" target="_blank"'
            f' rel="noopener noreferrer nofollow">{src_label}</a></p>\n'
        )

    return (
        f"<article>\n"
        f"<h1>{clean_title}</h1>\n"
        f'<h2 id="what-happened">What Happened</h2>\n'
        f"<p>{summary}</p>\n"
        f'<h2 id="impact-on-trekkers">Impact on Trekkers</h2>\n'
        f"<p>This development may affect your {trek_name} trek plans. "
        f"Verify current trail conditions, permit requirements, and safety advisories "
        f"with local authorities before your trek.</p>\n"
        f'<h2 id="what-to-do">What Trekkers Should Do</h2>\n'
        f"<ul>\n"
        f"<li>Check with the local forest department for the latest rules and closures</li>\n"
        f"<li>Contact a registered trek operator for real-time trail updates</li>\n"
        f"<li>Carry all required permits and valid photo identification</li>\n"
        f"<li>Register with local authorities before starting the trek</li>\n"
        f"</ul>\n"
        f"{source_html}"
        f"</article>"
    )


def _llm_article_for_item(trek_name: str, trek_state: str, item: dict) -> tuple[str, dict]:
    """Use Claude Haiku to write a focused news article for a single RSS item."""
    import anthropic as _anthropic
    from app.modules.agents.news.prompts import INDIVIDUAL_ARTICLE_PROMPT

    prompt = INDIVIDUAL_ARTICLE_PROMPT.format(
        trek_name=trek_name,
        trek_state=trek_state,
        headline=item["title"],
        summary=item.get("summary", ""),
        source=item.get("source", ""),
        link=item.get("link", "#"),
    )

    client = _anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    # Strip outer code fence if LLM wraps the entire response (e.g. ```html...```)
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    if "|||" in raw:
        html_part, meta_part = raw.split("|||", 1)
        html = html_part.strip()
        # Strip code fence from html_part (e.g. ```html...``` around article body)
        if html.startswith("```"):
            html = html.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        meta_part = meta_part.strip()
        if meta_part.startswith("```"):
            meta_part = meta_part.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        try:
            meta = json.loads(meta_part)
        except json.JSONDecodeError:
            meta = {}
    else:
        html = raw
        meta = {}

    return html, meta


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
        if any(
            w in (item["title"] + " " + item["summary"]).lower()
            for w in name_words
        )
        or trek_slug_lower in (item["title"] + " " + item["summary"]).lower()
    ]

    # Fallback: if nothing matches keyword filter, use all raw items
    if not relevant and raw:
        relevant = raw[:_MAX_RELEVANT]

    return {**state, "relevant_items": relevant[:_MAX_RELEVANT]}


def write_and_store_articles(state: NewsState) -> NewsState:
    """For each relevant RSS item, write and store one CMS page."""
    db: Session = state["db"]  # type: ignore[assignment]
    trek_slug = state["trek_slug"]
    trek_name = state["trek_name"]
    trek_state = state.get("trek_state") or "India"
    relevant = state["relevant_items"]

    articles: list[dict] = []

    for item in relevant:
        news_slug = _slug_from_title(trek_slug, item["title"])
        clean_title = _clean_title(item["title"])

        # Idempotent — skip if already published this month
        if get_page_by_slug(db, news_slug):
            articles.append({"slug": news_slug, "title": clean_title, "skipped": True})
            continue

        # Generate HTML + SEO metadata
        if settings.anthropic_api_key:
            try:
                html, meta = _llm_article_for_item(trek_name, trek_state, item)
            except Exception as exc:
                log.error("LLM failed for %r: %s", item["title"][:60], exc)
                html = _fallback_for_item(trek_name, item)
                meta = {}
        else:
            html = _fallback_for_item(trek_name, item)
            meta = {}

        seo_title = (meta.get("seo_title") or f"{clean_title} | {trek_name} News")[:160]
        seo_desc = (meta.get("seo_description") or item.get("summary", ""))[:160]
        faqs = meta.get("faqs") or []

        content_json: dict[str, Any] = {
            "trek_slug": trek_slug,
            "news_item": item,  # single source item — accessed as content_json.news_item
            "faqs": faqs,
        }

        try:
            page = create_page(db, data=CMSPageCreate(
                slug=news_slug,
                page_type="news_article",
                title=clean_title,
                content_html=html,
                content_json=content_json,
                status="published",
                seo_title=seo_title,
                seo_description=seo_desc,
            ))
            db.commit()
            articles.append({
                "slug": news_slug,
                "title": clean_title,
                "page_id": str(page.id),
                "skipped": False,
            })
        except Exception as exc:
            log.error("store failed for %s: %s", news_slug, exc)
            db.rollback()
            articles.append({
                "slug": news_slug,
                "title": clean_title,
                "error": str(exc),
                "skipped": True,
            })

    return {**state, "articles": articles, "error": None}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_news_agent():
    graph: StateGraph = StateGraph(NewsState)
    graph.add_node("fetch_news", fetch_news)
    graph.add_node("filter_relevant", filter_relevant)
    graph.add_node("write_and_store_articles", write_and_store_articles)

    graph.set_entry_point("fetch_news")
    graph.add_edge("fetch_news", "filter_relevant")
    graph.add_edge("filter_relevant", "write_and_store_articles")
    graph.add_edge("write_and_store_articles", END)

    return graph.compile()


def generate_news(trek_slug: str, trek_name: str, trek_state: str | None, db: Session) -> dict[str, Any]:
    """Run the NewsAgent for a single trek.

    Returns a summary dict with articles_created, articles_skipped, and the
    full articles list. Each article entry has slug, title, and either
    page_id (success) or error (failure) or skipped=True (already exists).
    """
    agent = build_news_agent()
    final_state = agent.invoke({
        "trek_slug": trek_slug,
        "trek_name": trek_name,
        "trek_state": trek_state,
        "db": db,
        "raw_items": [],
        "relevant_items": [],
        "articles": [],
        "error": None,
    })

    created = [a for a in final_state.get("articles", []) if not a.get("skipped") and "error" not in a]
    skipped = [a for a in final_state.get("articles", []) if a.get("skipped")]

    return {
        "articles_created": len(created),
        "articles_skipped": len(skipped),
        "articles": final_state.get("articles", []),
        "error": final_state.get("error"),
    }
