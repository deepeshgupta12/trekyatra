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
            "schedule": 86400,  # every 24 hours; crontab(hour=6, minute=0) when celery[beat] is in use
        },
    },
)
