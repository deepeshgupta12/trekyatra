"""Step 73: /treksage chat API — session-persisted conversational trek assistant."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.trek_intelligence import treksage_agent

router = APIRouter(prefix="/treksage", tags=["treksage"])


class TreksageChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    session_key: str | None = None


class TreksageChatResponse(BaseModel):
    session_key: str
    reply: str
    tool_calls: list[dict] = []


class TreksageChatHistoryItem(BaseModel):
    role: str
    content: str


@router.post("/chat", response_model=TreksageChatResponse)
def chat(payload: TreksageChatRequest, db: Session = Depends(get_db)) -> TreksageChatResponse:
    """Send a message to the TrekSage conversational assistant."""
    session = treksage_agent.get_or_create_session(db, payload.session_key)
    result = treksage_agent.chat(db, session, payload.message)
    return TreksageChatResponse(
        session_key=result["session_key"],
        reply=result["reply"],
        tool_calls=result["tool_calls"],
    )


@router.get("/chat/{session_key}/history", response_model=list[TreksageChatHistoryItem])
def get_history(session_key: str, db: Session = Depends(get_db)) -> list[TreksageChatHistoryItem]:
    """Return prior messages for a returning session (used to repopulate chat UI on reload)."""
    from app.modules.trek_intelligence.models import TreksageChatSession, TreksageChatMessage
    session = db.query(TreksageChatSession).filter_by(session_key=session_key).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    msgs = (
        db.query(TreksageChatMessage)
        .filter_by(session_id=session.id)
        .order_by(TreksageChatMessage.created_at)
        .all()
    )
    return [TreksageChatHistoryItem(role=m.role, content=m.content) for m in msgs]
