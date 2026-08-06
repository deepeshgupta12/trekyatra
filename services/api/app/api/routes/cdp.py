"""CDP API routes — event ingest (public) and analytics admin endpoints."""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin, get_optional_user
from app.modules.cdp import service as cdp_service
from fastapi.responses import StreamingResponse

from app.schemas.cdp import (
    AlertsOut,
    AttributionReportOut,
    BatchEventIn,
    CohortHeatmapOut,
    ConsentOut,
    ConsentUpdateIn,
    ContentPagesOut,
    CustomCohortIn,
    CustomSegmentIn,
    CustomSegmentListOut,
    CustomSegmentOut,
    DynamicFunnelIn,
    DynamicFunnelOut,
    EventCatalogOut,
    EventDefinitionsOut,
    EventExplorerOut,
    EventIn,
    EventOut,
    EventStreamOut,
    FunnelTemplatesOut,
    GscOut,
    IdentifyIn,
    KpisOut,
    RealtimeFeedOut,
    SavedFunnelIn,
    SavedFunnelListOut,
    SavedFunnelOut,
    SegmentListOut,
    SegmentPreviewIn,
    SegmentPreviewOut,
    SessionEndIn,
    SessionOut,
    SessionStartIn,
    SuppressionsOut,
    TrekAnalyticsOut,
    UserActivityOut,
    UserListOut,
    UserProfileOut,
    WebhookRuleIn,
    WebhookRuleOut,
    WebhookRulesOut,
)

public_router = APIRouter(prefix="/analytics", tags=["cdp"])
admin_router = APIRouter(
    prefix="/admin/cdp",
    tags=["cdp-admin"],
    dependencies=[Depends(get_current_admin)],
)


# ── Public: event ingest ──────────────────────────────────────────────────────

def _client_ip(request: Request) -> Optional[str]:
    """First hop of X-Forwarded-For (proxy/CDN chain) else the direct peer. Only a salted hash of
    this is ever stored (cdp_service.hash_ip) — the raw IP is not persisted."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else None


def _client_country(request: Request) -> Optional[str]:
    """Country from a CDN/proxy geo header if present (Cloudflare / DO / Vercel). No GeoIP dep."""
    for h in ("cf-ipcountry", "x-vercel-ip-country", "x-country", "x-geo-country"):
        v = request.headers.get(h)
        if v and v.upper() not in ("XX", "T1"):  # CF sentinels for unknown/Tor
            return v.upper()
    return None


@public_router.post("/event", response_model=EventOut, status_code=201)
def ingest_event(
    body: EventIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
) -> EventOut:
    user_id = current_user.id if current_user else None
    event = cdp_service.log_event(
        db, body, user_id=user_id, ip=_client_ip(request), country=_client_country(request)
    )
    return EventOut.model_validate(event)


@public_router.post("/events/batch", status_code=201)
def ingest_events_batch(
    body: BatchEventIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
) -> dict:
    user_id = current_user.id if current_user else None
    count = cdp_service.batch_log_events(
        db, body.events, user_id=user_id, ip=_client_ip(request), country=_client_country(request)
    )
    return {"ingested": count}


# ── Public: session management ────────────────────────────────────────────────

@public_router.post("/session/start", response_model=SessionOut, status_code=201)
def session_start(
    body: SessionStartIn,
    db: Session = Depends(get_db),
) -> SessionOut:
    session = cdp_service.start_session(db, body)
    return SessionOut.model_validate(session)


@public_router.post("/session/end", response_model=SessionOut)
def session_end(
    body: SessionEndIn,
    db: Session = Depends(get_db),
) -> SessionOut:
    session = cdp_service.end_session(db, body)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionOut.model_validate(session)


# ── Public: consent ───────────────────────────────────────────────────────────

@public_router.post("/consent", response_model=ConsentOut)
def update_consent(body: ConsentUpdateIn) -> ConsentOut:
    from datetime import datetime, timezone
    return ConsentOut(
        anonymous_id=body.anonymous_id,
        consent_given=body.consent_given,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )


# ── Public: identity stitching ────────────────────────────────────────────────

@public_router.post("/identify", status_code=200)
def identify(
    body: IdentifyIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
) -> dict:
    """Link anonymous_id → user_id after sign-in or sign-up.
    Only stitches when the caller is authenticated; ignores payload user_id
    to prevent spoofing — always uses the JWT-verified user identity.
    """
    if not current_user:
        return {"ok": True}
    cdp_service.stitch_identity(db, body.anonymous_id, current_user.id)
    cdp_service.refresh_user_traits(db, body.anonymous_id)
    return {"ok": True}


# ── Admin: users ──────────────────────────────────────────────────────────────

@admin_router.get("/users", response_model=UserListOut)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> UserListOut:
    result = cdp_service.list_users(db, page=page, page_size=page_size, search=search, source=source)
    return UserListOut(**result)


@admin_router.post("/traits/recompute")
def recompute_traits(
    limit: Optional[int] = Query(None, ge=1, le=100000),
    db: Session = Depends(get_db),
) -> dict:
    """Re-derive lifecycle_stage + engagement_score + lead_score across all trait rows (e.g. after a
    scoring-rule change or to reflect time passing). Per-user refresh already runs on identify."""
    updated = cdp_service.recompute_all_traits(db, limit=limit)
    return {"recomputed": updated}


# Static route registered before dynamic /users/{user_id} to prevent path shadowing
@admin_router.get("/users/activity", response_model=UserActivityOut)
def get_user_activity_route(
    email: str = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> UserActivityOut:
    result = cdp_service.get_user_activity(
        db, email=email, page=page, page_size=page_size,
        date_from=date_from, date_to=date_to,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserActivityOut(**result)


@admin_router.get("/users/{user_id}")
def get_user_profile(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> dict:
    data = cdp_service.get_user_profile(db, user_id)
    if not data["user"] and not data["traits"]:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": str(user_id),
        "email": data["user"].email if data["user"] else None,
        "name": data["user"].full_name if data["user"] else None,
        "traits": data["traits"],
        "recent_events": [
            {
                "id": str(e.id),
                "event_category": e.event_category,
                "event_name": e.event_name,
                "event_value": e.event_value,
                "page_url": e.page_url,
                "properties": e.properties,
                "created_at": e.created_at.isoformat(),
            }
            for e in data["recent_events"]
        ],
        "sessions": [
            {
                "id": s.id,
                "started_at": s.started_at.isoformat(),
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "duration_seconds": s.duration_seconds,
                "page_count": s.page_count,
                "event_count": s.event_count,
                "converted": s.converted,
                "landing_page": s.landing_page,
                "utm_source": s.utm_source,
            }
            for s in data["sessions"]
        ],
        "touchpoints": [
            {
                "id": str(tp.id),
                "touchpoint_type": tp.touchpoint_type,
                "channel": tp.channel,
                "utm_source": tp.utm_source,
                "utm_medium": tp.utm_medium,
                "utm_campaign": tp.utm_campaign,
                "converted_at": tp.converted_at.isoformat() if tp.converted_at else None,
                "created_at": tp.created_at.isoformat(),
            }
            for tp in data["touchpoints"]
        ],
    }


# ── Admin: event catalog (for funnel builder dropdowns) ───────────────────────

@admin_router.get("/events/catalog", response_model=EventCatalogOut)
def get_event_catalog(db: Session = Depends(get_db)) -> EventCatalogOut:
    return cdp_service.get_event_catalog(db)


# ── Admin: dynamic funnels ────────────────────────────────────────────────────

@admin_router.post("/funnels/dynamic", response_model=DynamicFunnelOut)
def run_dynamic_funnel(
    body: DynamicFunnelIn,
    db: Session = Depends(get_db),
) -> DynamicFunnelOut:
    result = cdp_service.get_dynamic_funnel(
        db,
        steps=[s.model_dump() for s in body.steps],
        date_from=body.date_from,
        date_to=body.date_to,
        count_type=body.count_type,
    )
    return DynamicFunnelOut(**result)


# ── Admin: saved (named) funnels (P2) — static path registered before any /funnels/{id} ──

@admin_router.get("/funnels/saved", response_model=SavedFunnelListOut)
def list_saved_funnels(db: Session = Depends(get_db)) -> SavedFunnelListOut:
    funnels = cdp_service.list_saved_funnels(db)
    return SavedFunnelListOut(funnels=funnels, total=len(funnels))


@admin_router.post("/funnels/saved", response_model=SavedFunnelOut, status_code=201)
def create_saved_funnel(body: SavedFunnelIn, db: Session = Depends(get_db)) -> SavedFunnelOut:
    funnel = cdp_service.create_saved_funnel(
        db,
        name=body.name,
        steps=[s.model_dump() for s in body.steps],
        conversion_window_days=body.conversion_window_days,
        count_type=body.count_type,
    )
    return SavedFunnelOut.model_validate(funnel)


@admin_router.post("/funnels/saved/{funnel_id}/run", response_model=DynamicFunnelOut)
def run_saved_funnel(funnel_id: uuid.UUID, db: Session = Depends(get_db)) -> DynamicFunnelOut:
    result = cdp_service.run_saved_funnel(db, funnel_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Saved funnel not found")
    return DynamicFunnelOut(**{k: result[k] for k in ("steps", "overall_conversion_pct", "date_from", "date_to", "count_type")})


@admin_router.delete("/funnels/saved/{funnel_id}", status_code=204)
def delete_saved_funnel(funnel_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    if not cdp_service.delete_saved_funnel(db, funnel_id):
        raise HTTPException(status_code=404, detail="Saved funnel not found")


# ── Admin: cohort retention heatmap (P2 — optional source/behavior segmentation) ──

@admin_router.get("/cohorts", response_model=CohortHeatmapOut)
def get_cohorts(
    source: Optional[str] = Query(None, description="Acquisition-source cohorts"),
    behavior_event: Optional[str] = Query(None, description="Behavior cohorts — users who fired this event"),
    db: Session = Depends(get_db),
) -> CohortHeatmapOut:
    return cdp_service.get_cohort_heatmap(db, source=source, behavior_event=behavior_event)


# ── Admin: channel attribution report (P2) ────────────────────────────────────

@admin_router.get("/attribution", response_model=AttributionReportOut)
def get_attribution(
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db),
) -> AttributionReportOut:
    return AttributionReportOut(**cdp_service.get_attribution_report(db, days=days))


# ── Admin: event stream ───────────────────────────────────────────────────────

@admin_router.get("/events/stream")
def get_event_stream(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    event_name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    result = cdp_service.get_event_stream(
        db, page=page, page_size=page_size, event_name=event_name, category=category
    )
    return {
        "events": [
            {
                "id": str(e.id),
                "anonymous_id": e.anonymous_id,
                "user_id": str(e.user_id) if e.user_id else None,
                "event_category": e.event_category,
                "event_name": e.event_name,
                "event_value": e.event_value,
                "page_url": e.page_url,
                "properties": e.properties,
                "created_at": e.created_at.isoformat(),
            }
            for e in result["events"]
        ],
        "total": result["total"],
    }


# ── Admin: segments ───────────────────────────────────────────────────────────

@admin_router.get("/segments")
def get_segments(db: Session = Depends(get_db)) -> dict:
    return cdp_service.get_segments(db)


# ── Admin: GSC ────────────────────────────────────────────────────────────────

@admin_router.get("/gsc")
def get_gsc(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> dict:
    result = cdp_service.get_gsc_data(
        db, date_from=date_from, date_to=date_to, page=page, page_size=page_size
    )
    return {
        "rows": [
            {
                "page_url": r.page_url,
                "query": r.query,
                "date": r.date.isoformat(),
                "clicks": r.clicks,
                "impressions": r.impressions,
                "ctr": r.ctr,
                "position": r.position,
            }
            for r in result["rows"]
        ],
        "total": result["total"],
        "date_from": result["date_from"],
        "date_to": result["date_to"],
    }


# ── Admin: Step 67 — KPI dashboard ────────────────────────────────────────────

@admin_router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)) -> dict:
    return cdp_service.get_kpis(db)


@admin_router.get("/realtime-feed")
def get_realtime_feed(
    exclude_internal: bool = Query(True),
    db: Session = Depends(get_db),
) -> dict:
    return cdp_service.get_realtime_feed(db, exclude_internal=exclude_internal)


@admin_router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)) -> dict:
    return cdp_service.get_alerts(db)


# ── Admin: Step 67 — Event Explorer ──────────────────────────────────────────
# NOTE: /events/definitions and /events/export registered BEFORE /events/stream
# and any future /events/{id} to prevent path shadowing

@admin_router.get("/events/definitions", response_model=EventDefinitionsOut)
def get_event_definitions(db: Session = Depends(get_db)) -> EventDefinitionsOut:
    result = cdp_service.get_event_definitions(db)
    return EventDefinitionsOut(**result)


@admin_router.get("/events/export")
def export_events(
    category: Optional[str] = Query(None),
    event_name: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    exclude_internal: bool = Query(True),
    platform: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    csv_data = cdp_service.get_events_export_csv(
        db,
        category=category,
        event_name=event_name,
        date_from=date_from,
        date_to=date_to,
        exclude_internal=exclude_internal,
        platform=platform,
    )
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=events_export.csv"},
    )


@admin_router.get("/events")
def get_events_explorer(
    category: Optional[str] = Query(None),
    event_name: Optional[str] = Query(None),
    anonymous_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    page_url_contains: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    exclude_internal: bool = Query(True),
    platform: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> dict:
    return cdp_service.get_events_explorer(
        db,
        category=category,
        event_name=event_name,
        anonymous_id=anonymous_id,
        user_id=user_id,
        page_url_contains=page_url_contains,
        date_from=date_from,
        date_to=date_to,
        exclude_internal=exclude_internal,
        platform=platform,
        page=page,
        page_size=page_size,
    )


# ── Admin: Step 67 — Funnel templates ────────────────────────────────────────

@admin_router.get("/funnels/templates")
def get_funnel_templates() -> dict:
    return cdp_service.get_funnel_templates()


# ── Admin: Step 67 — Custom cohort ───────────────────────────────────────────

@admin_router.post("/cohorts/custom")
def run_custom_cohort(
    body: CustomCohortIn,
    db: Session = Depends(get_db),
) -> dict:
    return cdp_service.get_custom_cohort(
        db,
        cohort_event=body.cohort_event,
        retention_event=body.retention_event,
        date_from=body.date_from,
        date_to=body.date_to,
        max_weeks=body.max_weeks,
    )


# ── Admin: Step 67 — Segment builder (static routes before /{id} dynamic) ────

@admin_router.get("/segments/custom", response_model=CustomSegmentListOut)
def list_custom_segments(db: Session = Depends(get_db)) -> CustomSegmentListOut:
    result = cdp_service.list_custom_segments(db)
    return CustomSegmentListOut(**result)


@admin_router.post("/segments/custom", response_model=CustomSegmentOut, status_code=201)
def create_custom_segment(
    body: CustomSegmentIn,
    db: Session = Depends(get_db),
) -> CustomSegmentOut:
    seg = cdp_service.create_custom_segment(db, body)
    return CustomSegmentOut.model_validate(seg)


@admin_router.post("/segments/preview", response_model=SegmentPreviewOut)
def preview_segment(
    body: SegmentPreviewIn,
    db: Session = Depends(get_db),
) -> SegmentPreviewOut:
    result = cdp_service.preview_segment(db, body.conditions)
    return SegmentPreviewOut(**result)


@admin_router.get("/segments/{segment_id}/export")
def export_segment(
    segment_id: str,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    csv_data = cdp_service.export_segment_csv(db, segment_id)
    if not csv_data:
        raise HTTPException(status_code=404, detail="Segment not found")
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=segment_{segment_id}.csv"},
    )


# ── Admin: Step 67 — Content analytics ───────────────────────────────────────

@admin_router.get("/content/pages")
def get_content_pages(
    sort_by: str = Query("views_30d"),
    page_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    return cdp_service.get_content_pages_analytics(db, sort_by=sort_by, page_type=page_type)


@admin_router.get("/content/treks")
def get_trek_analytics(db: Session = Depends(get_db)) -> dict:
    return cdp_service.get_trek_analytics(db)


# ── Admin: Step 67 — Webhook rules ───────────────────────────────────────────

@admin_router.get("/webhooks", response_model=WebhookRulesOut)
def list_webhooks(db: Session = Depends(get_db)) -> WebhookRulesOut:
    result = cdp_service.list_webhook_rules(db)
    return WebhookRulesOut(**result)


@admin_router.post("/webhooks", response_model=WebhookRuleOut, status_code=201)
def create_webhook(
    body: WebhookRuleIn,
    db: Session = Depends(get_db),
) -> WebhookRuleOut:
    rule = cdp_service.create_webhook_rule(db, body)
    return WebhookRuleOut.model_validate(rule)


@admin_router.delete("/webhooks/{rule_id}", status_code=204)
def delete_webhook(
    rule_id: str,
    db: Session = Depends(get_db),
) -> None:
    deleted = cdp_service.delete_webhook_rule(db, rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Webhook rule not found")


# ── Admin: Step 67 — Suppressions ────────────────────────────────────────────

@admin_router.get("/suppressions")
def get_suppressions(db: Session = Depends(get_db)) -> dict:
    return cdp_service.get_suppressions(db)
