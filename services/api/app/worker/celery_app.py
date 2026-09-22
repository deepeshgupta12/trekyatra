from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "trekyatra",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.worker.tasks.smoke",
        "app.worker.tasks.agent_tasks",
        "app.modules.pipeline.tasks",
        "app.modules.linking.tasks",
        "app.modules.leads.tasks",
        "app.modules.newsletter.tasks",
        "app.modules.refresh.tasks",
        "app.modules.hubs.tasks",
        "app.modules.email_sequences.tasks",
        "app.modules.account.tasks",
        "app.modules.revenue.tasks",
        "app.worker.tasks.news",
        "app.worker.tasks.cdp",
        "app.worker.tasks.trek_intelligence_tasks",
        "app.worker.tasks.notifications",
        "app.worker.tasks.buddies",
        "app.worker.tasks.conditions",
        "app.worker.tasks.comparison",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # ── Beat schedule — ABSOLUTE (crontab) times, all UTC (timezone="UTC" above) ──────────────
    # These were relative intervals (`"schedule": 86400` / `604800` / `7776000`). With Celery's
    # default PersistentScheduler the "last run" lives in a shelve file in the container's working
    # directory, which on DO App Platform is EPHEMERAL: every deploy/restart wipes it and the
    # countdown restarts from zero. A weekly task therefore never fires if deploys land more often
    # than every 7 days, and `quarterly-...` (90 days) realistically never fired at all.
    # crontab() is wall-clock, so restarts cannot reset it.
    # TRADE-OFF: crontab does NOT catch up a missed window — if beat is down at the scheduled
    # minute, that run is skipped rather than deferred. Acceptable for daily jobs; it means a
    # missed weekly job waits a full week.
    # Times are staggered across the low-traffic window (IST = UTC+5:30; 18:30 UTC = 00:00 IST).
    beat_schedule={
        # ── Daily ──
        "daily-content-discovery": {
            "task": "pipeline.daily_discovery",
            "schedule": crontab(minute=30, hour=18),          # 00:00 IST
        },
        "daily-sync-pages": {
            "task": "linking.sync_pages",
            "schedule": crontab(minute=0, hour=19),           # 00:30 IST
        },
        "daily-detect-orphans": {
            "task": "linking.detect_orphans",
            "schedule": crontab(minute=15, hour=19),          # 00:45 IST
        },
        "daily-auto-refresh": {
            "task": "refresh.auto_refresh",
            "schedule": crontab(minute=30, hour=19),          # 01:00 IST
        },
        "daily-nurture-sequences": {
            "task": "email_sequences.process_nurture_sequences",
            "schedule": crontab(minute=0, hour=20),           # 01:30 IST
        },
        "daily-aggregate-revenue": {
            "task": "revenue.aggregate_revenue_task",
            "schedule": crontab(minute=30, hour=20),          # 02:00 IST
        },
        "nightly-cdp-trait-refresh": {
            "task": "cdp.refresh_all_user_traits",
            "schedule": crontab(minute=0, hour=21),           # 02:30 IST
        },
        "nightly-gsc-import": {
            "task": "cdp.import_gsc_data",
            "schedule": crontab(minute=30, hour=21),          # 03:00 IST
        },
        "daily-reseed-trek-coordinates": {
            "task": "conditions.reseed_coordinates",          # restores TREK_COORDS lat/lng
            "schedule": crontab(minute=0, hour=22),           # 03:30 IST
        },
        "daily-expire-buddy-signals": {
            "task": "buddies.expire_signals",
            "schedule": crontab(minute=30, hour=0),           # 00:30 UTC — as the old comment intended
        },
        "daily-trek-alert-digest": {
            "task": "account.send_trek_alerts",
            "schedule": crontab(minute=30, hour=2),           # 08:00 IST — user-facing digest
        },
        "daily-push-permit-alerts": {
            "task": "notifications.send_permit_alerts",
            "schedule": crontab(minute=0, hour=9),            # 09:00 UTC — as the old comment intended
        },
        # ── Weekly (day_of_week: 0=Sunday, 1=Monday) ──
        "weekly-news-agent": {
            "task": "news.weekly_all_treks",
            "schedule": crontab(minute=0, hour=23, day_of_week=1),    # Tue 04:30 IST
        },
        "weekly-executive-summary": {
            "task": "revenue.generate_executive_summary_task",
            "schedule": crontab(minute=0, hour=22, day_of_week=1),    # Tue 03:30 IST
        },
        "weekly-newsletter-generate": {
            "task": "newsletter.auto_generate",
            "schedule": crontab(minute=30, hour=23, day_of_week=3),   # Thu 05:00 IST
        },
        "weekly-cdp-cleanup": {
            "task": "cdp.cleanup_old_events",
            "schedule": crontab(minute=30, hour=22, day_of_week=0),   # Mon 04:00 IST
        },
        "weekly-push-seasonal-alerts": {
            "task": "notifications.send_seasonal_alerts",
            "schedule": crontab(minute=0, hour=10, day_of_week=1),    # Mon 10:00 UTC — as intended
        },
        # ── Sub-daily ──
        "6h-refresh-trek-conditions": {
            "task": "conditions.refresh_all",
            "schedule": crontab(minute=0, hour="*/6"),        # 00/06/12/18 UTC
        },
        # ── Quarterly — 1st of Jan/Apr/Jul/Oct. The old 7776000s (90 day) interval realistically
        # never fired, since it required beat to stay up for 90 unbroken days.
        "quarterly-seasonal-hub-regeneration": {
            "task": "hubs.regenerate_seasonal_hubs",
            "schedule": crontab(minute=0, hour=1, day_of_month=1, month_of_year="1,4,7,10"),
        },
    },
)
