from fastapi import APIRouter

from app.api.routes.admin import router as admin_router
from app.api.routes.admin_auth import router as admin_auth_router
from app.api.routes.users import router as users_router
from app.api.routes.agent_runs import router as agent_runs_router
from app.api.routes.agent_triggers import router as agent_triggers_router
from app.api.routes.auth import router as auth_router
from app.api.routes.content import router as content_router
from app.api.routes.health import router as health_router
from app.api.routes.cms import router as cms_router
from app.api.routes.leads import router as leads_router
from app.api.routes.leads_admin import router as leads_admin_router
from app.api.routes.linking import admin_router as linking_admin_router
from app.api.routes.linking import public_router as linking_public_router
from app.api.routes.newsletter import router as newsletter_router
from app.api.routes.pipeline import router as pipeline_router
from app.api.routes.publish import router as publish_router
from app.api.routes.analytics import admin_router as analytics_admin_router
from app.api.routes.analytics import public_router as analytics_public_router
from app.api.routes.newsletter_admin import pages_router as newsletter_pages_router
from app.api.routes.newsletter_admin import router as newsletter_admin_router
from app.api.routes.cannibalization import router as cannibalization_router
from app.api.routes.compliance import router as compliance_router
from app.api.routes.compliance import rules_router as compliance_rules_router
from app.api.routes.operators import router as operators_router
from app.api.routes.operators import leads_router as operators_leads_router
from app.api.routes.fact_validation import router as fact_validation_router
from app.api.routes.refresh import router as refresh_router
from app.api.routes.hubs import router as hubs_router
from app.api.routes.treks import router as treks_router
from app.api.routes.worker import router as worker_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(admin_auth_router)
api_router.include_router(cms_router)
api_router.include_router(admin_router)
api_router.include_router(content_router)
api_router.include_router(publish_router)
api_router.include_router(pipeline_router)
api_router.include_router(treks_router)
api_router.include_router(worker_router)
api_router.include_router(agent_runs_router)
api_router.include_router(agent_triggers_router)
api_router.include_router(leads_router)
api_router.include_router(leads_admin_router)
api_router.include_router(linking_admin_router)
api_router.include_router(linking_public_router)
api_router.include_router(newsletter_router)
api_router.include_router(analytics_public_router)
api_router.include_router(analytics_admin_router)
api_router.include_router(newsletter_admin_router)
api_router.include_router(newsletter_pages_router)
api_router.include_router(cannibalization_router)
api_router.include_router(compliance_router)
api_router.include_router(compliance_rules_router)
api_router.include_router(fact_validation_router)
api_router.include_router(refresh_router)
api_router.include_router(users_router)
api_router.include_router(operators_router)
api_router.include_router(operators_leads_router)
api_router.include_router(hubs_router)