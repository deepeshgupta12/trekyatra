"""CDP Celery tasks — nightly GSC import, user traits refresh, cleanup."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="cdp.refresh_all_user_traits", bind=True, max_retries=2)
def refresh_all_user_traits(self) -> dict:
    """Recompute user trait aggregates for all anonymous_ids seen in the last 30 days."""
    from sqlalchemy import text
    from app.db.session import SessionLocal
    from app.modules.cdp import service as cdp_service

    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        rows = db.execute(
            text(
                "SELECT DISTINCT anonymous_id FROM analytics_events WHERE created_at >= :cutoff"
            ),
            {"cutoff": cutoff},
        ).fetchall()
        ids = [r[0] for r in rows]
        refreshed = 0
        for anon_id in ids:
            try:
                cdp_service.refresh_user_traits(db, anon_id)
                refreshed += 1
            except Exception as exc:
                logger.warning("trait refresh failed for %s: %s", anon_id, exc)
        logger.info("CDP trait refresh complete: %d/%d succeeded", refreshed, len(ids))
        return {"refreshed": refreshed, "total": len(ids)}
    except Exception as exc:
        logger.error("CDP trait refresh task failed: %s", exc)
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()


@shared_task(name="cdp.cleanup_old_events", bind=True, max_retries=1)
def cleanup_old_events(self, days: int = 365) -> dict:
    """Delete analytics events older than `days` days to keep table size manageable."""
    from sqlalchemy import text
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        result = db.execute(
            text("DELETE FROM analytics_events WHERE created_at < :cutoff"),
            {"cutoff": cutoff},
        )
        db.commit()
        deleted = result.rowcount
        logger.info("CDP cleanup: deleted %d events older than %d days", deleted, days)
        return {"deleted": deleted, "days": days}
    except Exception as exc:
        logger.error("CDP cleanup task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@shared_task(name="cdp.import_gsc_data", bind=True, max_retries=2)
def import_gsc_data(self, days_back: int = 3) -> dict:
    """Import Google Search Console data for the last `days_back` days.

    Requires GSC_SERVICE_ACCOUNT_JSON and GA4_PROPERTY_ID to be set in settings.
    Falls back gracefully if credentials are not configured.
    """
    from app.core.config import settings
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        if not settings.gsc_service_account_json:
            logger.info("GSC import skipped: GSC_SERVICE_ACCOUNT_JSON not configured")
            return {"skipped": True, "reason": "credentials_not_configured"}

        try:
            import json
            from google.oauth2 import service_account
            from googleapiclient.discovery import build
        except ImportError:
            logger.warning("GSC import skipped: google-api-python-client not installed")
            return {"skipped": True, "reason": "package_not_installed"}

        creds = service_account.Credentials.from_service_account_info(
            json.loads(settings.gsc_service_account_json),
            scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
        )
        service = build("searchconsole", "v1", credentials=creds)

        site_url = "sc-domain:trekyatra.co.in"
        today = datetime.now(timezone.utc).date()
        rows_inserted = 0

        from app.modules.cdp.models import GscPerformance
        from sqlalchemy.dialects.postgresql import insert as pg_insert

        for delta in range(1, days_back + 1):
            target_date = today - timedelta(days=delta)
            date_str = target_date.isoformat()
            try:
                response = (
                    service.searchanalytics()
                    .query(
                        siteUrl=site_url,
                        body={
                            "startDate": date_str,
                            "endDate": date_str,
                            "dimensions": ["page", "query", "country", "device"],
                            "rowLimit": 5000,
                        },
                    )
                    .execute()
                )
                for row in response.get("rows", []):
                    keys = row.get("keys", [])
                    stmt = pg_insert(GscPerformance).values(
                        date=target_date,
                        page_url=keys[0] if len(keys) > 0 else "",
                        query=keys[1] if len(keys) > 1 else "",
                        country=keys[2] if len(keys) > 2 else None,
                        device=keys[3] if len(keys) > 3 else None,
                        clicks=int(row.get("clicks", 0)),
                        impressions=int(row.get("impressions", 0)),
                        ctr=row.get("ctr"),
                        position=row.get("position"),
                    ).on_conflict_do_update(
                        constraint="uq_gsc_perf",
                        set_={
                            "clicks": int(row.get("clicks", 0)),
                            "impressions": int(row.get("impressions", 0)),
                            "ctr": row.get("ctr"),
                            "position": row.get("position"),
                        },
                    )
                    db.execute(stmt)
                    rows_inserted += 1
                db.commit()
            except Exception as exc:
                logger.warning("GSC import failed for %s: %s", date_str, exc)

        logger.info("GSC import complete: %d rows inserted/updated", rows_inserted)
        return {"rows_imported": rows_inserted, "days_back": days_back}
    except Exception as exc:
        logger.error("GSC import task failed: %s", exc)
        raise self.retry(exc=exc, countdown=600)
    finally:
        db.close()
