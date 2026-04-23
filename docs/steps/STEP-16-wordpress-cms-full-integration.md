# STEP 16 — Master CMS Foundation

> **Note:** Originally scoped as "WordPress CMS Full Integration." WordPress removed in favour of a native Master CMS after validating the WP integration added operational overhead without benefit. All WP code, infrastructure, and tests deleted and replaced.

## Goal
Build a native Master CMS that drives all public frontend content, stores agent pipeline output, and provides cache invalidation for the frontend — with zero external CMS dependency.

## Scope

### Backend
- `cms_pages` table: slug, page_type, title, content_html, content_json, status, seo fields, brief_id FK, cluster_id FK, published_at
- `CMSPage` ORM model registered in `app/db/base.py`
- CMS service layer: `create_page`, `get_page_by_slug`, `list_pages`, `update_page`, `delete_page`, `upsert_page_from_draft`, `cache_invalidate`, `cache_invalidate_all`
- CMS API routes: `GET/POST /cms/pages`, `GET/PATCH/DELETE /cms/pages/{slug}`, `POST /cms/cache/invalidate`
- Publish service rewritten: `publish_to_cms` replaces `push_draft_to_wordpress`
- `content_drafts`: `wordpress_post_id` → `cms_page_id` (UUID)
- `publish_logs`: `wordpress_post_id` + `wordpress_url` → `cms_page_id` + `published_url`
- 18 tests in `test_cms.py`; `test_publish.py` rewritten for CMS flow
- Admin schemas/service: `WordPressConfigSummary` → `CMSConfigSummary`

### WordPress removal
- Deleted: `app/modules/wordpress/`, `app/api/routes/wordpress.py`, `app/schemas/wordpress.py`, all WP tests, `docker-compose.wordpress.yml`, `infrastructure/wordpress/`
- 5 WP config settings removed from `config.py` and `.env.example`
- `wordpress_router` replaced by `cms_router` in `router.py`

### Frontend
- `lib/api.ts`: WP helpers removed; `CMSPage` interface + `fetchCMSPage`/`fetchCMSPages` added
- `trek/[slug]/page.tsx`: reads from CMS API; renders only if `status === "published"`
- `app/api/revalidate/route.ts`: Next.js on-demand revalidation endpoint
- `app/(admin)/admin/cms/page.tsx`: Master CMS admin page with KPI cards, pages table, per-page and global cache clear
- Admin layout: "Master CMS" nav entry in System group

## Status
Done

## Files Created
- `services/api/app/modules/cms/__init__.py`
- `services/api/app/modules/cms/models.py`
- `services/api/app/modules/cms/service.py`
- `services/api/app/api/routes/cms.py`
- `services/api/app/schemas/cms.py`
- `services/api/alembic/versions/20260423_0008_master_cms.py`
- `services/api/tests/test_cms.py`
- `apps/web-next/app/api/revalidate/route.ts`
- `apps/web-next/app/(admin)/admin/cms/page.tsx`

## Files Modified
- `services/api/app/core/config.py`
- `services/api/app/api/router.py`
- `services/api/app/db/base.py`
- `services/api/app/modules/content/models.py`
- `services/api/app/modules/admin/service.py`
- `services/api/app/modules/publish/service.py`
- `services/api/app/api/routes/publish.py`
- `services/api/app/schemas/admin.py`
- `services/api/app/schemas/publish.py`
- `services/api/tests/test_publish.py`
- `services/api/tests/test_admin.py`
- `services/api/tests/test_smoke.py`
- `services/api/.env.example`
- `apps/web-next/lib/api.ts`
- `apps/web-next/app/(public)/trek/[slug]/page.tsx`
- `apps/web-next/app/(admin)/admin/layout.tsx`

## Notes
- 117/117 backend tests pass; `next build` clean (zero errors)
- Cache uses Redis DB 2, 5-min TTL
- `upsert_page_from_draft` bridges agent pipeline → CMS; called by `publish_to_cms`
- Admin cache clear hits both Redis (backend) and Next.js revalidation simultaneously
- WordPress Docker service deleted; stop the container if still running
