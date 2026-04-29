from __future__ import annotations

import uuid
from datetime import datetime, timezone
from itertools import combinations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cannibalization.models import CannibalizationIssue
from app.modules.content.models import KeywordCluster
from app.modules.linking.models import Page


def _keyword_set(cluster: KeywordCluster) -> set[str]:
    """Return lowercased full keyword set for a cluster."""
    kws = {cluster.primary_keyword.lower()}
    for kw in cluster.supporting_keywords or []:
        kws.add(str(kw).lower())
    return kws


def _severity(shared: set[str], same_primary: bool) -> str:
    if same_primary or len(shared) >= 5:
        return "high"
    if len(shared) >= 3:
        return "medium"
    return "low"


def _recommendation(severity: str, same_primary: bool) -> str:
    if same_primary or severity == "high":
        return "merge"
    if severity == "medium":
        return "redirect"
    return "differentiate"


def detect_cannibalization(db: Session) -> tuple[int, int]:
    """Scan all pages with clusters for keyword overlap. Returns (issues_found, new_issues)."""
    pages = (
        db.execute(select(Page).where(Page.cluster_id.isnot(None)))
        .scalars()
        .all()
    )

    cluster_ids = list({p.cluster_id for p in pages})
    clusters = {
        c.id: c
        for c in db.execute(select(KeywordCluster).where(KeywordCluster.id.in_(cluster_ids))).scalars().all()
    }

    page_keywords: dict[uuid.UUID, set[str]] = {}
    for page in pages:
        cluster = clusters.get(page.cluster_id)
        if cluster:
            page_keywords[page.id] = _keyword_set(cluster)

    page_list = [p for p in pages if p.id in page_keywords]

    issues_found = 0
    new_issues = 0
    now = datetime.now(timezone.utc)

    for pa, pb in combinations(page_list, 2):
        shared = page_keywords[pa.id] & page_keywords[pb.id]
        if len(shared) < 2:
            continue

        issues_found += 1
        same_primary = clusters[pa.cluster_id].primary_keyword.lower() == clusters[pb.cluster_id].primary_keyword.lower()
        sev = _severity(shared, same_primary)
        rec = _recommendation(sev, same_primary)

        # Ensure deterministic ordering so (a,b) and (b,a) don't create duplicates.
        a_id, b_id = (pa.id, pb.id) if str(pa.id) < str(pb.id) else (pb.id, pa.id)

        existing = db.execute(
            select(CannibalizationIssue).where(
                CannibalizationIssue.page_a_id == a_id,
                CannibalizationIssue.page_b_id == b_id,
            )
        ).scalar_one_or_none()

        if existing is None:
            issue = CannibalizationIssue(
                id=uuid.uuid4(),
                page_a_id=a_id,
                page_b_id=b_id,
                shared_keywords=sorted(shared),
                severity=sev,
                recommendation=rec,
                status="open",
                created_at=now,
            )
            db.add(issue)
            new_issues += 1
        else:
            # Refresh severity/recommendation if keyword overlap changed.
            existing.shared_keywords = sorted(shared)
            existing.severity = sev
            existing.recommendation = rec

    db.commit()
    return issues_found, new_issues


def get_issues(
    db: Session,
    *,
    severity: str | None = None,
    status: str | None = None,
    limit: int = 100,
) -> list[CannibalizationIssue]:
    q = select(CannibalizationIssue)
    if severity:
        q = q.where(CannibalizationIssue.severity == severity)
    if status:
        q = q.where(CannibalizationIssue.status == status)
    q = q.order_by(CannibalizationIssue.created_at.desc()).limit(limit)
    return db.execute(q).scalars().all()


def resolve_issue(db: Session, issue_id: uuid.UUID, new_status: str) -> CannibalizationIssue | None:
    issue = db.get(CannibalizationIssue, issue_id)
    if issue is None:
        return None
    issue.status = new_status
    if new_status in ("dismissed", "resolved"):
        issue.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(issue)
    return issue


def get_issue(db: Session, issue_id: uuid.UUID) -> CannibalizationIssue | None:
    return db.get(CannibalizationIssue, issue_id)
