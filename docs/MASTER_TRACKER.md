# TrekYatra Master Tracker

## Purpose
This file is the source of truth for implementation progress. It must be read before every step.

## Product Scope References
- Master business/product scope: `/mnt/data/Travel_Blog.md`
- Static frontend source of truth: `apps/web-static/`
- Process discipline: `docs/PROCESS_GUARDRAILS.md`
- Dependency discipline: `docs/DEPENDENCY_MAP.md`
- Step plan: `docs/IMPLEMENTATION_PLAN.md`

## Current Execution Rule
Do not modify any code file without first:
1. Reading this tracker
2. Reading `docs/PROCESS_GUARDRAILS.md`
3. Reading `docs/DEPENDENCY_MAP.md`
4. Checking impacted files and blast radius
5. Updating the relevant step file in `docs/steps/`

## Current Status
- Project repo scaffold: done
- Static frontend zip unpacked into `apps/web-static`: done
- Backend scaffold: pending
- Database scaffold: pending
- Docker/local infra: pending
- Auth foundation: pending
- WordPress integration: pending
- API contracts: pending
- Dynamic frontend wiring: pending
- Nexus/GitNexus workflow setup: pending

## Step History
### Step 00 — Repo bootstrap, docs, and source-of-truth setup
Status: in progress
What is done:
- Monorepo folders created
- Uploaded frontend preserved untouched in `apps/web-static`
- Tracker, process, dependency, and implementation docs created
What is pending:
- User to run bootstrap commands locally
- User to confirm repository structure is created successfully

## Rules for Future Updates
- Every completed step must update:
  - this file
  - the relevant `docs/steps/STEP-XX-*.md`
  - `docs/DEPENDENCY_MAP.md` if dependencies changed
- Never assume a file exists unless confirmed in repo or created in an earlier step
