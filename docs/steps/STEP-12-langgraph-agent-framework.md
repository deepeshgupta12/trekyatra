# STEP 12 — LangGraph Agent Framework + Agent Tracking

## Goal
Establish the shared agent orchestration layer using LangGraph. Create the `agent_runs` table to track every agent execution. Define the base state interface all agents will use. Lay the foundation that Steps 13–15 will build on.

## Scope
- Install `langgraph`, `anthropic`, `langchain-anthropic`, `langchain-core`
- `agent_runs` ORM model + Alembic migration
- Base agent state TypedDict (shared across all agents)
- BaseAgent class wrapping LangGraph StateGraph
- AgentRunService: start_run, update_run, complete_run, fail_run
- Admin API: GET /api/v1/admin/agent-runs (list with filters)
- Tests for agent run CRUD and service

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 11 is complete (Celery worker running)
- Confirm GitNexus graph is up to date

## Dependency Check
- `services/api/app/modules/content/models.py` — no change; agent_runs is a new independent module
- `services/api/app/db/base.py` — additive: register AgentRun model
- `services/api/app/api/router.py` — additive: include agent_runs sub-router under admin
- New Alembic migration for `agent_runs` table

## Planned Files to Create
- `services/api/app/modules/agents/__init__.py`
- `services/api/app/modules/agents/models.py` — AgentRun ORM (id, agent_type, status, input_json, output_json, error, started_at, completed_at)
- `services/api/app/modules/agents/state.py` — BaseAgentState TypedDict
- `services/api/app/modules/agents/base_agent.py` — BaseAgent wrapping LangGraph StateGraph
- `services/api/app/modules/agents/service.py` — AgentRunService methods
- `services/api/app/schemas/agents.py` — AgentRunResponse Pydantic schema
- `services/api/alembic/versions/20260422_0005_agent_runs.py` — migration
- `services/api/tests/test_agent_runs.py` — agent run CRUD tests

## Planned Files to Modify
- `services/api/app/db/base.py` — register AgentRun
- `services/api/app/api/router.py` — register agent_runs route
- `services/api/requirements.txt` — add langgraph, anthropic, langchain-anthropic, langchain-core
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install

# Apply migration
cd services/api && alembic upgrade head

# Run tests
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

make api
curl http://localhost:8000/api/v1/admin/agent-runs

npx gitnexus analyze --force
```

## Files Created
- `services/api/app/modules/agents/__init__.py`
- `services/api/app/modules/agents/models.py`
- `services/api/app/modules/agents/state.py`
- `services/api/app/modules/agents/base_agent.py`
- `services/api/app/modules/agents/service.py`
- `services/api/app/schemas/agents.py`
- `services/api/app/api/routes/agent_runs.py`
- `services/api/alembic/versions/20260422_0005_agent_runs.py`
- `services/api/tests/test_agent_runs.py`

## Files Modified
- `services/api/pyproject.toml` — anthropic, langchain-core, langchain-anthropic, langgraph added
- `services/api/app/core/config.py` — anthropic_api_key setting added
- `services/api/app/db/base.py` — AgentRun registered
- `services/api/app/api/router.py` — agent_runs_router registered
- `services/api/.env.example` — ANTHROPIC_API_KEY documented
- `docs/MASTER_TRACKER.md`, `docs/DEPENDENCY_MAP.md`, `docs/IMPLEMENTATION_PLAN.md`

## Status
Done

## Notes
- AgentRun.status values: pending, running, completed, failed, cancelled
- AgentRun.agent_type: string enum — trend_discovery, keyword_cluster, content_brief, content_writing, seo_aeo, publishing, refresh, internal_linking
- BaseAgentState TypedDict: run_id, agent_type, input, output, errors[], metadata{}
- BaseAgent.run() invokes the compiled LangGraph; subclasses implement _build_graph()
- Anthropic API key: set ANTHROPIC_API_KEY in services/api/.env; loaded via settings.anthropic_api_key
- Migration 20260422_0005 applied; agent_runs table live with status/agent_type indexes
- 61/61 backend tests pass after Step 12 (54 prior + 7 new agent_runs tests)
