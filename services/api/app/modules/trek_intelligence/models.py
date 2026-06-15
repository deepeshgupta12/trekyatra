from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, UUIDPrimaryKeyMixin


class AIInteractionLog(UUIDPrimaryKeyMixin, Base):
    """Step 72: lightweight log of AI/MCP tool usage across web/mobile/chatgpt/claude.

    No raw PII — query/result text is pre-truncated by the caller.
    """

    __tablename__ = "ai_interaction_logs"

    source: Mapped[str] = mapped_column(String(20), nullable=False)
    tool_name: Mapped[str] = mapped_column(String(100), nullable=False)
    query_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    page_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    trek_slugs: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class TrekQACache(UUIDPrimaryKeyMixin, Base):
    """Step 72: DB-backed cache for Trek Detail Q&A and compare trade-off summaries.

    cache_key is a hash of trek_slug(s) + normalized question/type, so repeat
    queries cost zero additional LLM tokens.
    """

    __tablename__ = "trek_qa_cache"

    cache_key: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
