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

# Month abbreviation → ordinal (1=Jan)
_MONTH_ORD: dict[str, int] = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}

# Difficulty string → numeric level (0=easiest, 7=hardest)
_DIFF_LEVEL: dict[str, int] = {
    "easy": 1, "easy–moderate": 2, "easy-moderate": 2,
    "moderate": 3, "moderate–difficult": 4, "moderate-difficult": 4,
    "difficult": 5, "very difficult": 6, "challenging": 6,
}

# Experience/fitness → max difficulty level allowed
_EXP_MAX: dict[str, int] = {
    "never": 1, "easy": 2, "moderate": 3, "experienced": 5, "expert": 6,
}
_FIT_MAX: dict[str, int] = {
    "low": 1, "average": 2, "good": 4, "very_good": 6,
}


def _season_months(season: str) -> list[int]:
    """Extract month ordinals from a trek season string like 'Dec – Apr'."""
    abbrs = [k for k in _MONTH_ORD if k in season]
    if len(abbrs) < 2:
        return [_MONTH_ORD[a] for a in abbrs]
    start = _MONTH_ORD[abbrs[0]]
    end   = _MONTH_ORD[abbrs[-1]]
    months: list[int] = []
    m = start
    for _ in range(12):
        months.append(m)
        if m == end:
            break
        m = (m % 12) + 1
    return months


def _season_overlap(trek_season: str, user_months: list[str]) -> float:
    """Return 0–1 overlap fraction between trek season and user selected months."""
    if not trek_season or not user_months:
        return 0.5  # No season info → neutral
    trek_m = set(_season_months(trek_season))
    user_m = {_MONTH_ORD[m] for m in user_months if m in _MONTH_ORD}
    if not trek_m or not user_m:
        return 0.0
    overlap = trek_m & user_m
    return len(overlap) / max(len(user_m), 1)


def _difficulty_score(trek_diff: str | None, user_max: int) -> float:
    """Return 0–1 fit score: 1 if within user's capability, lower if too hard."""
    if not trek_diff:
        return 0.5
    level = _DIFF_LEVEL.get(trek_diff.lower().strip(), 3)
    if level <= user_max:
        return 1.0 - 0.1 * (user_max - level) / 6  # slight penalty for very easy
    return max(0.0, 1.0 - 0.4 * (level - user_max))  # penalise too-hard treks


def _duration_score(trek_dur: str | None, dur_min: int, dur_max: int) -> float:
    if not trek_dur:
        return 0.5
    import re
    m = re.search(r"\d+", trek_dur)
    if not m:
        return 0.5
    days = int(m.group())
    if dur_min <= days <= dur_max:
        return 1.0
    gap = min(abs(days - dur_min), abs(days - dur_max))
    return max(0.0, 1.0 - 0.15 * gap)


def _region_score(trek_state: str | None, region: str | None) -> float:
    if not region:
        return 1.0  # No preference → full score
    if not trek_state:
        return 0.0
    return 1.0 if region.lower().split("/")[0].strip() in trek_state.lower() else 0.0


_INTENT_TAGS: dict[str, list[str]] = {
    "beginner": ["easy", "beginner", "first"],
    "snow":     ["snow", "winter", "jan", "feb", "dec"],
    "valley":   ["valley", "meadow", "flowers"],
    "adventure":["difficult", "challenging", "expert"],
    "weekend":  ["1", "2", "3"],
    "family":   ["family", "beginner", "easy"],
    "solo":     ["solo", "beginner"],
    "photography": ["scenic", "views"],
    "spiritual":["temple", "spiritual", "religious"],
}


def _intent_score(trek: "CMSPage", intents: list[str]) -> float:  # type: ignore[name-defined]
    if not intents:
        return 1.0
    hits = 0
    search_text = " ".join(filter(None, [
        trek.trek_difficulty, trek.trek_season, trek.trek_suitability,
        trek.seo_description, trek.title,
    ])).lower()
    for intent in intents:
        tags = _INTENT_TAGS.get(intent.lower(), [])
        if any(t in search_text for t in tags):
            hits += 1
    return hits / len(intents)


def _build_why(trek_name: str, factors: dict[str, float], req: PlanRecommendRequest) -> str:
    reasons: list[str] = []
    if factors.get("season", 0) > 0.6:
        months_str = "/".join(req.months[:2]) if req.months else "your season"
        reasons.append(f"open in {months_str}")
    if factors.get("difficulty", 0) > 0.7:
        reasons.append(f"matched to your {req.experience_level} experience level")
    if factors.get("duration", 0) > 0.8:
        reasons.append(f"fits your {req.duration_min}–{req.duration_max}-day window")
    if factors.get("region", 0) == 1.0 and req.region:
        reasons.append(f"located in {req.region}")
    if not reasons:
        reasons.append("aligns with your overall preferences")
    return f"{trek_name} is recommended because it " + ", ".join(reasons) + "."


def _build_warnings(trek: "CMSPage", req: PlanRecommendRequest, season_overlap: float) -> list[str]:  # type: ignore[name-defined]
    warnings: list[str] = []
    if 0 < season_overlap < 0.4:
        warnings.append(f"This trek may not be at its best in your selected months — check {trek.trek_season} season.")
    user_max = min(
        _EXP_MAX.get(req.experience_level, 3),
        _FIT_MAX.get(req.fitness_level, 3),
    )
    diff_level = _DIFF_LEVEL.get((trek.trek_difficulty or "").lower().strip(), 3)
    if diff_level > user_max + 1:
        warnings.append("This trek may be more demanding than your current experience level. Consider a guided group.")
    return warnings


def recommend_treks(db: Session, req: PlanRecommendRequest) -> PlanRecommendResponse:
    """Score all published trek_guide CMS pages against user inputs and return top 5."""
    from app.modules.cms.models import CMSPage
    from sqlalchemy import select

    pages = db.scalars(
        select(CMSPage).where(
            CMSPage.page_type == "trek_guide",
            CMSPage.status == "published",
        )
    ).all()

    user_max_diff = min(
        _EXP_MAX.get(req.experience_level, 3),
        _FIT_MAX.get(req.fitness_level, 3),
    )

    scored: list[tuple[float, dict, CMSPage]] = []
    for page in pages:
        tf = (page.content_json or {}).get("trek_facts", {}) or {}

        season_ov = _season_overlap(page.trek_season or tf.get("season", ""), req.months)
        diff_s    = _difficulty_score(page.trek_difficulty or tf.get("difficulty"), user_max_diff)
        dur_s     = _duration_score(page.trek_duration or tf.get("duration"), req.duration_min, req.duration_max)
        reg_s     = _region_score(page.trek_state, req.region)
        intent_s  = _intent_score(page, req.intent)

        # Budget fit: placeholder (0.8 default until budget column added)
        budget_s  = 0.8

        # Traveller type suitability
        suit_s = 1.0
        if req.traveller_type and page.trek_suitability:
            suit_s = 1.0 if req.traveller_type.lower() in page.trek_suitability.lower() else 0.6

        # Weighted composite (from PRD weights)
        composite = (
            season_ov * 0.25 +
            diff_s    * 0.20 +
            dur_s     * 0.15 +
            budget_s  * 0.15 +
            reg_s     * 0.10 +
            intent_s  * 0.10 +
            suit_s    * 0.05
        )

        factors = {
            "season": season_ov, "difficulty": diff_s, "duration": dur_s,
            "region": reg_s, "intent": intent_s,
        }
        scored.append((composite, factors, page))

    if not scored:
        return PlanRecommendResponse(
            recommendations=[], total_treks_scored=0,
            no_match=True, no_match_message="No published trek guides found.",
        )

    scored.sort(key=lambda x: x[0], reverse=True)

    def _to_rec(composite: float, factors: dict, page: CMSPage, category: str) -> TrekRecommendation:
        tf = (page.content_json or {}).get("trek_facts", {}) or {}
        return TrekRecommendation(
            slug=page.slug,
            name=page.trek_name or page.title,
            match_score=min(100, round(composite * 100)),
            category=category,
            why_this_matches=_build_why(page.trek_name or page.title, factors, req),
            warnings=_build_warnings(page, req, factors["season"]),
            state=page.trek_state,
            difficulty=page.trek_difficulty or tf.get("difficulty"),
            duration=page.trek_duration or tf.get("duration"),
            season=page.trek_season or tf.get("season"),
            altitude=tf.get("altitude"),
            permits=tf.get("permits"),
            base=tf.get("base"),
            hero_image_url=page.hero_image_url,
            seo_description=page.seo_description,
            suitability=page.trek_suitability,
        )

    # Best match
    recs: list[TrekRecommendation] = [_to_rec(*scored[0], "best_match")]
    used_slugs = {scored[0][2].slug}

    # Safer option: best score where difficulty ≤ user_max_diff - 1
    for s, f, p in scored[1:]:
        d = _DIFF_LEVEL.get((p.trek_difficulty or "").lower().strip(), 3)
        if d < user_max_diff and p.slug not in used_slugs:
            recs.append(_to_rec(s, f, p, "safer"))
            used_slugs.add(p.slug)
            break

    # More adventurous: difficulty = user_max_diff + 1
    for s, f, p in scored[1:]:
        d = _DIFF_LEVEL.get((p.trek_difficulty or "").lower().strip(), 3)
        if d == user_max_diff + 1 and p.slug not in used_slugs:
            recs.append(_to_rec(s, f, p, "adventurous"))
            used_slugs.add(p.slug)
            break

    # Fill remaining slots with next highest-scoring unused treks
    for s, f, p in scored[1:]:
        if len(recs) >= 5:
            break
        if p.slug not in used_slugs:
            cat = "budget" if len(recs) == 3 else "comparison"
            recs.append(_to_rec(s, f, p, cat))
            used_slugs.add(p.slug)

    no_match = all(r.match_score < 30 for r in recs)
    return PlanRecommendResponse(
        recommendations=recs,
        total_treks_scored=len(scored),
        no_match=no_match,
        no_match_message=(
            "No exact match found — showing closest treks based on your preferences."
            if no_match else None
        ),
    )
