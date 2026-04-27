from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Page(Base):
    """Content graph index entry. Synced from cms_pages on publish and via daily beat task."""

    __tablename__ = "pages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    page_type: Mapped[str] = mapped_column(String(64), nullable=False, default="trek_guide")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    indexed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    cms_page_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("cms_pages.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    cluster_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("keyword_clusters.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    outbound_links: Mapped[list["PageLink"]] = relationship(
        "PageLink",
        foreign_keys="PageLink.from_page_id",
        back_populates="from_page",
        cascade="all, delete-orphan",
    )
    inbound_links: Mapped[list["PageLink"]] = relationship(
        "PageLink",
        foreign_keys="PageLink.to_page_id",
        back_populates="to_page",
        cascade="all, delete-orphan",
    )


class PageLink(Base):
    """A directional link between two pages — either editorial (human-added) or suggested."""

    __tablename__ = "page_links"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    anchor_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    link_type: Mapped[str] = mapped_column(String(32), nullable=False, default="suggested")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    from_page_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    to_page_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("pages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    from_page: Mapped["Page"] = relationship("Page", foreign_keys=[from_page_id], back_populates="outbound_links")
    to_page: Mapped["Page"] = relationship("Page", foreign_keys=[to_page_id], back_populates="inbound_links")
