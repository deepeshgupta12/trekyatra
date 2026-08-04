from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.newsletter.service import subscribe
from app.modules.newsletter.tasks import send_subscribe_welcome_email, sync_subscriber_task
from app.schemas.newsletter import NewsletterSubscribeCreate, NewsletterSubscribeResponse

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.post("/subscribe", response_model=NewsletterSubscribeResponse, status_code=200)
def newsletter_subscribe(
    payload: NewsletterSubscribeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> NewsletterSubscribeResponse:
    result = subscribe(db, payload)
    # Send the welcome email in the API process (after the response) so it does not depend on the
    # Celery worker being up. New subscribers only, so a repeat submit does not re-send.
    if not result.already_subscribed:
        background_tasks.add_task(send_subscribe_welcome_email, result.email, result.source_page)
    return result


@router.post("/sync", dependencies=[Depends(get_current_admin)], status_code=202)
def newsletter_sync_manual(payload: NewsletterSubscribeCreate) -> dict:
    """Admin-only: manually trigger a newsletter platform sync for a given email."""
    sync_subscriber_task.delay(payload.email, payload.name)
    return {"queued": True, "email": payload.email}
