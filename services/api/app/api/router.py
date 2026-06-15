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
from app.api.routes.operators import reviews_router as operators_reviews_router
from app.api.routes.operators_public import router as operators_public_router
from app.api.routes.operators_public import inquiry_router as inquiry_router
from app.api.routes.fact_validation import router as fact_validation_router
from app.api.routes.refresh import router as refresh_router
from app.api.routes.hubs import router as hubs_router
from app.api.routes.email_sequences import admin_router as email_sequences_admin_router
from app.api.routes.email_sequences import public_router as email_sequences_public_router
from app.api.routes.revenue import router as revenue_router
from app.api.routes.account import router as account_router
from app.api.routes.treks import router as treks_router
from app.api.routes.admin_treks import router as admin_treks_router
from app.api.routes.worker import router as worker_router
from app.api.routes.products import public_router as products_public_router
from app.api.routes.products import admin_router as products_admin_router
from app.api.routes.checkout import router as checkout_router
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.monetization import router as monetization_router
from app.api.routes.translation import router as translation_router
from app.api.routes.plan import router as plan_router
from app.api.routes.subscriptions import router as subscriptions_router
from app.api.routes.media import router as media_router
from app.api.routes.sitemap_data import router as sitemap_data_router
from app.api.routes.search import router as search_router
from app.api.routes.news import router as news_router
from app.api.routes.cdp import public_router as cdp_public_router
from app.api.routes.cdp import admin_router as cdp_admin_router
from app.api.routes.mobile import router as mobile_router
from app.api.routes.auth_mobile import router as auth_mobile_router
from app.api.routes.ai_log import router as ai_log_router

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
api_router.include_router(admin_treks_router)
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
api_router.include_router(operators_reviews_router)
api_router.include_router(operators_public_router)
api_router.include_router(inquiry_router)
api_router.include_router(hubs_router)
api_router.include_router(email_sequences_admin_router)
api_router.include_router(email_sequences_public_router)
api_router.include_router(revenue_router)
api_router.include_router(account_router)
api_router.include_router(products_public_router)
api_router.include_router(products_admin_router)
api_router.include_router(checkout_router)
api_router.include_router(recommendations_router)
api_router.include_router(monetization_router)
api_router.include_router(translation_router)
api_router.include_router(plan_router)
api_router.include_router(subscriptions_router)
api_router.include_router(media_router)
api_router.include_router(sitemap_data_router)
api_router.include_router(search_router)
api_router.include_router(news_router)
api_router.include_router(cdp_public_router)
api_router.include_router(cdp_admin_router)
api_router.include_router(auth_mobile_router)
api_router.include_router(mobile_router)
api_router.include_router(ai_log_router)