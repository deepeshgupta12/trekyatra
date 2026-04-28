from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_admin
from app.db.session import get_db
from app.modules.content.models import ContentDraft
from app.modules.agents.fact_validation.agent import ClaimExtractionAgent

router = APIRouter(
    prefix="/admin/drafts",
    tags=["fact-validation"],
    dependencies=[Depends(get_current_admin)],
)


class FactCheckTriggerResponse(BaseModel):
    draft_id: str
    claims_extracted: int
    ymyl_claims: int
    flagged_claims: int


@router.post("/{draft_id}/fact-check", response_model=FactCheckTriggerResponse, status_code=200)
def trigger_fact_check(draft_id: str, db: Session = Depends(get_db)) -> FactCheckTriggerResponse:
    """Run ClaimExtractionAgent on a draft and return extraction summary."""
    try:
        uid = uuid.UUID(draft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid draft ID format")

    draft = db.get(ContentDraft, uid)
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    agent = ClaimExtractionAgent(db=db, draft_id=draft_id)
    result = agent.run(input_data={"draft_id": draft_id})

    if result.get("errors"):
        raise HTTPException(status_code=500, detail="; ".join(result["errors"]))

    output = result.get("output", {})
    claims = output.get("claims", [])
    inserted = output.get("inserted", 0)

    ymyl = sum(1 for c in claims if str(c.get("claim_type", "")) in {
        "altitude", "safety_advisory", "permit_requirement",
        "emergency_contact", "medical_advisory",
    })
    flagged = sum(1 for c in claims if c.get("flagged_for_review", False))

    return FactCheckTriggerResponse(
        draft_id=draft_id,
        claims_extracted=inserted,
        ymyl_claims=ymyl,
        flagged_claims=flagged,
    )
