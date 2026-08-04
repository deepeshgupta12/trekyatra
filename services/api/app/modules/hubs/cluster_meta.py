"""Canonical CLUSTER (Trek Category) → trek matching.

Rule (decided 2026-08-04): prefer `cluster_id` FK membership (trek_guide.cluster_id == the hub's
cluster_id), then fall back to `trek_themes` keyword match for treks not yet linked to the cluster.
Used by the `/treks/by-cluster` endpoint that powers the `/trek-types/[slug]` hub trek grid + schema.
"""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage


def treks_in_cluster(
    db: Session,
    *,
    cluster_id: str | None = None,
    theme: str | None = None,
    limit: int = 12,
) -> list[CMSPage]:
    """Published trek guides belonging to a cluster.

    cluster_id members first; then theme matches (trek_themes contains `theme`, case-insensitive)
    that aren't already included — so a lightly-clustered category still shows relevant treks.
    """
    ordered: list[CMSPage] = []
    seen: set[str] = set()

    if cluster_id:
        try:
            cid = uuid.UUID(cluster_id)
        except (ValueError, AttributeError):
            cid = None
        if cid is not None:
            rows = db.scalars(
                select(CMSPage)
                .where(CMSPage.page_type == "trek_guide")
                .where(CMSPage.status == "published")
                .where(CMSPage.cluster_id == cid)
                .order_by(CMSPage.updated_at.desc())
            ).all()
            for p in rows:
                if p.slug not in seen:
                    ordered.append(p)
                    seen.add(p.slug)

    if theme and len(ordered) < limit:
        needle = theme.strip().lower()
        if needle:
            rows = db.scalars(
                select(CMSPage)
                .where(CMSPage.page_type == "trek_guide")
                .where(CMSPage.status == "published")
                .where(CMSPage.trek_themes.isnot(None))
                .order_by(CMSPage.updated_at.desc())
            ).all()
            for p in rows:
                if p.slug in seen:
                    continue
                themes = [str(t).lower() for t in (p.trek_themes or [])]
                if any(needle in t or t in needle for t in themes):
                    ordered.append(p)
                    seen.add(p.slug)

    return ordered[:limit]
