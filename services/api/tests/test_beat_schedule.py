"""Celery beat schedule guards (2026-09-22).

Every entry used a RELATIVE interval (`"schedule": 86400` / `604800` / `7776000`). Celery's default
PersistentScheduler keeps "last run" in a shelve file in the container's working directory, which is
EPHEMERAL on DO App Platform — every deploy/restart wiped it and restarted the countdown, so weekly
jobs could go unfired indefinitely and the 90-day quarterly job realistically never ran. These tests
lock in absolute crontab schedules.
"""
from __future__ import annotations

from celery.schedules import crontab

from app.worker.celery_app import celery_app


def _schedule() -> dict:
    return celery_app.conf.beat_schedule


def test_every_beat_entry_uses_an_absolute_crontab():
    """No entry may use a relative int/timedelta interval — those reset on container restart."""
    offenders = {
        name: entry["schedule"]
        for name, entry in _schedule().items()
        if not isinstance(entry["schedule"], crontab)
    }
    assert offenders == {}, f"relative (restart-resettable) schedules: {offenders}"


def test_beat_schedule_is_utc():
    """crontab hours below are written as UTC — a timezone change would silently shift every job."""
    assert celery_app.conf.timezone == "UTC"
    assert celery_app.conf.enable_utc is True


def test_every_scheduled_task_is_registered():
    """A typo in a beat `task` name fails silently at runtime (beat logs, nothing ever runs)."""
    celery_app.loader.import_default_modules()
    registered = set(celery_app.tasks)
    missing = sorted({e["task"] for e in _schedule().values()} - registered)
    assert missing == [], f"beat references unregistered tasks: {missing}"


def test_news_agent_is_scheduled():
    """The weekly news run is the site's freshness signal — 280 of ~350 indexable pages."""
    entry = _schedule()["weekly-news-agent"]
    assert entry["task"] == "news.weekly_all_treks"
    assert isinstance(entry["schedule"], crontab)


def test_quarterly_hub_regeneration_uses_month_of_year():
    """The 90-day interval could never survive 90 unbroken days of uptime; pin it to real months."""
    sched = _schedule()["quarterly-seasonal-hub-regeneration"]["schedule"]
    assert isinstance(sched, crontab)
    assert sched.month_of_year == {1, 4, 7, 10}
    assert sched.day_of_month == {1}
