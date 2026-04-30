from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.compliance.models import ComplianceRule
from app.modules.content.models import ContentDraft

DEFAULT_RULES = [
    {
        "name": "affiliate_disclosure",
        "rule_type": "affiliate_disclosure",
        "description": "Page must contain affiliate disclosure text if it has monetization content.",
        "rule_config": {
            "required_phrases": [
                "affiliate", "commission", "paid partnership",
                "sponsored", "disclosure", "this post contains affiliate"
            ]
        },
    },
    {
        "name": "safety_disclaimer",
        "rule_type": "safety_disclaimer",
        "description": "Difficult or technical treks must include a safety disclaimer section.",
        "rule_config": {
            "difficulty_triggers": ["difficult", "technical", "expert", "hard"],
            "required_phrases": [
                "safety", "caution", "warning", "disclaimer",
                "experienced guide", "altitude sickness", "acclimatize", "emergency"
            ],
        },
    },
    {
        "name": "risky_wording",
        "rule_type": "risky_wording",
        "description": "Detect phrases that make absolute guarantees about safety, weather, or route access.",
        "rule_config": {},
    },
    {
        "name": "ymyl_claim_review",
        "rule_type": "ymyl_claim",
        "description": "Drafts with unverified YMYL claims (permits, costs, altitudes) must be fact-checked first.",
        "rule_config": {"max_unhedged_ymyl_claims": 0},
    },
]


def seed_default_rules(db: Session) -> int:
    """Insert default compliance rules if the table is empty. Returns count seeded."""
    existing = db.scalar(select(ComplianceRule).limit(1))
    if existing is not None:
        return 0
    seeded = 0
    for r in DEFAULT_RULES:
        rule = ComplianceRule(
            id=uuid.uuid4(),
            name=r["name"],
            rule_type=r["rule_type"],
            description=r["description"],
            rule_config=r["rule_config"],
            is_active=True,
        )
        db.add(rule)
        seeded += 1
    db.commit()
    return seeded


def list_rules(db: Session) -> list[ComplianceRule]:
    return list(db.scalars(select(ComplianceRule).order_by(ComplianceRule.created_at)).all())


def run_compliance_check(db: Session, draft_id: uuid.UUID) -> dict:
    from app.modules.agents.compliance.agent import ComplianceGuardAgent

    # Seed default rules on first use
    seed_default_rules(db)

    agent = ComplianceGuardAgent(db=db, draft_id=draft_id)
    result = agent.run(input_data={"draft_id": str(draft_id)})
    return result


def override_compliance(
    db: Session,
    *,
    draft_id: uuid.UUID,
    override_note: str,
    admin_email: str,
) -> ContentDraft:
    draft = db.scalar(select(ContentDraft).where(ContentDraft.id == draft_id))
    if draft is None:
        raise ValueError(f"Draft {draft_id} not found.")

    draft.compliance_status = "overridden"
    draft.compliance_override_note = override_note
    draft.compliance_overridden_by = admin_email
    draft.compliance_overridden_at = datetime.now(timezone.utc)
    db.flush()
    return draft
