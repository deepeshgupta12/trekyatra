from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from langgraph.graph import END, StateGraph
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.client import get_anthropic_client
from app.modules.agents.state import BaseAgentState
from app.modules.compliance.models import ComplianceRule
from app.modules.content.models import ContentDraft, DraftClaim

MODEL = "claude-haiku-4-5-20251001"  # short rule-check — use fast/cheap model

RISKY_WORDING_PROMPT = """You are a compliance reviewer for a trekking content platform.

Review the following content excerpt for risky or misleading wording that could expose the platform to liability or mislead users.

Risky wording types to detect:
- Absolute safety guarantees: "100% safe", "completely safe", "always safe", "no risk"
- Weather certainty claims: "guaranteed weather", "always sunny", "weather is always perfect"
- Unconditional route claims: "always passable", "never closed", "route is always open"
- Medical overconfidence: "anyone can do it", "no fitness required", "no altitude sickness risk"
- Permit certainty: "permits are always available", "no permit required" (without hedging)

Content excerpt:
---
CONTENT
---

Respond with a JSON object:
{
  "has_risky_wording": true/false,
  "findings": [
    {"phrase": "exact phrase found", "type": "risky_type", "suggestion": "safer alternative wording"}
  ]
}

Output only the JSON. No commentary."""


class ComplianceGuardAgent(BaseAgent):
    agent_type = "compliance_guard"

    def __init__(self, db: Session, draft_id: uuid.UUID) -> None:
        self.db = db
        self.draft_id = draft_id
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_draft", self._fetch_draft)
        graph.add_node("run_checks", self._run_checks)
        graph.add_node("store_report", self._store_report)
        graph.set_entry_point("fetch_draft")
        graph.add_edge("fetch_draft", "run_checks")
        graph.add_edge("run_checks", "store_report")
        graph.add_edge("store_report", END)
        return graph.compile()

    # ── Node 1: load draft + active rules ───────────────────────────────────

    def _fetch_draft(self, state: BaseAgentState) -> BaseAgentState:
        draft = self.db.scalar(
            select(ContentDraft).where(ContentDraft.id == self.draft_id)
        )
        if draft is None:
            state["errors"] = [f"Draft {self.draft_id} not found"]
            return state

        rules = list(
            self.db.scalars(
                select(ComplianceRule).where(ComplianceRule.is_active == True)  # noqa: E712
            ).all()
        )

        ymyl_claims = list(
            self.db.scalars(
                select(DraftClaim).where(
                    DraftClaim.draft_id == self.draft_id,
                    DraftClaim.ymyl_flag == True,  # noqa: E712
                )
            ).all()
        )

        state["output"]["draft"] = {
            "id": str(draft.id),
            "title": draft.title,
            "content": draft.optimized_content or draft.content_markdown,
            "page_type": draft.brief.keyword_cluster.intent if draft.brief and draft.brief.keyword_cluster else None,
            "difficulty": _extract_difficulty(draft),
        }
        state["output"]["rules"] = [
            {
                "name": r.name,
                "rule_type": r.rule_type,
                "description": r.description,
                "config": r.rule_config or {},
            }
            for r in rules
        ]
        state["output"]["ymyl_claims_count"] = len(ymyl_claims)
        return state

    # ── Node 2: evaluate each rule ───────────────────────────────────────────

    def _run_checks(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors"):
            return state

        draft = state["output"]["draft"]
        rules = state["output"]["rules"]
        content = draft["content"]
        results: list[dict] = []

        for rule in rules:
            rule_type = rule["rule_type"]
            if rule_type == "affiliate_disclosure":
                result = _check_affiliate_disclosure(content, rule)
            elif rule_type == "safety_disclaimer":
                result = _check_safety_disclaimer(content, draft, rule)
            elif rule_type == "risky_wording":
                result = _check_risky_wording_llm(content, rule)
            elif rule_type == "ymyl_claim":
                result = _check_ymyl_claims(state["output"]["ymyl_claims_count"], rule)
            else:
                result = {
                    "rule": rule["name"],
                    "rule_type": rule_type,
                    "status": "pass",
                    "note": "Rule type not evaluated",
                    "suggestion": None,
                }
            results.append(result)

        state["output"]["results"] = results
        return state

    # ── Node 3: persist report ───────────────────────────────────────────────

    def _store_report(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors"):
            return state

        results = state["output"].get("results", [])
        failed = [r for r in results if r["status"] == "fail"]
        overall = "flagged" if failed else "passed"

        draft = self.db.scalar(
            select(ContentDraft).where(ContentDraft.id == self.draft_id)
        )
        if draft is None:
            return state

        draft.compliance_status = overall
        draft.compliance_notes = results
        self.db.flush()

        state["output"]["compliance_status"] = overall
        state["output"]["failed_rules"] = len(failed)
        state["output"]["checked_rules"] = len(results)
        return state


# ── Rule implementations ────────────────────────────────────────────────────

def _check_affiliate_disclosure(content: str, rule: dict) -> dict:
    disclosure_phrases = (rule.get("config") or {}).get("required_phrases", [
        "affiliate", "commission", "paid partnership", "sponsored",
        "this post contains affiliate", "disclosure"
    ])
    content_lower = content.lower()
    found = any(p.lower() in content_lower for p in disclosure_phrases)
    if found:
        return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "pass",
                "note": "Affiliate disclosure found in content.", "suggestion": None}
    return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "fail",
            "note": "No affiliate disclosure detected.",
            "suggestion": "Add a disclosure statement near the top: 'This post contains affiliate links.'"}


def _check_safety_disclaimer(content: str, draft: dict, rule: dict) -> dict:
    difficulty = (draft.get("difficulty") or "").lower()
    triggers = (rule.get("config") or {}).get("difficulty_triggers", ["difficult", "technical", "expert"])
    requires_disclaimer = any(t in difficulty for t in triggers)
    if not requires_disclaimer:
        return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "pass",
                "note": f"Safety disclaimer not required for difficulty: '{difficulty or 'unspecified'}'.",
                "suggestion": None}

    safety_phrases = (rule.get("config") or {}).get("required_phrases", [
        "safety", "caution", "warning", "disclaimer", "consult", "experienced guide",
        "emergency", "altitude sickness", "acclimatize"
    ])
    content_lower = content.lower()
    found = any(p.lower() in content_lower for p in safety_phrases)
    if found:
        return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "pass",
                "note": "Safety disclaimer found for difficult/technical trek.", "suggestion": None}
    return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "fail",
            "note": f"Trek rated '{difficulty}' but no safety disclaimer detected.",
            "suggestion": "Add a safety section: 'This is a difficult/technical trek. Consult an experienced guide. Know altitude sickness symptoms.'"}


def _check_risky_wording_llm(content: str, rule: dict) -> dict:
    excerpt = content[:3000]
    prompt = RISKY_WORDING_PROMPT.replace("CONTENT", excerpt)
    try:
        client = get_anthropic_client()
        resp = client.messages.create(
            model=MODEL,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()
        try:
            data = json.loads(raw)
        except Exception:
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            data = json.loads(m.group(0)) if m else {"has_risky_wording": False, "findings": []}
    except Exception as exc:
        return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "warn",
                "note": f"LLM check skipped: {exc}", "suggestion": None}

    if not data.get("has_risky_wording"):
        return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "pass",
                "note": "No risky wording detected.", "suggestion": None}

    findings = data.get("findings", [])
    note = "; ".join(f['phrase'] for f in findings[:3]) if findings else "Risky wording detected"
    suggestion = findings[0].get("suggestion") if findings else None
    return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "fail",
            "note": f"Risky wording found: {note}",
            "suggestion": suggestion}


def _check_ymyl_claims(ymyl_count: int, rule: dict) -> dict:
    threshold = (rule.get("config") or {}).get("max_unhedged_ymyl_claims", 0)
    if ymyl_count <= threshold:
        return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "pass",
                "note": f"{ymyl_count} YMYL claim(s) detected — within threshold.", "suggestion": None}
    return {"rule": rule["name"], "rule_type": rule["rule_type"], "status": "fail",
            "note": f"{ymyl_count} YMYL claim(s) detected (threshold: {threshold}). Run fact-check first.",
            "suggestion": "Use the Fact Check tool on this draft, then verify YMYL claims are properly hedged before publish."}


def _extract_difficulty(draft: ContentDraft) -> str:
    if draft.brief and draft.brief.keyword_cluster:
        notes = draft.brief.keyword_cluster.notes or {}
        if isinstance(notes, dict):
            return notes.get("difficulty", "")
    return ""
