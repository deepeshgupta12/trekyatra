# Step 45 — Image Gathering Agent

## Status: Done — commit 6e3dd9d

## What was implemented
- `modules/agents/image_search/service.py`: find_trek_image() — Unsplash → Pixabay → Wikimedia Commons
- `modules/agents/image_search/agent.py`: run_image_search() — updates hero_image_url, skips if already set, never raises
- `modules/pipeline/service.py`: _attempt_image_search() called post-publish (non-blocking)
- `config.py`: UNSPLASH_ACCESS_KEY, PIXABAY_API_KEY settings (both optional)
- `.env.example`: documented
- 7 new tests pass

## What is deferred
- DO Spaces upload for found images (currently uses direct CDN URL from source)
- Requires: run `alembic upgrade head` on production
- Optionally: set UNSPLASH_ACCESS_KEY or PIXABAY_API_KEY in DO for better image quality
- Wikimedia Commons works without any API key as fallback

## Summary
Create an automated agent that finds, validates, and assigns high-quality hero images
to trek guide CMS pages published by the content pipeline. Currently, pipeline-published
pages have no hero image (`hero_image_url: null`) — images are added manually by the admin.

## Motivation
- Every pipeline-published trek guide shows the placeholder mountain icon (⛰) in
  recommendations and related content cards because `hero_image_url` is null
- Admins must manually upload images via the CMS UI for every published trek
- An image agent would complete the pipeline automatically without admin intervention

## Image Source Options (in priority order)
1. **Unsplash API** — high quality, attribution required, free tier 50 req/hour
   - API: `https://api.unsplash.com/photos/random?query={trek_name}+india+trek`
   - Requires: `UNSPLASH_ACCESS_KEY` env var
2. **Wikimedia Commons API** — free, no attribution, India-specific photos available
   - API: `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={trek_name}`
   - No API key required
3. **Pixabay API** — free, good quality
   - API: `https://pixabay.com/api/?q={trek_name}+india+trekking&image_type=photo`
   - Requires: `PIXABAY_API_KEY` env var (free signup)

## Agent Design

### LangGraph nodes
1. **select_image_source** — determine best source based on trek name/region
2. **search_images** — query the image API with trek-specific search terms
3. **validate_image** — check image dimensions (min 800px wide), file size, relevance
4. **store_image_url** — update CMS page's `hero_image_url` via patch_page()

### Input
```python
{
  "page_slug": "kedarkantha",
  "trek_name": "Kedarkantha Trek",
  "region": "Uttarakhand",
  "search_terms": ["kedarkantha summit", "kedarkantha snow", "uttarakhand winter trek"]
}
```

### Output
```python
{
  "hero_image_url": "https://images.unsplash.com/photo-xxx?w=1200&h=630",
  "source": "unsplash",
  "attribution": "Photo by John Doe on Unsplash",
  "validated": true
}
```

## Pipeline Integration
After the `publish` stage completes in `PipelineOrchestrator`, add a new stage:
- `image_search` — runs `ImageGatheringAgent` for the newly published CMS page
- If image found → `patch_page()` sets `hero_image_url`
- If image not found → skip (admin can upload manually; no pipeline failure)

## Files to Create
- `services/api/app/modules/agents/image_search/agent.py`
- `services/api/app/modules/agents/image_search/__init__.py`
- `services/api/app/modules/agents/image_search/service.py` (Unsplash/Wikimedia clients)
- `services/api/tests/test_image_search_agent.py`

## Files to Modify
- `services/api/app/modules/pipeline/service.py` — add image_search stage after publish
- `services/api/app/core/config.py` — add UNSPLASH_ACCESS_KEY, PIXABAY_API_KEY
- `services/api/.env.example` — document new env vars

## Dependencies
- `httpx` (already installed) — for Unsplash/Pixabay API calls
- No new Python packages required

## New Env Vars Required
| Var | Source | Required? |
|-----|--------|-----------|
| `UNSPLASH_ACCESS_KEY` | unsplash.com/developers | Optional (graceful skip) |
| `PIXABAY_API_KEY` | pixabay.com/api | Optional (graceful skip) |

## Acceptance Criteria
- [ ] Agent runs after pipeline `publish` stage for every trek guide
- [ ] At least one image source works without API key (Wikimedia fallback)
- [ ] Agent never fails the pipeline — image failure is graceful/logged
- [ ] Minimum image dimensions validated before setting hero_image_url
- [ ] DO Spaces upload integrated — image URL is permanent (not external CDN link)
- [ ] All backend tests pass; no pipeline regressions
