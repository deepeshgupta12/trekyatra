from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.modules.agents.models import AgentRun


def start_run(db: Session, agent_type: str, input_data: dict[str, Any]) -> AgentRun:
    run = AgentRun(
        agent_type=agent_type,
        status="running",
        input_json=json.dumps(input_data),
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def update_run(db: Session, run_id: int, status: str, **kwargs: Any) -> AgentRun | None:
    run = db.get(AgentRun, run_id)
    if run is None:
        return None
    run.status = status
    for key, value in kwargs.items():
        setattr(run, key, value)
    db.commit()
    db.refresh(run)
    return run


def complete_run(
    db: Session, run_id: int, output_data: dict[str, Any]
) -> AgentRun | None:
    return update_run(
        db,
        run_id,
        status="completed",
        output_json=json.dumps(output_data),
        completed_at=datetime.now(timezone.utc),
    )


def fail_run(db: Session, run_id: int, error: str) -> AgentRun | None:
    return update_run(
        db,
        run_id,
        status="failed",
        error=error,
        completed_at=datetime.now(timezone.utc),
    )


def list_runs(
    db: Session,
    agent_type: str | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[AgentRun]:
    query = db.query(AgentRun)
    if agent_type:
        query = query.filter(AgentRun.agent_type == agent_type)
    if status:
        query = query.filter(AgentRun.status == status)
    return query.order_by(AgentRun.created_at.desc()).offset(offset).limit(limit).all()
