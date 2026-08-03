"""Sitemap data endpoints — the international-region substring match (mount-everest was missing)."""
from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage

client = TestClient(app)


def test_sitemap_treks_state_substring_matches_composite_region():
    """A per-region sitemap ("Nepal"/"Tibet") must include treks whose trek_state is a composite
    international value; Indian-state sitemaps are unaffected (nothing else contains "Himachal")."""
    with SessionLocal() as db:
        db.execute(delete(CMSPage).where(CMSPage.slug.in_(["mount-everest-sm", "triund-sm"])))
        db.add(CMSPage(
            slug="mount-everest-sm", page_type="trek_guide", title="Everest", status="published",
            content_html="<p>x</p>", trek_state="Koshi Province, Nepal / Tibet, China",
        ))
        db.add(CMSPage(
            slug="triund-sm", page_type="trek_guide", title="Triund", status="published",
            content_html="<p>x</p>", trek_state="Himachal Pradesh",
        ))
        db.commit()

    def slugs(state: str) -> set[str]:
        r = client.get(f"/api/v1/public/sitemap-treks?state={state}&limit=1000")
        assert r.status_code == 200
        return {row["slug"] for row in r.json()}

    nepal, tibet, himachal = slugs("Nepal"), slugs("Tibet"), slugs("Himachal Pradesh")
    assert "mount-everest-sm" in nepal and "triund-sm" not in nepal
    assert "mount-everest-sm" in tibet
    assert "triund-sm" in himachal and "mount-everest-sm" not in himachal
