"""Step 30 — Dynamic Destination Hubs: SeasonalContentAgent + hubs API tests."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.modules.cms.models import CMSPage
from app.modules.agents.seasonal_content.agent import SeasonalContentAgent, SEASON_META

client = TestClient(app)

# ── Helpers ─────────────────────────────────────────────────────────────────

def _make_hub_page(
    db: Session,
    *,
    page_type: str = "seasonal_hub",
    slug: str | None = None,
) -> CMSPage:
    from datetime import datetime, timezone
    slug = slug or f"{page_type}/test-{uuid.uuid4().hex[:6]}"
    page = CMSPage(
        id=uuid.uuid4(),
        slug=slug,
        page_type=page_type,
        title=f"Test {page_type} page",
        content_html="<p>Test content</p>",
        content_json=None,
        status="published",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(page)
    db.commit()
    return page


# ── TC-B01: SEASON_META contains all 4 seasons ──────────────────────────────

def test_season_meta_has_all_slugs():
    assert set(SEASON_META.keys()) == {"winter", "summer", "monsoon", "spring"}
    for meta in SEASON_META.values():
        assert "title" in meta
        assert "months" in meta


# ── TC-B02: SeasonalContentAgent rejects unknown season ─────────────────────

def test_seasonal_agent_unknown_season():
    with SessionLocal() as db:
        agent = SeasonalContentAgent(db=db, season_slug="rainy-season")
        result = agent.run(input_data={"season_slug": "rainy-season"})
        assert result.get("errors")
        assert "Unknown season slug" in result["errors"][0]


# ── TC-B03: SeasonalContentAgent generates and stores page (mocked LLM) ─────

def test_seasonal_agent_creates_cms_page():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=(
        "## Why Trek in Winter?\nGreat snow treks await.\n\n"
        "## Top Treks\nKedarkantha is ideal.\n\n"
        "## What to Pack\nLayered insulation.\n\n"
        "## Safety Tips\nWatch for AMS.\n\n"
        "## FAQ\n**Q:** Is winter safe?\n**A:** Yes if prepared.\n\n"
        "This article contains affiliate links."
    ))]
    slug = f"seasons/winter-test-{uuid.uuid4().hex[:6]}"
    with SessionLocal() as db:
        # Create agent with a unique slug by patching season slug
        with patch.object(
            SeasonalContentAgent, "_generate_content", wraps=None
        ) as mock_gen:
            def _fake_gen(state):
                state["output"]["markdown"] = mock_response.content[0].text
                return state
            mock_gen.side_effect = _fake_gen

            agent = SeasonalContentAgent(db=db, season_slug="winter")
            # Override slug to avoid clash
            result = agent.run(input_data={"season_slug": "winter"})

        assert not result.get("errors"), result.get("errors")
        page_id = result.get("output", {}).get("page_id")
        assert page_id is not None

        page = db.get(CMSPage, uuid.UUID(page_id))
        assert page is not None
        assert page.page_type == "seasonal_hub"
        assert page.status == "published"
        db.delete(page)
        db.commit()


# ── TC-B04: List hubs endpoint returns only hub page types ──────────────────

def test_api_list_hubs_empty():
    resp = client.get("/api/v1/admin/hubs")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    # All returned pages must be hub types
    hub_types = {"seasonal_hub", "cluster_hub", "regional_hub"}
    for item in data:
        assert item["page_type"] in hub_types


# ── TC-B05: List hubs filtered by hub_type ──────────────────────────────────

def test_api_list_hubs_filtered_by_type():
    with SessionLocal() as db:
        page = _make_hub_page(db, page_type="cluster_hub", slug=f"trek-types/test-{uuid.uuid4().hex[:6]}")
        try:
            resp = client.get("/api/v1/admin/hubs?hub_type=cluster_hub")
            assert resp.status_code == 200
            data = resp.json()
            ids = [item["id"] for item in data]
            assert str(page.id) in ids
        finally:
            db.refresh(page)
            db.delete(page)
            db.commit()


# ── TC-B06: List hubs with invalid hub_type returns 422 ─────────────────────

def test_api_list_hubs_invalid_type():
    resp = client.get("/api/v1/admin/hubs?hub_type=unknown_type")
    assert resp.status_code == 422


# ── TC-B07: Regenerate seasonal hub — mocked LLM success ────────────────────

def test_api_regenerate_seasonal_hub():
    mock_resp = MagicMock()
    mock_resp.content = [MagicMock(text=(
        "## Why Trek in Monsoon?\nThe Sahyadris transform.\n\n"
        "## Top Treks\nHarishchandragad.\n\n"
        "## What to Pack\nRainproof gear.\n\n"
        "## Safety Tips\nSlippery rocks.\n\n"
        "## FAQ\n**Q:** Safe in rain?\n**A:** With care.\n\n"
        "This article contains affiliate links."
    ))]
    season = "monsoon"
    slug = f"seasons/{season}"

    with patch(
        "app.modules.agents.seasonal_content.agent.get_anthropic_client"
    ) as mock_client:
        mock_client.return_value.messages.create.return_value = mock_resp
        resp = client.post(f"/api/v1/admin/hubs/{slug}/regenerate", json={})

    assert resp.status_code == 200
    data = resp.json()
    assert data["hub_type"] == "seasonal_hub"
    assert "page_id" in data

    # Clean up generated page
    with SessionLocal() as db:
        page = db.scalar(
            __import__("sqlalchemy", fromlist=["select"]).select(CMSPage).where(CMSPage.slug == slug)
        )
        if page:
            db.delete(page)
            db.commit()


# ── TC-B08: Regenerate non-seasonal hub returns 501 ─────────────────────────

def test_api_regenerate_cluster_hub_returns_501():
    with SessionLocal() as db:
        page = _make_hub_page(db, page_type="cluster_hub", slug=f"trek-types/t501-{uuid.uuid4().hex[:6]}")
        try:
            resp = client.post(f"/api/v1/admin/hubs/{page.slug}/regenerate", json={})
            assert resp.status_code == 501
        finally:
            db.refresh(page)
            db.delete(page)
            db.commit()


# ── TC-B09: Regenerate with invalid season slug returns 422 ─────────────────

def test_api_regenerate_invalid_season():
    resp = client.post("/api/v1/admin/hubs/seasons/blizzard/regenerate", json={})
    assert resp.status_code == 422
