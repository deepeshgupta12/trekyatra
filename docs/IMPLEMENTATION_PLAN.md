# TrekYatra Stepwise Implementation Plan

## Step 00 — Repo bootstrap and governance docs
- Create repo structure
- Preserve uploaded static frontend untouched
- Create master tracker, process guardrails, dependency map, implementation plan, and step docs

## Step 01 — Backend foundation and local infra scaffold
- Create FastAPI project structure
- Add settings, health route, basic app boot
- Add Docker Compose for Postgres and Redis
- Add backend dependency files and makefile/scripts

## Step 02 — Database, config, and auth data model foundation
- SQLAlchemy/Alembic setup
- Base models
- User/auth/session/role tables
- Env setup

## Step 03 — Auth APIs foundation
- email auth contracts
- password hashing
- JWT/session cookie strategy
- placeholder Google/mobile auth interfaces

## Step 04 — Static frontend audit and dynamic wiring plan
- inspect current Vite frontend
- create migration/wiring blueprint
- decide coexistence or migration path to Next.js

## Step 05 — WordPress integration foundation
- config model
- REST client skeleton
- health/test connectivity endpoints

## Step 06 — Content domain foundation
- topics, clusters, briefs, drafts data model + APIs

## Step 07 — Internal admin foundation
- backend support for dashboard summaries
- wire static admin views to live placeholder APIs

## Step 08 — Public frontend data integration phase 1
- wire homepage/explore/trek detail to backend mock/live APIs

## Step 09 — User account foundation on frontend
- sign in/up integration, dashboard wiring

## Step 10 — Publish, tracking, and validation workflows
- publish logs, trackers, smoke tests, repo graph updates

## Rule
Do not start the next step without user confirmation.
