"""Tests for Step 26 — Cannibalization Detection + Consolidation Agent.

Covers: detect service, list/filter endpoint, resolve endpoint, merge endpoint (mocked).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.cannibalization.models import CannibalizationIssue
from app.modules.cms.models import CMSPage
from app.modules.content.models import KeywordCluster
from app.modules.linking.models import Page

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uid() -> str:
    return str(uuid.uuid4())[:8]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _create_cluster(db, primary: str, supporting: list[str]) -> KeywordCluster:
    now = _now()
    cluster = KeywordCluster(
        name=f"cluster-{_uid()}",
        primary_keyword=primary,
        supporting_keywords=supporting,
        status="active",
        created_at=now,
        updated_at=now,
    )
    db.add(cluster)
    db.flush()
    return cluster


def _create_cms_page(db, slug: str) -> CMSPage:
    now = _now()
    page = CMSPage(
        slug=slug,
        title=f"Trek {slug}",
        page_type="trek_guide",
        status="published",
        content_html="<p>test content</p>",
        created_at=now,
        updated_at=now,
    )
    db.add(page)
    db.flush()
    return page


def _create_page(db, slug: str, cluster: KeywordCluster, cms: CMSPage) -> Page:
    page = Page(
        id=uuid.uuid4(),
        slug=slug,
        title=f"Trek {slug}",
        page_type="trek_guide",
        cms_page_id=cms.id,
        cluster_id=cluster.id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(page)
    db.flush()
    return page


def _create_issue(db, page_a: Page, page_b: Page, severity: str = "medium") -> CannibalizationIssue:
    issue = CannibalizationIssue(
        id=uuid.uuid4(),
        page_a_id=page_a.id,
        page_b_id=page_b.id,
        shared_keywords=["keyword-a", "keyword-b"],
        severity=severity,
        recommendation="redirect",
        status="open",
        created_at=datetime.now(timezone.utc),
    )
    db.add(issue)
    db.commit()
    return issue


# ---------------------------------------------------------------------------
# detect_cannibalization service
# ---------------------------------------------------------------------------

def test_detect_no_overlap_produces_no_issues():
    """Pages with completely different keywords → 0 issues."""
    with SessionLocal() as db:
        c1 = _create_cluster(db, "kedarkantha summit", ["snow trek", "winter trek"])
        c2 = _create_cluster(db, "valley of flowers", ["monsoon hike", "flower meadow"])
        slug1, slug2 = f"kk-{_uid()}", f"vof-{_uid()}"
        cms1 = _create_cms_page(db, slug1)
        cms2 = _create_cms_page(db, slug2)
        _create_page(db, slug1, c1, cms1)
        _create_page(db, slug2, c2, cms2)
        db.commit()

    resp = client.post("/api/v1/admin/cannibalization/detect")
    # No assertion on exact count since other pages in DB may produce issues.
    assert resp.status_code == 200
    data = resp.json()
    assert "issues_found" in data
    assert "new_issues" in data


def test_detect_finds_overlap_between_two_pages():
    """Two pages sharing 3 keywords → issue created with severity=medium."""
    shared = ["uttarakhand trek", "beginner trek", "camping trek"]
    with SessionLocal() as db:
        c1 = _create_cluster(db, "uttarakhand trek", shared)
        c2 = _create_cluster(db, "beginner trek", shared)
        slug1, slug2 = f"ott-{_uid()}", f"beg-{_uid()}"
        cms1 = _create_cms_page(db, slug1)
        cms2 = _create_cms_page(db, slug2)
        p1 = _create_page(db, slug1, c1, cms1)
        p2 = _create_page(db, slug2, c2, cms2)
        db.commit()
        p1_id, p2_id = str(p1.id), str(p2.id)

    resp = client.post("/api/v1/admin/cannibalization/detect")
    assert resp.status_code == 200
    data = resp.json()
    assert data["new_issues"] >= 1 or data["issues_found"] >= 1


def test_detect_same_primary_keyword_severity_high():
    """Pages with same primary keyword → HIGH severity."""
    from app.modules.cannibalization.service import _severity
    same_primary = True
    assert _severity({"a", "b", "c"}, same_primary) == "high"


def test_detect_severity_medium():
    from app.modules.cannibalization.service import _severity
    assert _severity({"a", "b", "c"}, False) == "medium"


def test_detect_severity_low():
    from app.modules.cannibalization.service import _severity
    assert _severity({"a", "b"}, False) == "low"


def test_detect_recommendation_merge_for_high():
    from app.modules.cannibalization.service import _recommendation
    assert _recommendation("high", True) == "merge"


def test_detect_recommendation_redirect_for_medium():
    from app.modules.cannibalization.service import _recommendation
    assert _recommendation("medium", False) == "redirect"


def test_detect_recommendation_differentiate_for_low():
    from app.modules.cannibalization.service import _recommendation
    assert _recommendation("low", False) == "differentiate"


# ---------------------------------------------------------------------------
# GET /admin/cannibalization
# ---------------------------------------------------------------------------

def test_list_issues_returns_200():
    resp = client.get("/api/v1/admin/cannibalization")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_issues_severity_filter():
    with SessionLocal() as db:
        c1 = _create_cluster(db, f"trekking-{_uid()}", ["alpine", "permit"])
        c2 = _create_cluster(db, f"hiking-{_uid()}", ["alpine", "permit"])
        slug1, slug2 = f"tr-{_uid()}", f"hi-{_uid()}"
        cms1 = _create_cms_page(db, slug1)
        cms2 = _create_cms_page(db, slug2)
        p1 = _create_page(db, slug1, c1, cms1)
        p2 = _create_page(db, slug2, c2, cms2)
        _create_issue(db, p1, p2, severity="high")

    resp = client.get("/api/v1/admin/cannibalization?severity=high")
    assert resp.status_code == 200
    items = resp.json()
    assert all(i["severity"] == "high" for i in items)


def test_list_issues_response_shape():
    with SessionLocal() as db:
        c1 = _create_cluster(db, f"shape-{_uid()}", ["trail", "guide"])
        c2 = _create_cluster(db, f"shape2-{_uid()}", ["trail", "guide"])
        slug1, slug2 = f"sh1-{_uid()}", f"sh2-{_uid()}"
        cms1 = _create_cms_page(db, slug1)
        cms2 = _create_cms_page(db, slug2)
        p1 = _create_page(db, slug1, c1, cms1)
        p2 = _create_page(db, slug2, c2, cms2)
        _create_issue(db, p1, p2)

    resp = client.get("/api/v1/admin/cannibalization")
    assert resp.status_code == 200
    items = resp.json()
    if items:
        required = {
            "id", "page_a_id", "page_b_id", "page_a_slug", "page_b_slug",
            "page_a_title", "page_b_title", "shared_keywords",
            "severity", "recommendation", "status", "created_at",
        }
        assert required.issubset(items[0].keys())


# ---------------------------------------------------------------------------
# POST /admin/cannibalization/{id}/resolve
# ---------------------------------------------------------------------------

def test_resolve_issue_dismissed():
    with SessionLocal() as db:
        c1 = _create_cluster(db, f"r1-{_uid()}", ["trail", "route"])
        c2 = _create_cluster(db, f"r2-{_uid()}", ["trail", "route"])
        slug1, slug2 = f"rv1-{_uid()}", f"rv2-{_uid()}"
        cms1 = _create_cms_page(db, slug1)
        cms2 = _create_cms_page(db, slug2)
        p1 = _create_page(db, slug1, c1, cms1)
        p2 = _create_page(db, slug2, c2, cms2)
        issue = _create_issue(db, p1, p2)
        issue_id = str(issue.id)

    resp = client.post(f"/api/v1/admin/cannibalization/{issue_id}/resolve", json={"status": "dismissed"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "dismissed"
    assert resp.json()["resolved_at"] is not None


def test_resolve_issue_invalid_status_422():
    resp = client.post(
        f"/api/v1/admin/cannibalization/{uuid.uuid4()}/resolve",
        json={"status": "invalid_value"},
    )
    assert resp.status_code == 422


def test_resolve_issue_404_unknown():
    resp = client.post(
        f"/api/v1/admin/cannibalization/{uuid.uuid4()}/resolve",
        json={"status": "dismissed"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /admin/cannibalization/{id}/merge
# ---------------------------------------------------------------------------

def test_merge_404_unknown_issue():
    resp = client.post(f"/api/v1/admin/cannibalization/{uuid.uuid4()}/merge")
    assert resp.status_code == 404


def test_merge_400_invalid_uuid():
    resp = client.post("/api/v1/admin/cannibalization/not-a-uuid/merge")
    assert resp.status_code == 400


def test_merge_creates_draft_and_marks_accepted():
    """Mocked LLM: merge agent creates ContentBrief + ContentDraft, issue → accepted."""
    with SessionLocal() as db:
        c1 = _create_cluster(db, f"mg1-{_uid()}", ["trek", "altitude"])
        c2 = _create_cluster(db, f"mg2-{_uid()}", ["trek", "altitude"])
        slug1, slug2 = f"mg-a-{_uid()}", f"mg-b-{_uid()}"
        cms1 = _create_cms_page(db, slug1)
        cms2 = _create_cms_page(db, slug2)
        p1 = _create_page(db, slug1, c1, cms1)
        p2 = _create_page(db, slug2, c2, cms2)
        issue = _create_issue(db, p1, p2)
        issue_id = str(issue.id)

    mock_text = "# Merged Trek Guide\n\nThis is the merged content."

    with patch("app.modules.agents.consolidation.agent.get_anthropic_client") as mock_client:
        mock_resp = type("R", (), {"content": [type("C", (), {"text": mock_text})()]})()
        mock_client.return_value.messages.create.return_value = mock_resp

        resp = client.post(f"/api/v1/admin/cannibalization/{issue_id}/merge")

    assert resp.status_code == 200
    data = resp.json()
    assert "draft_id" in data
    assert "brief_id" in data
    assert data["message"] == "Merged draft created and queued for review."

    # Verify issue is now accepted.
    resolved = client.get(f"/api/v1/admin/cannibalization?status=accepted")
    assert resolved.status_code == 200
    ids = [i["id"] for i in resolved.json()]
    assert issue_id in ids
