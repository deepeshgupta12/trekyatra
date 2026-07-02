from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

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


class TreksageChatSession(UUIDPrimaryKeyMixin, Base):
    """Step 73: persisted conversation session for the /treksage chat page."""

    __tablename__ = "treksage_chat_sessions"

    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    anonymous_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    session_key: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    messages: Mapped[list["TreksageChatMessage"]] = relationship("TreksageChatMessage", back_populates="session", order_by="TreksageChatMessage.created_at")


class TreksageChatMessage(UUIDPrimaryKeyMixin, Base):
    """Step 73: one turn in a /treksage conversation — persists tool calls for analytics."""

    __tablename__ = "treksage_chat_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("treksage_chat_sessions.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_calls_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    session: Mapped["TreksageChatSession"] = relationship("TreksageChatSession", back_populates="messages")
