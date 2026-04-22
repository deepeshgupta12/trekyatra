from celery import Task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

MAX_RETRIES = 3
DEFAULT_BACKOFF = 60  # seconds


class BaseTask(Task):
    abstract = True
    max_retries = MAX_RETRIES
    default_retry_delay = DEFAULT_BACKOFF

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error("Task %s[%s] failed: %s", self.name, task_id, exc)
        super().on_failure(exc, task_id, args, kwargs, einfo)

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning("Task %s[%s] retrying: %s", self.name, task_id, exc)
        super().on_retry(exc, task_id, args, kwargs, einfo)
