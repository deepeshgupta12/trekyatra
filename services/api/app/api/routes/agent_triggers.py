from __future__ import annotations

from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.agents import service as agent_service

router = APIRouter(prefix="/admin/agents", tags=["agent-triggers"])


class DiscoverTrendsRequest(BaseModel):
    seed_topics: list[str]
    region: str | None = None


class ClusterKeywordsRequest(BaseModel):
    topic_ids: list[str]


class AgentTriggerResponse(BaseModel):
    agent_run_id: int
    status: str


@router.post("/discover-trends", response_model=AgentTriggerResponse)
def trigger_discover_trends(
    payload: DiscoverTrendsRequest,
    db: Session = Depends(get_db),
) -> AgentTriggerResponse:
    from app.worker.tasks.agent_tasks import discover_trends_task

    input_data = payload.model_dump()
    run = agent_service.start_run(db, "trend_discovery", input_data)
    discover_trends_task.apply_async(args=[run.id, input_data])
    return AgentTriggerResponse(agent_run_id=run.id, status=run.status)


@router.post("/cluster-keywords", response_model=AgentTriggerResponse)
def trigger_cluster_keywords(
    payload: ClusterKeywordsRequest,
    db: Session = Depends(get_db),
) -> AgentTriggerResponse:
    from app.worker.tasks.agent_tasks import cluster_keywords_task

    input_data = payload.model_dump()
    run = agent_service.start_run(db, "keyword_cluster", input_data)
    cluster_keywords_task.apply_async(args=[run.id, input_data])
    return AgentTriggerResponse(agent_run_id=run.id, status=run.status)
