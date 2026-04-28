from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.client import get_anthropic_client
from app.modules.agents.state import BaseAgentState
from app.modules.content.models import ContentDraft, DraftClaim

MODEL = "claude-sonnet-4-6"

# Claim types that carry YMYL (Your Money Your Life) risk for trekking content.
YMYL_CLAIM_TYPES = {
    "altitude",
    "safety_advisory",
    "permit_requirement",
    "emergency_contact",
    "medical_advisory",
}

EXTRACTION_PROMPT = """You are a fact-validation assistant for a trekking content platform.

Extract all verifiable factual claims from the draft below. For each claim output a JSON array with objects:
{
  "claim_text": "<exact quote or paraphrase of the claim>",
  "claim_type": "<one of: route_distance | altitude | permit_requirement | seasonality | cost_estimate | safety_advisory | operator_claim | emergency_contact | medical_advisory | general_fact>",
  "confidence_score": <float 0.0-1.0 — your confidence the claim is accurate: 0.9=high, 0.6=medium, 0.3=low/unverifiable>,
  "flagged_for_review": <true if confidence_score < 0.7>
}

Rules:
- Only extract claims that can in principle be verified (facts, numbers, regulations, safety warnings).
- Skip opinions, recommendations, and subjective descriptions.
- A claim_type of altitude, safety_advisory, permit_requirement, emergency_contact, or medical_advisory is safety-critical — set confidence_score conservatively.
- Output ONLY the JSON array. No prose, no markdown code fences.

Draft content:
{content}"""


def _clean_json(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


class ClaimExtractionAgent(BaseAgent):
    agent_type = "fact_validation"

    def __init__(self, db: Session, draft_id: str) -> None:
        self.db = db
        self.draft_id = uuid.UUID(draft_id)
        self.draft: ContentDraft | None = None
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_draft", self._fetch_draft)
        graph.add_node("extract_claims", self._extract_claims)
        graph.add_node("store_claims", self._store_claims)
        graph.set_entry_point("fetch_draft")
        graph.add_edge("fetch_draft", "extract_claims")
        graph.add_edge("extract_claims", "store_claims")
        graph.add_edge("store_claims", END)
        return graph.compile()

    def _fetch_draft(self, state: BaseAgentState) -> BaseAgentState:
        self.draft = self.db.get(ContentDraft, self.draft_id)
        if self.draft is None:
            state["errors"] = [f"Draft {self.draft_id} not found"]
        return state

    def _extract_claims(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or self.draft is None:
            return state

        content = self.draft.content_markdown or self.draft.title
        client = get_anthropic_client()
        prompt = EXTRACTION_PROMPT.replace("{content}", content[:12000])
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text
        try:
            claims = json.loads(_clean_json(raw))
            if not isinstance(claims, list):
                claims = []
        except (json.JSONDecodeError, IndexError):
            claims = []

        state["output"] = {"claims": claims}
        return state

    def _store_claims(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or not state.get("output"):
            return state

        now = datetime.now(timezone.utc)
        claims_data: list[dict] = state["output"].get("claims", [])

        # Delete existing claims for this draft before inserting fresh ones.
        existing = self.db.query(DraftClaim).filter(DraftClaim.draft_id == self.draft_id).all()
        for c in existing:
            self.db.delete(c)
        self.db.flush()

        inserted = 0
        for c in claims_data:
            claim_type = str(c.get("claim_type", "general_fact"))[:64]
            confidence = float(c.get("confidence_score", 0.5))
            confidence = max(0.0, min(1.0, confidence))
            ymyl = claim_type in YMYL_CLAIM_TYPES

            claim = DraftClaim(
                id=uuid.uuid4(),
                draft_id=self.draft_id,
                claim_text=str(c.get("claim_text", ""))[:2000],
                claim_type=claim_type,
                confidence_score=confidence,
                flagged_for_review=bool(c.get("flagged_for_review", confidence < 0.7)),
                ymyl_flag=ymyl,
                evidence_url=None,  # V2.1: real evidence search; V2.0 = None
                created_at=now,
            )
            self.db.add(claim)
            inserted += 1

        self.db.commit()
        state["output"]["inserted"] = inserted
        return state
