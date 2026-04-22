from app.worker.celery_app import celery_app
from app.worker.tasks.base import BaseTask


@celery_app.task(bind=True, base=BaseTask, name="smoke.ping")
def ping(self, message: str = "pong") -> dict:
    return {"status": "ok", "echo": message}
