from app.worker.celery_app import celery_app
from app.db.session import SessionLocal


@celery_app.task(name="buddies.expire_signals")
def expire_signals():
    """Daily: mark buddy_signals active=false where expires_at < today."""
    from app.modules.buddies import service
    with SessionLocal() as db:
        count = service.expire_signals(db)
    return {"expired": count}
