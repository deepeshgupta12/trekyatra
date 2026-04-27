from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.newsletter.service import subscribe
from app.modules.newsletter.tasks import sync_subscriber_task
from app.schemas.newsletter import NewsletterSubscribeCreate, NewsletterSubscribeResponse

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.post("/subscribe", response_model=NewsletterSubscribeResponse, status_code=200)
def newsletter_subscribe(
    payload: NewsletterSubscribeCreate, db: Session = Depends(get_db)
) -> NewsletterSubscribeResponse:
    return subscribe(db, payload)


@router.post("/sync", dependencies=[Depends(get_current_admin)], status_code=202)
def newsletter_sync_manual(payload: NewsletterSubscribeCreate) -> dict:
    """Admin-only: manually trigger a newsletter platform sync for a given email."""
    sync_subscriber_task.delay(payload.email, payload.name)
    return {"queued": True, "email": payload.email}
