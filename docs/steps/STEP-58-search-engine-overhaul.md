# Step 58 — Search Engine Overhaul (Semantic Search)

## Status: Phase 1 Done (Fuse.js with tags) — Phase 2 Pending (Full Semantic)

---

## Phase 1 — Completed (2026-05-21): Dynamic Fuse.js + Computed Tags

### What was fixed in Phase 1

**1. Trending junk ("uttr"):** `get_trending_queries` added `LENGTH >= 3 AND count >= 2` filter. Client-side safety filter additionally strips short entries.

**2. CMS treks not searchable:** `trekFuse` was module-level on 12 static treks. Fixed: dynamic Fuse rebuilt from `fetchAllCMSTreks()` (100+ CMS treks) after async load. `fuseVersion` state triggers re-render.

**3. Semantic queries fail ("Summer", "Beginner", "March"):** `buildSearchTags()` computes expanded keywords for each trek: season bucket names (winter/summer/monsoon/autumn), month names (January–December), difficulty labels (beginner/challenging), state synonyms (kumaon/garhwal/uk). Tags field weight 2.5 in Fuse config.

### Files Modified in Phase 1
- `services/api/app/modules/search/service.py` — trending min-length + count filter
- `apps/web-next/app/(public)/search/page.tsx` — dynamic Fuse + buildSearchTags + fetchAllCMSTreks

---

## Phase 2 — Pending: Full Semantic Search (pgvector + Hybrid)

### Why Fuse.js is insufficient long-term

Fuse.js is a fuzzy STRING matcher. It cannot:
- Match "budget trek" to a trek with `estimated_cost_range: "₹5,000–₹10,000"`
- Match "Kedarkantha vs Brahmatal" to comparison content
- Rank results by RELEVANCE (user intent) vs ALPHABETICAL similarity
- Handle synonym expansion ("Himalayan" = "Uttarakhand", "beginner" = "easy" = "first-time")
- Understand queries like "snowy pass that's not too long"

The codebase already has the pgvector infrastructure: `cms_pages.embedding vector(1536)` + embedding agent. This is the foundation for real semantic search.

### Proposed Phase 2 Architecture

#### A. Search Mode Selection
```
Query length < 2 chars → nothing
Query length 2-4 chars → Fuse.js instant results (fast, local)
Query length 5+ chars → pgvector semantic + text hybrid (backend call)
Special intents (detected) → structured filter (see Intent Detection below)
```

#### B. Backend Semantic Search Endpoint (already exists — `/api/v1/search?q=`)
Extend this endpoint to:
1. Generate query embedding via OpenAI
2. pgvector cosine similarity against `cms_pages.embedding`
3. Merge with text-matched results (CMS title/description/trek_facts)
4. Apply boost signals: is_featured × 1.2, view_count × 1.1, published_at recency × 1.05
5. Filter by `page_type` based on tab selection (Treks/Guides/Packing/Permits)
6. Return slug, title, page_type, hero_image_url, trek_* metadata, seo_description, score

#### C. Intent Detection (Structured Filters)
Detect structured intent from natural language before hitting semantic search:
```
"beginner treks" → difficulty: [Easy, Easy-Moderate]
"summer treks" → season months: [Apr, May, Jun, Jul, Aug]
"winter treks" → season months: [Nov, Dec, Jan, Feb, Mar]
"monsoon treks" → season months: [Jun, Jul, Aug, Sep]
"treks near Delhi" → region: [Uttarakhand, Himachal Pradesh]
"treks near Mumbai" → region: [Maharashtra, Sahyadris]
"budget treks" → sort by cost ascending
"1 week trek" → duration: 6-7 days
"Uttarakhand snow treks" → state: Uttarakhand + tags: snow
```
Detection uses regex + keyword matching. If intent detected, apply structured filters
on top of semantic results.

#### D. Hybrid Ranking Formula
```
final_score = (0.6 × semantic_similarity)
            + (0.2 × text_relevance_bm25)
            + (0.1 × popularity_signal)
            + (0.1 × freshness_signal)
```
Where:
- `semantic_similarity` = pgvector cosine similarity (0–1)
- `text_relevance_bm25` = title/description BM25 text match (0–1)
- `popularity_signal` = log(1 + page_views_30d) / log(max_views + 1)
- `freshness_signal` = 1 / (days_since_published + 1)

#### E. Query Autocomplete (already works — `/api/v1/search/suggestions`)
Current: `func.lower(CMSPage.title).contains(q.lower())` — simple substring match.
Enhancement: Add Trigram similarity for typo tolerance (PostgreSQL `pg_trgm`).

#### F. Search Results Page Sections (updated)
```
[INSTANT] Tab: Treks
  → If q < 5 chars: Fuse.js local results (buildSearchTags)
  → If q >= 5 chars: Backend semantic results (with trek_* metadata)
  
[INSTANT] Tab: Guides / Packing / Permits
  → Always backend: /api/v1/search/suggestions with page_type filter

[DEFERRED 300ms] Semantic AI match results (current semanticResults state)
  → Show only if no Fuse results OR user explicitly searches

[ALWAYS] CMS Autocomplete Dropdown
  → /api/v1/search/suggestions?q= for all page types
```

### All Use Cases and Edge Cases

| Query | Expected Behavior | Implementation |
|-------|-----------------|----------------|
| "Phulara Ridge Trek" | Finds it from CMS → full trek card | Phase 1 done (dynamic Fuse) |
| "uttarakhand" | All CMS treks with state=Uttarakhand | Phase 1 done (state tags) |
| "Summer treks" | Treks with season April–August | Phase 1 done (season tags) |
| "Beginner" | Easy/Beginner treks | Phase 1 done (difficulty tags) |
| "March" | Treks open in March | Phase 1 done (month tags) |
| "Snow trek" | Treks with snow tags | Phase 1: partial. Phase 2: semantic |
| "Budget trek under 10k" | Cost-filtered treks | Phase 2: intent detection |
| "treks near Delhi" | Uttarakhand + Himachal treks | Phase 2: city-to-state mapping |
| "7 day trek" | Duration ≈ 7 days | Phase 2: duration intent |
| "Kedarkantha vs Brahmatal" | Comparison content + both treks | Phase 2: semantic |
| "Valley of Flowers permit" | Permit guide for VoF | Phase 2: entity + page_type |
| "family trek monsoon" | Multi-attribute match | Phase 2: semantic |
| Typo: "kederkantha" | Did You Mean suggestion | Phase 1 done (didYouMean Fuse) |
| Very short "k" | Show trending only, no search | Already handled |
| Empty | Show recent + trending | Already handled |
| No matches | Empty state with suggestions | Already handled |

### Phase 2 Files to Create/Modify

#### Backend
- `services/api/app/modules/search/service.py` — enhance `find_similar_to_query()`, add BM25 text match, intent detection
- `services/api/app/api/routes/search.py` — extend `/search` endpoint to accept `page_type` filter, `limit`, and return trek_* metadata
- Install `pg_trgm` extension in PostgreSQL (for fuzzy autocomplete)

#### Frontend
- `apps/web-next/app/(public)/search/page.tsx` — replace Fuse.js for 5+ char queries with backend semantic call; keep Fuse for instant short queries; add intent detection client-side
- `apps/web-next/lib/api.ts` — new `searchTreks(q, filters)` function

### Search URL Structure
| Endpoint | Notes |
|----------|-------|
| `GET /api/v1/search?q=&limit=&page_type=` | Semantic search (pgvector) |
| `GET /api/v1/search/suggestions?q=&limit=` | CMS autocomplete (text match) |
| `GET /api/v1/search/trending?limit=` | Most searched queries |
| `POST /api/v1/search/log` | Log click events for analytics |

### Trending Logic (Enhanced in Phase 2)
- Only queries that resulted in a CLICK should be logged (not every search submission)
- Minimum 3 chars, minimum 2 occurrences (already implemented in Phase 1)
- Trending should exclude brand queries ("TrekYatra"), very generic terms ("trek")
- Trending should be grouped by semantic similarity (de-dupe "Kedarkantha" + "kedarkantha trek")

### Dependencies
- pgvector already installed and `cms_pages.embedding vector(1536)` column exists ✅
- Embedding agent runs post-publish ✅
- OpenAI API key configured (`OPENAI_API_KEY`) ✅
- `/api/v1/search?q=` endpoint exists with basic pgvector query ✅
- fetchAllCMSTreks() and buildSearchTags() implemented ✅

### Acceptance Criteria for Phase 2
- [ ] Query "Phulara Ridge Trek" → shows trek with real image (Phase 1 done)
- [ ] Query "uttarakhand" → shows all 10+ CMS Uttarakhand treks (Phase 1 done)
- [ ] Query "summer treks" → shows treks with season Apr–Sep (Phase 1 done)
- [ ] Query "beginner" → shows Easy/Easy-Moderate treks (Phase 1 done)
- [ ] Query "budget trek 5 days" → semantic match from backend
- [ ] Query "treks near Delhi" → Uttarakhand/Himachal results
- [ ] Trending shows only meaningful 3+ char queries searched 2+ times (done)
- [ ] Search results ranked by relevance, not alphabetical (Phase 2)
- [ ] Tab filtering (Treks/Guides/Packing/Permits) works correctly (Phase 2)
