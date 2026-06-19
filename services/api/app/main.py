from contextlib import asynccontextmanager
import os

import yaml
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy import update
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.session import SessionLocal
from app.mcp_server import mcp as treksage_mcp

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


_mcp_app = treksage_mcp.streamable_http_app()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting %s in %s mode", settings.app_name, settings.app_env)
    _cancel_stale_runs()
    async with _mcp_app.router.lifespan_context(_mcp_app):
        yield
    logger.info("Shutting down %s", settings.app_name)


# Rate limiter — keyed by real client IP (Cloudflare sends X-Forwarded-For)
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Trust X-Forwarded-Proto/Host from Cloudflare + DigitalOcean proxy so that
# FastAPI generates correct HTTPS redirect URLs (e.g. /mcp → /mcp/).
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# CORS — must be added before any routes.
# Allows the Next.js frontend (trekyatra.co.in) to call the FastAPI backend
# (api.trekyatra.co.in) from the browser.
_CORS_ORIGINS = [
    "http://localhost:3000",                              # local dev
    "https://trekyatra.co.in",                            # production root
    "https://www.trekyatra.co.in",                        # production www
    "https://trekyatra-ssvha.ondigitalocean.app",         # DO temporary URL
    "https://claude.ai",                                  # Claude.ai MCP client
    "https://chatgpt.com",                               # ChatGPT MCP client
    "https://chat.openai.com",                           # ChatGPT legacy domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def root_health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
    }


@app.get("/openapi-mcp.json", tags=["system"], include_in_schema=False)
async def openapi_mcp_spec() -> JSONResponse:
    """Serve the TrekSage OpenAPI spec for ChatGPT Custom GPT Actions."""
    spec_path = os.path.join(os.path.dirname(__file__), "openapi_mcp.yaml")
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    return JSONResponse(content=spec, headers={"Access-Control-Allow-Origin": "*"})


app.include_router(api_router, prefix=settings.api_v1_prefix)

# Serve locally-uploaded media files at /uploads/{filename}
# In production, configure DO Spaces for persistent storage (DO_SPACES_* env vars)
_UPLOADS_DIR = "data/uploads"
os.makedirs(_UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_UPLOADS_DIR), name="uploads")

# Step 72 — "TrekSage" MCP server (Streamable HTTP), consumable by ChatGPT/Claude/etc.
app.mount("/mcp", _mcp_app)