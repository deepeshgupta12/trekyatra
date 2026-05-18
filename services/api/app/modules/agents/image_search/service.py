"""Image search service — Step 45: Image Gathering Agent.

Tries image sources in priority order:
  1. Unsplash (UNSPLASH_ACCESS_KEY) — high quality, attribution required
  2. Pixabay (PIXABAY_API_KEY) — free, good quality
  3. Wikimedia Commons — free, no attribution, no API key needed

All sources are optional and fail gracefully.
Returns None when no suitable image is found.
"""
from __future__ import annotations

import re
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_TIMEOUT = 8.0  # seconds per API call
_MIN_WIDTH = 800  # minimum image width in pixels


def _slug_to_search_terms(trek_name: str, region: str) -> list[str]:
    """Generate search queries in order of specificity."""
    clean = trek_name.replace("Trek", "").replace("trek", "").strip()
    return [
        f"{trek_name} India",
        f"{clean} {region} trek",
        f"{region} Himalaya trekking",
        f"India trekking mountain",
    ]


# ---------------------------------------------------------------------------
# Unsplash
# ---------------------------------------------------------------------------

def _search_unsplash(query: str) -> str | None:
    """Search Unsplash. Requires UNSPLASH_ACCESS_KEY env var."""
    key = settings.unsplash_access_key
    if not key:
        return None
    try:
        r = httpx.get(
            "https://api.unsplash.com/photos/random",
            params={"query": query, "orientation": "landscape", "count": 1},
            headers={"Authorization": f"Client-ID {key}"},
            timeout=_TIMEOUT,
        )
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and data:
                item = data[0]
                width = item.get("width", 0)
                if width >= _MIN_WIDTH:
                    url = item.get("urls", {}).get("regular", "")
                    return url or None
    except Exception as exc:
        logger.debug("Unsplash search failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# Pixabay
# ---------------------------------------------------------------------------

def _search_pixabay(query: str) -> str | None:
    """Search Pixabay. Requires PIXABAY_API_KEY env var."""
    key = settings.pixabay_api_key
    if not key:
        return None
    try:
        r = httpx.get(
            "https://pixabay.com/api/",
            params={
                "key": key,
                "q": query,
                "image_type": "photo",
                "orientation": "horizontal",
                "min_width": _MIN_WIDTH,
                "per_page": 3,
                "safesearch": "true",
            },
            timeout=_TIMEOUT,
        )
        if r.status_code == 200:
            hits = r.json().get("hits", [])
            for hit in hits:
                url = hit.get("webformatURL", "")
                if url and hit.get("webformatWidth", 0) >= _MIN_WIDTH:
                    return url.replace("_640.", "_1280.")  # request larger size
    except Exception as exc:
        logger.debug("Pixabay search failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# Wikimedia Commons (no API key required)
# ---------------------------------------------------------------------------

def _search_wikimedia(query: str) -> str | None:
    """Search Wikimedia Commons for freely licensed landscape photos."""
    try:
        # Step 1: search for relevant image files
        search_res = httpx.get(
            "https://commons.wikimedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": f"{query} filetype:jpg",
                "srnamespace": "6",  # File namespace
                "srlimit": "5",
                "format": "json",
            },
            timeout=_TIMEOUT,
        )
        if search_res.status_code != 200:
            return None

        results = search_res.json().get("query", {}).get("search", [])
        for result in results:
            title = result.get("title", "")
            if not title.startswith("File:"):
                continue

            # Step 2: get image info (URL, dimensions)
            info_res = httpx.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "titles": title,
                    "prop": "imageinfo",
                    "iiprop": "url|size",
                    "iiurlwidth": "1200",
                    "format": "json",
                },
                timeout=_TIMEOUT,
            )
            if info_res.status_code != 200:
                continue

            pages = info_res.json().get("query", {}).get("pages", {})
            for page in pages.values():
                ii = page.get("imageinfo", [{}])[0]
                width = ii.get("thumbwidth", ii.get("width", 0))
                url = ii.get("thumburl", ii.get("url", ""))
                # Only use landscape photos of sufficient width
                if url and width >= _MIN_WIDTH:
                    # Skip SVG and non-photo formats
                    if re.search(r"\.(jpg|jpeg|png|webp)", url, re.I):
                        return url

    except Exception as exc:
        logger.debug("Wikimedia search failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def find_trek_image(trek_name: str, region: str = "") -> tuple[str, str] | tuple[None, None]:
    """Find the best available image for a trek.

    Returns (image_url, source_name) or (None, None) when nothing is found.
    Tries sources in priority order: Unsplash → Pixabay → Wikimedia Commons.
    """
    search_queries = _slug_to_search_terms(trek_name, region)

    for query in search_queries:
        # Unsplash — highest quality
        url = _search_unsplash(query)
        if url:
            logger.info("Image found via Unsplash for '%s': %s", trek_name, url[:80])
            return url, "unsplash"

        # Pixabay — good quality, free
        url = _search_pixabay(query)
        if url:
            logger.info("Image found via Pixabay for '%s': %s", trek_name, url[:80])
            return url, "pixabay"

        # Wikimedia Commons — no key, but more specific results
        url = _search_wikimedia(query)
        if url:
            logger.info("Image found via Wikimedia for '%s': %s", trek_name, url[:80])
            return url, "wikimedia"

    logger.info("No suitable image found for trek '%s'", trek_name)
    return None, None
