from app.modules.auth.dependencies import get_current_admin
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.agents import service as agent_service
from app.modules.agents.models import AgentRun
from app.schemas.agents import AgentRunResponse

router = APIRouter(prefix="/admin/agent-runs", tags=["agent-runs"], dependencies=[Depends(get_current_admin)])


@router.get("/{run_id}", response_model=AgentRunResponse)
def get_agent_run(run_id: int, db: Session = Depends(get_db)) -> AgentRunResponse:
    run = agent_service.get_run(db, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return run


@router.get("", response_model=list[AgentRunResponse])
def list_agent_runs(
    agent_type: str | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[AgentRunResponse]:
    return agent_service.list_runs(
        db, agent_type=agent_type, status=status, limit=limit, offset=offset
    )


@router.delete("/clear", response_model=dict)
def clear_non_completed_agent_runs(db: Session = Depends(get_db)) -> dict:
    """Delete all agent runs that are not in 'completed' status.

    Removes failed, cancelled, and stale running runs. Completed runs persist.
    """
    non_terminal = ("failed", "cancelled", "running")
    deleted = db.execute(
        delete(AgentRun).where(AgentRun.status.in_(non_terminal))
    ).rowcount
    db.commit()
    return {"deleted": deleted}
