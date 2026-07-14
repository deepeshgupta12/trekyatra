from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class TrekComparison(Base):
    """A curated trek-vs-trek comparison PAIR (not a CMS page).

    The comparison agent upserts one row per suitable pair on trek publish. The
    clean page at /compare/{pair_slug} renders live from the two trek_guide CMS
    pages' backfill fields — no page_type="comparison" CMS row is created. This
    table only records which pairs exist, to drive the sitemap + home section.
    """

    __tablename__ = "trek_comparisons"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Canonical: slug_a < slug_b (alphabetical), pair_slug = "{slug_a}-vs-{slug_b}".
    pair_slug: Mapped[str] = mapped_column(String(511), nullable=False, unique=True, index=True)
    slug_a: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug_b: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # State the pair belongs to (both treks share it) — for home grouping / filters.
    state: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
