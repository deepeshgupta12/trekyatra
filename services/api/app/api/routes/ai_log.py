from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.trek_intelligence import service as trek_intel_service
from app.schemas.trek_intelligence import AILogRequest

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/log", status_code=202)
def log_ai_interaction(payload: AILogRequest, db: Session = Depends(get_db)) -> dict:
    """Step 72: fire-and-forget AI/MCP interaction logging from web/mobile/chatgpt/claude."""
    trek_intel_service.log_ai_interaction(
        db,
        source=payload.source,
        tool_name=payload.tool_name,
        query_summary=payload.query_summary,
        result_summary=payload.result_summary,
        page_url=payload.page_url,
        session_id=payload.session_id,
        trek_slugs=payload.trek_slugs,
    )
    return {"status": "logged"}
