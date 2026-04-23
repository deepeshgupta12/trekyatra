# STEP 16 — WordPress CMS Full Integration

## Goal
Upgrade the WordPress integration from a basic connectivity test to a production-grade CMS layer. Register custom post types, push full metadata and taxonomy, and establish the pull/sync mechanism the frontend will use to render real published content.

## Scope

### WordPress custom post types
- Register custom post types via WP plugin (minimal plugin deployed to local WP): trek_guide, packing_list, comparison, permit_guide, seasonal_page, beginner_roundup, gear_review, destination
- Verify CPTs are available via WP REST API (`/wp-json/wp/v2/<post-type>`)

### Custom fields / meta fields
- Register ACF-compatible meta fields (or use WP REST API custom meta): content_type, cluster_id, brief_id, freshness_interval, monetization_type, page_trust_level, fact_check_status, affiliate_disclosure_flag, safety_disclaimer_flag, schema_payload_ref
- Verify meta fields appear in REST API responses

### Backend: full metadata push
- Extend `WordPressClient.create_post()` to include: post_type, categories (by name), tags (by name), custom meta fields, featured image (placeholder for now)
- Add `WordPressClient.update_post()` for existing post updates
- Add `WordPressClient.list_posts()` with filters (post_type, status, per_page, page)
- Add `WordPressClient.get_post()` by ID or slug
- Add `WordPressClient.upload_media()` placeholder (implement when image gen is ready)

### Pull/sync for frontend
- GET /api/v1/wordpress/posts — proxy list from WP REST API with cache
- GET /api/v1/wordpress/posts/{slug} — proxy single post with cache
- Redis cache: 5-minute TTL on WP content reads; invalidate on publish/update

### Category and tag management
- POST /api/v1/wordpress/categories — ensure category exists or create
- POST /api/v1/wordpress/tags — ensure tag exists or create

### Frontend integration prep
- Update `lib/api.ts` to expose `fetchWPPost(slug)` and `fetchWPPosts(filters)`
- Trek detail page updated to try WP backend first, fall back to static data

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 15 complete (draft content available to push)
- Local WordPress running (`docker-compose -f docker-compose.wordpress.yml up -d`)
- WP admin credentials in .env (WORDPRESS_URL, WORDPRESS_USER, WORDPRESS_APP_PASSWORD)

## Dependency Check
- `app/modules/wordpress/client.py` — extended with new methods (additive, existing callers unchanged)
- `app/modules/wordpress/service.py` — new service helpers for list/get/categories/tags
- `app/api/routes/wordpress.py` — add new endpoints additively
- `apps/web-next/lib/api.ts` — add WP fetch helpers (additive)
- Redis cache layer: new dependency on `redis.asyncio` in backend

## Planned Files to Create
- `services/api/app/modules/wordpress/cache.py` — Redis cache helpers for WP content
- WP custom plugin file (minimal PHP, deployed to local WP): `infrastructure/wordpress/plugins/trekyatra-cpt/trekyatra-cpt.php`
- `services/api/tests/test_wordpress_full.py`

## Planned Files to Modify
- `services/api/app/modules/wordpress/client.py` — add update_post, list_posts, get_post, upload_media, ensure_category, ensure_tag
- `services/api/app/modules/wordpress/service.py` — add pull/sync service helpers
- `services/api/app/api/routes/wordpress.py` — add list/get/category/tag endpoints
- `services/api/app/schemas/wordpress.py` — extend with full post response schema
- `apps/web-next/lib/api.ts` — add fetchWPPost, fetchWPPosts
- `apps/web-next/app/(public)/treks/[slug]/page.tsx` — try WP API first
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
# Ensure WP is running
docker-compose -f docker-compose.wordpress.yml up -d

# Install deps
make install

# Run tests
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v
make api

# Verify CPTs accessible
curl http://localhost:8080/wp-json/wp/v2/trek_guide

# Push a test post with full meta
curl -X POST http://localhost:8000/api/v1/admin/drafts/<id>/publish

# Pull back via API
curl http://localhost:8000/api/v1/wordpress/posts?post_type=trek_guide

npx gitnexus analyze --force
```

## Status
done

## Files Created
- `infrastructure/wordpress/plugins/trekyatra-cpt/trekyatra-cpt.php`
- `services/api/app/modules/wordpress/cache.py`
- `services/api/tests/test_wordpress_full.py`

## Files Modified
- `services/api/app/modules/wordpress/client.py`
- `services/api/app/modules/wordpress/service.py`
- `services/api/app/api/routes/wordpress.py`
- `services/api/app/schemas/wordpress.py`
- `apps/web-next/lib/api.ts`
- `apps/web-next/app/(public)/trek/[slug]/page.tsx`

## Notes
- Custom plugin should be minimal: just registers CPTs and meta fields, nothing else
- App password authentication is already in use; no change to auth strategy
- Cache key pattern: `wp:post:{slug}`, `wp:posts:{post_type}:{page}`
- If WP is not reachable, list/get endpoints should return cached data or 503 (never crash the frontend)
- featured_image upload is a placeholder — implement with image generation in V2
