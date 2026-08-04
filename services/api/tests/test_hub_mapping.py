"""Canonical season + cluster trek mapping — backfill-first season, cluster_id + themes fallback."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.main import app
from app.db.session import SessionLocal
from app.modules.cms.models import CMSPage

client = TestClient(app)


def _seed(db, *, slug, best_months=None, season=None, cluster_id=None, themes=None):
    db.execute(delete(CMSPage).where(CMSPage.slug == slug))
    db.add(CMSPage(
        id=uuid.uuid4(), slug=slug, page_type="trek_guide", title=f"{slug} Trek",
        trek_name=f"{slug} Trek", status="published", content_html="<p>x</p>",
        trek_best_months=best_months, trek_season=season, cluster_id=cluster_id, trek_themes=themes,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    ))
    db.commit()


# ── Season: backfill month arrays win, canonical 5-season windows ───────────
def test_seasonal_by_season_uses_backfill_months():
    with SessionLocal() as db:
        _seed(db, slug="winter-map-trek", best_months=[1, 2])   # Jan/Feb → winter
        _seed(db, slug="summer-map-trek", best_months=[5, 6])   # May/Jun → summer

    winter = {t["slug"] for t in client.get("/api/v1/treks/seasonal?season=winter&limit=50").json()}
    summer = {t["slug"] for t in client.get("/api/v1/treks/seasonal?season=summer&limit=50").json()}
    assert "winter-map-trek" in winter and "winter-map-trek" not in summer
    assert "summer-map-trek" in summer and "summer-map-trek" not in winter


def test_seasonal_falls_back_to_season_string():
    with SessionLocal() as db:
        _seed(db, slug="string-season-trek", best_months=None, season="Oct – Nov")  # autumn
    autumn = {t["slug"] for t in client.get("/api/v1/treks/seasonal?season=autumn&limit=50").json()}
    assert "string-season-trek" in autumn


def test_seasonal_invalid_season_422():
    assert client.get("/api/v1/treks/seasonal?season=blizzard").status_code == 422


# ── Cluster: cluster_id membership first, then trek_themes fallback ─────────
def test_by_cluster_membership_and_theme_fallback():
    cid = uuid.uuid4()
    with SessionLocal() as db:
        # cluster_id has a FK to keyword_clusters — seed the parent row via the ORM (applies the
        # status="draft" default) so the FK holds.
        from app.modules.content.models import KeywordCluster
        db.execute(delete(CMSPage).where(CMSPage.slug.in_(["clustered-trek", "themed-trek"])))
        db.add(KeywordCluster(
            id=cid, name=f"cluster-{cid.hex[:6]}", primary_keyword="lake treks",
            created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
        ))
        db.commit()
        _seed(db, slug="clustered-trek", cluster_id=cid)
        _seed(db, slug="themed-trek", themes=["High Altitude Lake", "Alpine"])

    by_id = {t["slug"] for t in client.get(f"/api/v1/treks/by-cluster?cluster_id={cid}&limit=50").json()}
    assert "clustered-trek" in by_id

    with_theme = {t["slug"] for t in client.get(f"/api/v1/treks/by-cluster?cluster_id={cid}&theme=lake&limit=50").json()}
    assert "clustered-trek" in with_theme and "themed-trek" in with_theme


def test_by_cluster_empty_without_params():
    assert client.get("/api/v1/treks/by-cluster").json() == []
