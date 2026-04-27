from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.newsletter.service import subscribe
from app.schemas.newsletter import NewsletterSubscribeCreate, NewsletterSubscribeResponse

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.post("/subscribe", response_model=NewsletterSubscribeResponse, status_code=200)
def newsletter_subscribe(
    payload: NewsletterSubscribeCreate, db: Session = Depends(get_db)
) -> NewsletterSubscribeResponse:
    return subscribe(db, payload)
