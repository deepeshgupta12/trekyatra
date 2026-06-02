from celery import Celery

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
    beat_schedule={
        "daily-content-discovery": {
            "task": "pipeline.daily_discovery",
            "schedule": 86400,
        },
        "daily-sync-pages": {
            "task": "linking.sync_pages",
            "schedule": 86400,
        },
        "daily-detect-orphans": {
            "task": "linking.detect_orphans",
            "schedule": 86400,
        },
        "daily-auto-refresh": {
            "task": "refresh.auto_refresh",
            "schedule": 86400,
        },
        "weekly-newsletter-generate": {
            "task": "newsletter.auto_generate",
            "schedule": 604800,  # 7 days
        },
        "quarterly-seasonal-hub-regeneration": {
            "task": "hubs.regenerate_seasonal_hubs",
            "schedule": 7776000,  # 90 days
        },
        "daily-nurture-sequences": {
            "task": "email_sequences.process_nurture_sequences",
            "schedule": 86400,  # 24 hours
        },
        "daily-aggregate-revenue": {
            "task": "revenue.aggregate_revenue_task",
            "schedule": 86400,
        },
        "weekly-executive-summary": {
            "task": "revenue.generate_executive_summary_task",
            "schedule": 604800,
        },
        "weekly-news-agent": {
            "task": "news.weekly_all_treks",
            "schedule": 604800,  # every 7 days
        },
        "nightly-cdp-trait-refresh": {
            "task": "cdp.refresh_all_user_traits",
            "schedule": 86400,  # 24 hours
        },
        "nightly-gsc-import": {
            "task": "cdp.import_gsc_data",
            "schedule": 86400,  # 24 hours
        },
        "weekly-cdp-cleanup": {
            "task": "cdp.cleanup_old_events",
            "schedule": 604800,  # 7 days
        },
        "daily-trek-alert-digest": {
            "task": "account.send_trek_alerts",
            "schedule": 86400,  # 24 hours — fires daily (cron pinning to 08:00 IST done in DO)
        },
    },
)
