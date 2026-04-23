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


class GenerateBriefRequest(BaseModel):
    topic_id: str | None = None
    cluster_id: str | None = None
    target_keyword: str
    page_type: str | None = None


class WriteDraftRequest(BaseModel):
    brief_id: str


class OptimizeDraftRequest(BaseModel):
    draft_id: str


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


@router.post("/generate-brief", response_model=AgentTriggerResponse)
def trigger_generate_brief(
    payload: GenerateBriefRequest,
    db: Session = Depends(get_db),
) -> AgentTriggerResponse:
    from app.worker.tasks.agent_tasks import generate_brief_task

    if not payload.topic_id and not payload.cluster_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Provide topic_id or cluster_id")

    input_data = payload.model_dump()
    run = agent_service.start_run(db, "content_brief", input_data)
    generate_brief_task.apply_async(args=[run.id, input_data])
    return AgentTriggerResponse(agent_run_id=run.id, status=run.status)


@router.post("/write-draft", response_model=AgentTriggerResponse)
def trigger_write_draft(
    payload: WriteDraftRequest,
    db: Session = Depends(get_db),
) -> AgentTriggerResponse:
    from app.worker.tasks.agent_tasks import write_draft_task

    input_data = payload.model_dump()
    run = agent_service.start_run(db, "content_writing", input_data)
    write_draft_task.apply_async(args=[run.id, input_data])
    return AgentTriggerResponse(agent_run_id=run.id, status=run.status)


@router.post("/optimize-draft", response_model=AgentTriggerResponse)
def trigger_optimize_draft(
    payload: OptimizeDraftRequest,
    db: Session = Depends(get_db),
) -> AgentTriggerResponse:
    from app.worker.tasks.agent_tasks import optimize_draft_task

    input_data = payload.model_dump()
    run = agent_service.start_run(db, "seo_aeo", input_data)
    optimize_draft_task.apply_async(args=[run.id, input_data])
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
