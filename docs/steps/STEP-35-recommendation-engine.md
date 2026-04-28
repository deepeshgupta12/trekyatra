# STEP 35 — Advanced Recommendation Engine

## Goal
Build a pgvector-backed content embedding system for personalised "next best read" suggestions, trek similarity search, and cluster-aware recommendations. Uses user_profiles (Step 33) for personalisation.

## Scope

### pgvector setup
- Enable `pgvector` extension in Postgres: `CREATE EXTENSION IF NOT EXISTS vector`
- Alembic migration: add `embedding vector(1536)` column to `cms_pages`
- `EmbeddingAgent`: on publish / refresh, generate 1536-dim embedding via OpenAI `text-embedding-3-small` (or Anthropic embeddings API)
- Store embedding in cms_pages.embedding; update on every content refresh

### Similarity search service
- `find_similar_pages(page_id, limit=5)` — uses `<=>` cosine distance operator
- `find_similar_to_query(query_text, limit=5)` — embed query → cosine search
- `GET /api/v1/pages/{slug}/similar` — public endpoint returning related page summaries

### Personalised recommendations
- `get_recommendations_for_user(user_id, limit=6)` — weighted blend:
  - 40% similarity to user's bookmarked pages (from Step 33)
  - 30% trek interest tags (from Step 31)
  - 20% fitness_level + preferred_regions match (from user_profiles)
  - 10% recently published pages
- `GET /api/v1/account/recommendations` — auth-required; returns personalised feed

### Frontend components
- `RecommendedContent` server component: replaces static "You may also like" section on trek guide pages
- `PersonalisedFeed` client component: on `/explore` and homepage for logged-in users, shows personalised suggestions
- Fallback for anonymous users: top 6 pages by freshness + cluster diversity

### Trek similarity search
- `/search` page (already exists): wire vector search when query is > 3 words (semantic search)
- Short queries: keep existing keyword filter; long queries: semantic vector search, merge + deduplicate

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 34 complete
- Confirm Step 33 complete (user_profiles, user_bookmarks for personalisation signals)
- pgvector Postgres extension installed: `docker exec trekyatra-postgres psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"`
- OpenAI API key (or Anthropic embeddings) configured in .env

## Dependency Check
- `app/modules/cms/models.py` — CMSPage (add embedding column)
- `app/modules/account/models.py` — UserBookmark, UserProfile (read-only)
- `app/modules/newsletter/models.py` — subscriber_tags (read-only)

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0024_pgvector_embeddings.py`
- `services/api/app/modules/agents/embedding/agent.py`
- `services/api/app/modules/recommendations/__init__.py`
- `services/api/app/modules/recommendations/service.py`
- `services/api/app/api/routes/recommendations.py`
- `services/api/app/schemas/recommendations.py`
- `services/api/tests/test_recommendations.py`
- `apps/web-next/components/content/RecommendedContent.tsx`
- `apps/web-next/components/content/PersonalisedFeed.tsx`

## Planned Files to Modify
- `services/api/app/modules/cms/models.py` — embedding column
- `services/api/app/modules/publish/service.py` — trigger EmbeddingAgent on publish
- `services/api/app/modules/refresh/tasks.py` — trigger EmbeddingAgent on refresh
- `services/api/app/api/router.py`
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — RecommendedContent component
- `apps/web-next/app/(public)/explore/page.tsx` — PersonalisedFeed
- `apps/web-next/app/(public)/search/page.tsx` — semantic search path
- `services/api/.env.example` — OPENAI_API_KEY
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- `text-embedding-3-small` produces 1536-dim vectors; `text-embedding-3-large` is 3072-dim. Use small for V3 (cost and speed); upgrade to large when semantic quality needs improvement.
- pgvector's `ivfflat` index on `embedding`: `CREATE INDEX ON cms_pages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)` — run after initial bulk embed is complete.
- Anonymous user fallback is critical: never show empty "For You" section; always fall back to freshness-sorted popular pages.
