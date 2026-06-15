from __future__ import annotations

import logging
import smtplib
import uuid
from datetime import datetime, timezone
from email.mime.text import MIMEText

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.leads.models import LeadSubmission
from app.modules.plan.models import TripPlan
from app.modules.agents.trip_planner.agent import run_trip_planner
from app.schemas.plan import PlanGenerateRequest, PlanRecommendRequest, PlanRecommendResponse, TrekRecommendation

logger = logging.getLogger(__name__)


def generate_plan(
    db: Session,
    payload: PlanGenerateRequest,
    user_id: uuid.UUID | None = None,
) -> TripPlan:
    result = run_trip_planner(
        db=db,
        region=payload.region,
        duration_days=payload.duration_days,
        experience=payload.experience,
        month=payload.month,
        budget_inr=payload.budget_inr,
        group_size=payload.group_size,
    )

    plan = TripPlan(
        id=uuid.uuid4(),
        session_id=payload.session_id,
        user_id=user_id,
        inputs=payload.model_dump(exclude={"email"}),
        output=result["output"],
        trek_slug=result["trek_slug"],
        fallback_used=result["fallback_used"],
        created_at=datetime.now(timezone.utc),
    )
    db.add(plan)

    # Capture lead for every plan generation (source: trip_planner)
    if payload.email:
        _create_planner_lead(db, payload, plan.id)

    db.commit()
    db.refresh(plan)
    return plan


def get_plan(db: Session, plan_id: uuid.UUID) -> TripPlan | None:
    return db.get(TripPlan, plan_id)


def email_plan(db: Session, plan_id: uuid.UUID, to_email: str) -> bool:
    plan = get_plan(db, plan_id)
    if not plan or not plan.output:
        return False
    _send_plan_email(to_email, plan.output)
    return True


def _create_planner_lead(
    db: Session, payload: PlanGenerateRequest, plan_id: uuid.UUID
) -> None:
    try:
        lead = LeadSubmission(
            id=uuid.uuid4(),
            name="Trek Planner User",
            email=payload.email,  # type: ignore[arg-type]
            trek_interest=payload.region or "General trekking",
            source_page="/plan",
            cta_type="trip_planner",
            status="new",
            status_history=[{
                "status": "new",
                "changed_at": datetime.now(timezone.utc).isoformat(),
                "changed_by": "trip_planner",
            }],
            created_at=datetime.now(timezone.utc),
        )
        db.add(lead)
    except Exception:
        logger.warning("Failed to create planner lead for plan_id=%s", plan_id)


def _send_plan_email(to_email: str, output: dict) -> None:
    if not settings.smtp_host:
        return
    try:
        trek_title = output.get("trek_title", "Your Trek Plan")
        itinerary = output.get("itinerary", [])
        lines = [f"Your personalised trek plan: {trek_title}", ""]
        if output.get("difficulty"):
            lines.append(f"Difficulty: {output['difficulty']}")
        if output.get("best_month"):
            lines.append(f"Best time: {output['best_month']}")
        if output.get("cost_estimate"):
            lines.append(f"Estimated cost: {output['cost_estimate']}")
        lines.append("")
        lines.append("Your itinerary:")
        for day in itinerary:
            lines.append(f"\nDay {day.get('day', '?')}: {day.get('title', '')}")
            for act in day.get("activities", []):
                lines.append(f"  • {act}")
            if day.get("notes"):
                lines.append(f"  Note: {day['notes']}")
        lines += ["", "Happy trekking!", "— The TrekYatra Team"]

        msg = MIMEText("\n".join(lines))
        msg["Subject"] = f"Your TrekYatra plan: {trek_title}"
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_user and settings.smtp_password:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
    except Exception:
        logger.warning("Plan email failed to %s", to_email)


# ── Step 57: Trek Recommendation Engine ────────────────────────────────────────
# Step 72: scoring logic moved to app.modules.trek_intelligence.matching (refined
# with real budget scoring, structured-month seasons, and safety exclusions).
# This wrapper preserves the existing import path used by plan routes.


def recommend_treks(db: Session, req: PlanRecommendRequest) -> PlanRecommendResponse:
    """Score all published trek_guide CMS pages against user inputs and return top 5."""
    from app.modules.trek_intelligence.matching import score_treks

    return score_treks(db, req)
