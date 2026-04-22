from __future__ import annotations

from app.db.session import SessionLocal
from app.modules.agents import service as agent_service
from app.worker.celery_app import celery_app
from app.worker.tasks.base import BaseTask


@celery_app.task(bind=True, base=BaseTask, name="agents.discover_trends")
def discover_trends_task(self, run_id: int, input_data: dict) -> dict:
    from app.modules.agents.trend_discovery.agent import TrendDiscoveryAgent

    db = SessionLocal()
    try:
        agent = TrendDiscoveryAgent(db=db)
        result = agent.run(input_data, run_id=run_id)
        output = result.get("output", {})
        errors = result.get("errors", [])
        if errors:
            agent_service.fail_run(db, run_id, "; ".join(errors))
        else:
            agent_service.complete_run(db, run_id, output)
        return output
    except Exception as exc:
        agent_service.fail_run(db, run_id, str(exc))
        raise
    finally:
        db.close()


@celery_app.task(bind=True, base=BaseTask, name="agents.cluster_keywords")
def cluster_keywords_task(self, run_id: int, input_data: dict) -> dict:
    from app.modules.agents.keyword_cluster.agent import KeywordClusterAgent

    db = SessionLocal()
    try:
        agent = KeywordClusterAgent(db=db)
        result = agent.run(input_data, run_id=run_id)
        output = result.get("output", {})
        errors = result.get("errors", [])
        if errors:
            agent_service.fail_run(db, run_id, "; ".join(errors))
        else:
            agent_service.complete_run(db, run_id, output)
        return output
    except Exception as exc:
        agent_service.fail_run(db, run_id, str(exc))
        raise
    finally:
        db.close()
