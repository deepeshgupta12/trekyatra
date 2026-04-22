from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.agents import service as agent_service
from app.schemas.agents import AgentRunResponse

router = APIRouter(prefix="/admin/agent-runs", tags=["agent-runs"])


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
