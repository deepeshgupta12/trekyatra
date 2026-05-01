from __future__ import annotations

import logging
from datetime import date, timedelta

from app.worker.celery_app import celery_app
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


@celery_app.task(name="revenue.aggregate_revenue_task", bind=True, max_retries=3)
def aggregate_revenue_task(self) -> dict:
    from app.modules.revenue.service import aggregate_revenue
    db = SessionLocal()
    try:
        today = date.today()
        period_start = today - timedelta(days=1)
        count = aggregate_revenue(db, period_start, today)
        logger.info("revenue.aggregate_revenue_task: aggregated %d rows", count)
        return {"status": "ok", "rows": count}
    except Exception as exc:
        logger.exception("revenue.aggregate_revenue_task failed")
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@celery_app.task(name="revenue.generate_executive_summary_task", bind=True, max_retries=2)
def generate_executive_summary_task(self) -> dict:
    from app.modules.agents.executive_summary.agent import ExecutiveSummaryAgent
    from app.modules.revenue.service import upsert_executive_summary
    db = SessionLocal()
    try:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_label = week_start.strftime("%Y-W%V")
        agent = ExecutiveSummaryAgent(db)
        result = agent.run({"week_label": week_label})
        logger.info("generate_executive_summary_task: week=%s errors=%s", week_label, result.get("errors"))
        return {"status": "ok", "week_label": week_label, "errors": result.get("errors", [])}
    except Exception as exc:
        logger.exception("generate_executive_summary_task failed")
        raise self.retry(exc=exc, countdown=120)
    finally:
        db.close()
