from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.agents import service as agent_service
from app.schemas.agents import AgentRunResponse

router = APIRouter(prefix="/admin/agent-runs", tags=["agent-runs"])


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
