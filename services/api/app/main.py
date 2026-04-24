from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import update

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.session import SessionLocal

configure_logging()
logger = get_logger(__name__)


def _cancel_stale_runs() -> None:
    """On startup, mark any orphaned 'running' agent/pipeline runs as cancelled.

    Runs left in 'running' state are always stale after a restart — the
    Celery worker that was executing them died and will never complete them.
    """
    try:
        from app.modules.agents.models import AgentRun
        from app.modules.pipeline.models import PipelineRun

        with SessionLocal() as db:
            agent_rows = db.execute(
                update(AgentRun)
                .where(AgentRun.status == "running")
                .values(status="cancelled")
            ).rowcount
            pipeline_rows = db.execute(
                update(PipelineRun)
                .where(PipelineRun.status == "running")
                .values(status="cancelled")
            ).rowcount
            db.commit()
            if agent_rows or pipeline_rows:
                logger.info(
                    "Startup cleanup: cancelled %d stale agent runs, %d stale pipeline runs",
                    agent_rows,
                    pipeline_rows,
                )
    except Exception as exc:
        logger.warning("Startup cleanup failed (non-fatal): %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting %s in %s mode", settings.app_name, settings.app_env)
    _cancel_stale_runs()
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
    lifespan=lifespan,
)


@app.get("/health", tags=["system"])
async def root_health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
    }


app.include_router(api_router, prefix=settings.api_v1_prefix)