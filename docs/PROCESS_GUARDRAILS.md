# TrekYatra Process Guardrails

> The full execution protocol lives in `CLAUDE.md`. This file is a quick-reference summary. When in doubt, CLAUDE.md is the authority.

---

## Pre-Step Checklist (all 8 must be done before writing code)
1. Read `docs/MASTER_TRACKER.md`
2. Read `docs/DEPENDENCY_MAP.md`
3. Read the active step doc in `docs/steps/STEP-XX-*.md`
4. Read the relevant section of `docs/TRAVEL_BLOG.md` for product intent
5. Run `gitnexus_impact` on every symbol you plan to modify; report blast radius
6. Confirm all required local services are running
7. Confirm the previous step's tests still pass (`make test`)
8. Do not begin implementation until all 8 are confirmed

---

## Implementation Order (within every step)
1. DB migration (if needed) → run `alembic upgrade head`
2. Backend ORM models + `db/base.py` registration
3. Backend Pydantic schemas
4. Backend service layer
5. Backend API routes
6. Backend pytest tests → all must pass before touching frontend
7. Frontend data layer (`lib/*.ts`)
8. Frontend components
9. Frontend pages
10. Frontend build: `next build` must pass with zero errors
11. Integration smoke test (curl + browser spot check)

---

## Non-Negotiable Rules
- Never implement against a planned dependency that does not exist yet in code
- Never merge multiple major steps into one without explicit user approval
- Never modify existing Alembic migration files — always create new ones
- Never hardcode secrets, API keys, or credentials
- Never push if any test fails or `next build` has errors
- Never mark a step Done without updating all 4 MD files
- Never say "step X is complete" without delivering Frontend Test Cases to the user

---

## MD Files — Mandatory Updates Per Step
| File | Update |
|------|--------|
| `docs/MASTER_TRACKER.md` | Step status + what was done / what remains |
| `docs/DEPENDENCY_MAP.md` | New files, modules, blast radius notes |
| `docs/steps/STEP-XX-*.md` | Files created/modified, Status → Done, Notes |
| `docs/IMPLEMENTATION_PLAN.md` | Step marked `[DONE]` |

---

## Git Rules
- Commit format: `feat: step N — <short description>`
- Push only after: all tests pass + `next build` clean + all MD files updated + GitNexus re-indexed
- One commit per step (or one per logical sub-unit for large steps)

---

## Step Completion Gate (all must be true before "Step X is complete")
- [ ] All backend tests pass (zero failures)
- [ ] `next build` passes (zero errors)
- [ ] Alembic migration run (`alembic upgrade head`)
- [ ] GitNexus re-indexed (`npx gitnexus analyze --force`)
- [ ] GitNexus detect_changes run and scope matches
- [ ] All 4 MD files updated
- [ ] All new env vars in `.env.example`
- [ ] Git commit created + pushed
- [ ] Frontend Test Cases delivered to user

---

## Anti-Hallucination Rules
- Do not assume any file, endpoint, table, env var, or package exists — verify before referencing
- Do not write `# TODO` stubs without flagging them explicitly as out of scope
- Do not touch files outside the step's stated scope without flagging it
- If a bug is found in a previous step, report it; fix in a separate labelled commit
- If a dependency is missing or broken, stop and report — do not silently work around it
- Ask before implementing if scope is unclear — do not guess

---

## Environment Rules
- All new env vars: add to `.env.example` and `core/config.py` Settings
- All Docker images: must be arm64-compatible (Apple Silicon M1)
- Never commit `.env` or `.env.local`
