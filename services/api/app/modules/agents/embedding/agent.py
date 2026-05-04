"""EmbeddingAgent: generates and stores a 1536-dim OpenAI embedding for a CMSPage."""
from __future__ import annotations

import re
import uuid

import openai as _openai
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.modules.cms.models import CMSPage


def _build_embed_text(page: CMSPage) -> str:
    parts = [page.title]
    if page.seo_description:
        parts.append(page.seo_description)
    if page.content_html:
        clean = re.sub(r"<[^>]+>", " ", page.content_html)
        clean = re.sub(r"\s+", " ", clean).strip()
        parts.append(clean[:4000])
    return " ".join(parts)


def generate_embedding(text: str) -> list[float] | None:
    """Call OpenAI text-embedding-3-small. Returns None if key not set."""
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    client = _openai.OpenAI(api_key=settings.openai_api_key)
    response = client.embeddings.create(model="text-embedding-3-small", input=text)
    return response.data[0].embedding


def embed_page(db: Session, page_id: uuid.UUID) -> bool:
    """Generate and store embedding for a CMS page. Returns True if stored, False otherwise."""
    page = db.scalar(select(CMSPage).where(CMSPage.id == page_id))
    if page is None:
        return False
    text = _build_embed_text(page)
    try:
        embedding = generate_embedding(text)
    except Exception:
        return False
    if embedding is None:
        return False
    page.embedding = embedding
    db.flush()
    return True
