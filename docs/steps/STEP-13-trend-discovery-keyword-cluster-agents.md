# STEP 13 — Trend Discovery Agent + Keyword Cluster Agent

## Goal
Implement the first two production agents. Trend Discovery feeds the top of the content funnel by surfacing high-opportunity trek topics. Keyword Cluster organizes those topics into SEO silos with pillar/support page relationships.

## Scope

### Trend Discovery Agent
- Accepts: seed topics, region filters, optional source hints (manual input or keyword list)
- Outputs: prioritized topic list with trend score, urgency score, suggested page type, freshness requirement
- Initial data source: manual topic intake + basic scoring heuristics (Google Trends integration deferred to V2)
- Stores output as new Topics in the `topics` table with trend metadata

### Keyword Cluster Agent
- Accepts: list of topics or keyword terms
- Outputs: cluster map with pillar/support relationships, target keyword sets, intent tags, cluster competition score
- Stores output as `keyword_clusters` records linked to topics
- Detects basic cannibalization risk (overlapping keyword targets)

### Admin APIs
- POST /api/v1/admin/agents/discover-trends — trigger agent with topic seeds
- POST /api/v1/admin/agents/cluster-keywords — trigger agent with topic IDs
- Both run as async Celery tasks and return agent_run_id
- GET /api/v1/admin/agent-runs/{id} — poll for result

### Admin frontend
- Admin topics page wired to trigger trend discovery
- Admin clusters page wired to trigger keyword clustering
- Agent run status visible in admin logs page

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 12 is complete (LangGraph + agent_runs in place)
- ANTHROPIC_API_KEY configured in .env

## Dependency Check
- `app/modules/agents/base_agent.py` — consumed by both new agents
- `app/modules/agents/service.py` — used for run tracking
- `app/modules/content/models.py` — Topics and KeywordClusters tables written to
- `app/modules/content/service.py` — reused for topic and cluster creation
- No new DB migration unless trend metadata fields need new columns (extend existing topics table if needed)

## Planned Files to Create
- `services/api/app/modules/agents/trend_discovery/agent.py`
- `services/api/app/modules/agents/trend_discovery/prompts.py`
- `services/api/app/modules/agents/keyword_cluster/agent.py`
- `services/api/app/modules/agents/keyword_cluster/prompts.py`
- `services/api/app/api/routes/agent_triggers.py` — admin trigger endpoints
- `services/api/tests/test_agent_triggers.py`

## Planned Files to Modify
- `services/api/app/modules/content/models.py` — add trend_score, urgency_score, suggested_page_type to Topic if not present
- `services/api/app/api/router.py` — register agent_triggers router
- `apps/web-next/app/(admin)/admin/topics/page.tsx` — add trigger button
- `apps/web-next/app/(admin)/admin/clusters/page.tsx` — add trigger button
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v
make api

# Trigger trend discovery
curl -X POST http://localhost:8000/api/v1/admin/agents/discover-trends \
  -H 'Content-Type: application/json' \
  -d '{"seed_topics": ["kedarkantha trek", "brahmatal trek guide", "best winter treks india"]}'

# Poll result
curl http://localhost:8000/api/v1/admin/agent-runs/<run_id>

# Trigger cluster
curl -X POST http://localhost:8000/api/v1/admin/agents/cluster-keywords \
  -H 'Content-Type: application/json' \
  -d '{"topic_ids": ["<id1>", "<id2>"]}'

npx gitnexus analyze --force
```

## Files Created
- `services/api/app/modules/agents/trend_discovery/__init__.py`
- `services/api/app/modules/agents/trend_discovery/prompts.py`
- `services/api/app/modules/agents/trend_discovery/agent.py`
- `services/api/app/modules/agents/keyword_cluster/__init__.py`
- `services/api/app/modules/agents/keyword_cluster/prompts.py`
- `services/api/app/modules/agents/keyword_cluster/agent.py`
- `services/api/app/worker/tasks/agent_tasks.py`
- `services/api/app/api/routes/agent_triggers.py`
- `services/api/tests/test_agent_triggers.py`

## Files Modified
- `services/api/app/modules/agents/base_agent.py` — `_build_graph` return type fixed to `Any`
- `services/api/app/modules/agents/service.py` — `get_run` added
- `services/api/app/worker/celery_app.py` — `agent_tasks` added to `include`
- `services/api/app/api/routes/agent_runs.py` — `GET /{id}` endpoint added
- `services/api/app/api/router.py` — `agent_triggers_router` registered
- `apps/web-next/app/(admin)/admin/topics/page.tsx` — trigger button wired
- `apps/web-next/app/(admin)/admin/clusters/page.tsx` — trigger button wired
- `docs/MASTER_TRACKER.md`, `docs/DEPENDENCY_MAP.md`, `docs/IMPLEMENTATION_PLAN.md`

## Status
Done

## Notes
- Trend Discovery v1 will use Claude to score topic opportunity from seed keywords, not live Google Trends (that integration is V2)
- Keyword Cluster will use Claude to group topics semantically into pillar/support clusters
- Both agents must create an AgentRun record at start, update on completion/failure
- If ANTHROPIC_API_KEY is not set, agents should fail gracefully with a clear error (not crash the API)
- Cannibalization detection: flag if two topics have >80% keyword overlap across cluster targets
