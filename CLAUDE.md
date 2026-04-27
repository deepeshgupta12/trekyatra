<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **trekyatra** (4519 symbols, 7744 relationships, 165 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/trekyatra/context` | Codebase overview, check index freshness |
| `gitnexus://repo/trekyatra/clusters` | All functional areas |
| `gitnexus://repo/trekyatra/processes` | All execution flows |
| `gitnexus://repo/trekyatra/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# TrekYatra — Mandatory Execution Protocol

These rules apply to **every step, every version, every code change** in this project. They are non-negotiable and override any default behavior.

---

## 1. Pre-Step Checklist (Before Writing Any Code)

Run all of these before touching a single file:

1. Read `docs/MASTER_TRACKER.md` — confirm current step and what is pending
2. Read `docs/DEPENDENCY_MAP.md` — understand structural dependencies
3. Read `docs/PROCESS_GUARDRAILS.md` — re-confirm process rules
4. Read the **active step doc** in `docs/steps/STEP-XX-*.md` — this is the scope contract
5. Read `docs/TRAVEL_BLOG.md` section relevant to this step's feature area — confirm product intent
6. Run `gitnexus_query` and `gitnexus_impact` on every symbol you plan to modify — report blast radius before coding
7. Confirm all required local services are running (Postgres, Redis, WordPress as needed)
8. Confirm the previous step's tests still pass (`make test`) before starting new work

Do not begin implementation until all 8 checks are complete.

---

## 2. Implementation Order (Within Every Step)

Always implement in this sequence. Do not skip or reorder:

1. **Database / migration** — if new tables or columns, write and run the Alembic migration first
2. **Backend models** — ORM models and `db/base.py` registration
3. **Backend schemas** — Pydantic request/response contracts
4. **Backend service layer** — business logic in `modules/*/service.py`
5. **Backend API routes** — endpoints wired to service layer
6. **Backend tests** — pytest tests covering happy path, error cases, and edge cases
7. **Backend build validation** — confirm all backend tests pass (`make test`)
8. **Frontend data layer** — `lib/*.ts` API client functions for new endpoints
9. **Frontend components** — new UI components (no inline logic)
10. **Frontend pages** — wire pages to components and data layer
11. **Frontend build validation** — `next build` must pass with zero errors
12. **Integration smoke test** — end-to-end curl + browser spot check

Never implement frontend against stubbed/assumed backend contracts — always wire to a working endpoint.

---

## 3. Testing Requirements

### Backend tests (automated, mandatory)
- Every new API route must have at least one test: happy path, one error/edge case
- Every new service function with business logic must have a unit test
- Every new state machine transition must be tested (valid + invalid transition)
- Every agent must have a mocked integration test (mock the LLM call, test input/output contract)
- After implementing, run the **full test suite**, not just new tests — no regressions allowed
- Failing tests must be fixed before proceeding. Do not skip or comment out tests.

```bash
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v
```

### Frontend build test (automated, mandatory)
- `next build` must pass with zero TypeScript errors and zero build errors
- Run this before every git commit involving frontend changes

```bash
cd apps/web-next && npm run build
```

### Frontend test cases (manual, delivered to user)
At the end of every step that includes frontend changes, provide a **Frontend Test Cases** section in the step completion message. Format:

```
## Frontend Test Cases — Step XX

### TC-01: [Test case name]
**URL:** http://localhost:3000/path
**Steps:**
1. Step to take
2. Step to take
**Expected:** What should happen
**Pass criteria:** What confirms it works

### TC-02: ...
```

Cover: happy path, empty state, error state, mobile layout (resize to 375px), and any auth-gated flows. These are delivered to the user who will manually test and confirm before the step is closed.

---

## 4. MD File Update Rules

Every step **must** update all of the following before being marked done. No exceptions:

| File | What to update |
|------|---------------|
| `docs/MASTER_TRACKER.md` | Move step from "pending" to "done"; document what was done and what remains |
| `docs/DEPENDENCY_MAP.md` | Add new files, modules, and blast radius notes for this step |
| `docs/steps/STEP-XX-*.md` | Update "Files Created", "Files Modified", set Status to `Done`, add Notes |
| `docs/IMPLEMENTATION_PLAN.md` | Mark step as `[DONE]` in the version table |

Also update if applicable:
- `docs/LOCAL_WORDPRESS_SETUP.md` — if WP config or services changed
- `docs/FRONTEND_WIRING_BLUEPRINT.md` — if new frontend API surfaces were wired

Do not mark a step as `Done` in the step file until all four core MD files are updated.

---

## 5. Git Rules

### When to commit
- One commit per step (or one commit per logical sub-unit if the step is large)
- Commit only after: all backend tests pass + `next build` passes + all MD files updated

### Commit message format
```
feat: step N — <short description>

What was done:
- <bullet: specific file or capability delivered>
- <bullet: specific file or capability delivered>
- <N tests added; total/total pass>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Every commit body **must** include a `What was done:` block that lists every meaningful file, endpoint, migration, or feature delivered. Do not write vague bullets — name the file or the capability.

Example:
```
feat: step 11 — worker and task queue infrastructure

What was done:
- Celery app wired to Redis DB 1 broker/backend (app/worker/celery_app.py)
- BaseTask with max_retries=3, backoff=60s, on_failure/on_retry hooks (tasks/base.py)
- smoke.ping task for end-to-end queue validation (tasks/smoke.py)
- GET /api/v1/worker/health endpoint checking live broker connectivity (routes/worker.py)
- worker + beat services added to docker-compose.yml under profiles: [worker]
- make worker and make beat targets added to Makefile
- 4 new tests; 54/54 pass

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### When to push
- Push to remote (`git push origin main`) only after:
  1. All automated tests pass (zero failures)
  2. `next build` passes with zero errors
  3. All required MD files are updated
  4. GitNexus re-indexed (`npx gitnexus analyze --force`)
  5. User has confirmed or there is no pending user confirmation required

### Never push if
- Any pytest test is failing
- `next build` has TypeScript errors or build errors
- A migration has been created but not run (`alembic upgrade head` not executed)
- MD files have not been updated for the step

---

## 6. GitNexus Re-Index Rule

Run `npx gitnexus analyze --force` after every step that:
- Creates or deletes any `.py` or `.ts`/`.tsx` file
- Adds a new module directory
- Changes a route registration or imports a new module

Record the new symbol/edge/flow counts in the step doc Notes and in `docs/MASTER_TRACKER.md`.

---

## 7. Anti-Hallucination Rules

- Do not assume a file exists — read it first with the Read tool
- Do not assume an API endpoint exists — check `docs/DEPENDENCY_MAP.md` or grep for the route
- Do not assume a DB table exists — check the alembic versions or the ORM models
- Do not assume env vars are set — check `.env.example` or `core/config.py`
- Do not assume a package is installed — check `requirements.txt` or `package.json`
- Never implement against a "planned" dependency that does not exist yet in code
- Never merge multiple major steps into one without explicit user approval
- If scope is unclear, ask before implementing — do not guess intent
- If a file has more than one possible interpretation, re-read it before editing
- Do not write placeholder comments like `# TODO: implement this` and leave them — either implement it or explicitly flag it to the user as out of scope for this step

---

## 8. Scope Discipline Rules

- Implement **only** what the active step doc specifies
- Do not add "nice to have" features, refactors, or improvements beyond the step scope
- Do not touch files not listed in the step's "Files to Create" or "Files to Modify" unless a direct dependency break requires it (and if so, flag it explicitly)
- If you discover a bug in code from a previous step, do not fix it silently — report it to the user and fix it in a separate, clearly labelled commit
- If a dependency from a previous step is missing or broken, stop and report — do not work around it silently

---

## 9. Environment and Config Rules

- Every new environment variable must be:
  1. Added to `services/api/.env.example` (backend) or `apps/web-next/.env.local.example` (frontend)
  2. Added to `services/api/app/core/config.py` Settings class with a default or required flag
  3. Documented in the step doc Notes section
- Never hardcode secrets, API keys, or credentials in code
- Never commit `.env` or `.env.local` files
- Docker images must be arm64-compatible (Apple Silicon M1 development machine)

---

## 10. Database / Migration Rules

- Never modify an existing migration file — always create a new one
- Migration naming: `YYYYMMDD_NNNN_<descriptive_name>.py`
- Always run `alembic upgrade head` and confirm success before writing tests that touch the DB
- Every new ORM model must be imported in `services/api/app/db/base.py` (the metadata registry)
- Never use `alembic downgrade` in development without user confirmation — it is destructive

---

## 11. Step Completion Gate

A step is **not done** until every item in this checklist is confirmed:

- [ ] All planned backend files created and implement the step scope
- [ ] All planned frontend files created and implement the step scope
- [ ] Alembic migration created and `alembic upgrade head` run (if DB changes)
- [ ] All backend pytest tests pass (zero failures, zero skipped without reason)
- [ ] `next build` passes with zero errors
- [ ] GitNexus re-indexed (`npx gitnexus analyze --force`)
- [ ] GitNexus detect_changes run and blast radius matches expected scope
- [ ] `docs/MASTER_TRACKER.md` updated
- [ ] `docs/DEPENDENCY_MAP.md` updated with new files and blast radius notes
- [ ] Active step doc status set to `Done` with notes
- [ ] `docs/IMPLEMENTATION_PLAN.md` step marked `[DONE]`
- [ ] All new env vars documented in `.env.example`
- [ ] Git commit created with correct format
- [ ] Git push executed (after all above pass)
- [ ] **Frontend Test Cases** delivered to user in the completion message

Only after ALL items above are checked off does the message "Step X is complete" get sent to the user.

---

## 12. Frontend Test Case Delivery Standard

Every step with frontend changes must end with a formatted test case block in the final message to the user. This is how the user validates the step before confirming it closed.

### Format
```
## Frontend Test Cases — Step XX: [Step Title]

Run: cd apps/web-next && npm run dev (then open http://localhost:3000)

### TC-01: [Feature name — happy path]
URL: http://localhost:3000/path
Steps:
  1. ...
  2. ...
Expected result: ...
Pass = ...

### TC-02: [Feature name — empty/error state]
...

### TC-03: [Mobile layout]
Resize browser to 375px width.
Visit: http://localhost:3000/path
Expected: ...

### TC-04: [Auth-gated behavior, if applicable]
...
```

Cover at minimum: happy path, one error/edge case, mobile layout check, and any auth-sensitive flows. Label each test case TC-01, TC-02, etc. so the user can report back by number.

---

## 13. Communication Rules

- At the start of each step, state: current step number, what will be implemented, and confirm the pre-step checklist is done
- Report blast radius results before making any code changes
- Report each sub-task as it completes (migration done, routes done, tests passing, build clean, etc.)
- If anything deviates from the step doc scope, flag it explicitly before implementing
- After git push, state: commit hash, what was pushed, and list the frontend test cases
- Never say "step X is complete" without delivering the full step completion gate checklist

---

## Source-of-Truth Files

| What | Where |
|------|-------|
| Product scope | `docs/TRAVEL_BLOG.md` |
| Current progress | `docs/MASTER_TRACKER.md` |
| Step plan | `docs/IMPLEMENTATION_PLAN.md` |
| Dependency map | `docs/DEPENDENCY_MAP.md` |
| Process rules | `docs/PROCESS_GUARDRAILS.md` + this file |
| Active step | `docs/steps/STEP-XX-*.md` |
| Frontend source | `apps/web-next/` |
| Backend source | `services/api/` |

---

## 14. Terminal Commands Reference

All commands are run from the **project root** (`/Users/deepeshgupta/Projects/trekyatra`) unless stated otherwise. Never run BE or Celery commands from the project root without `cd services/api` or the `make` wrapper — Python imports will break.

### Backend API
```bash
make api
# Expands to: cd services/api && ../../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Runs on: http://localhost:8000
```

### Frontend Dev Server
```bash
# Must be run from apps/web-next — NOT from project root
cd /Users/deepeshgupta/Projects/trekyatra/apps/web-next && npm run dev
# Runs on: http://localhost:3000
```
To restart the FE terminal via Bash tool (redirect output to background):
```bash
pkill -f "next dev" 2>/dev/null; sleep 1
cd /Users/deepeshgupta/Projects/trekyatra/apps/web-next && npm run dev > /tmp/next-dev.log 2>&1 &
sleep 7 && tail -6 /tmp/next-dev.log   # confirm "Ready"
```
If the dev server shows 404s for `/_next/static/chunks/*`, delete `.next/` and restart:
```bash
rm -rf /Users/deepeshgupta/Projects/trekyatra/apps/web-next/.next
```

### Celery Worker
```bash
make worker
# Expands to: cd services/api && ../../.venv/bin/celery -A app.worker.celery_app worker --loglevel=info
# Worker MUST be killed and restarted after any change to celery_app.py or tasks/
# Verify all agent tasks registered at startup: [tasks] should list agents.discover_trends, agents.cluster_keywords, etc.
```

### Celery Beat
```bash
make beat
# Expands to: cd services/api && ../../.venv/bin/celery -A app.worker.celery_app beat --loglevel=info
```

### Backend Tests
```bash
# From project root:
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v
# Never run pytest without PYTHONPATH=services/api — imports will fail
```

### DB Migrations
```bash
# From project root:
cd services/api && ../../.venv/bin/alembic upgrade head
# Or use make shortcut:
make db-upgrade
```

### Frontend Build (CI gate)
```bash
cd apps/web-next && npm run build
# Must pass with zero TypeScript errors before every commit
```

### GitNexus Re-index
```bash
npx gitnexus analyze --force   # run from project root
# Always run after creating/deleting .py or .ts/.tsx files
```

---

## 15. Frontend Admin UI Design System

All admin pages live under `apps/web-next/app/(admin)/admin/`. Every new or modified admin page **must** follow these patterns exactly. Do not introduce new color tokens, card styles, or layout patterns without updating this section.

### Color Palette

| Role | Tailwind class | Value |
|------|---------------|-------|
| Page background | `bg-[#0c0e14]` | Near-black |
| Sidebar / header | `bg-[#0f1117]` | Dark navy |
| Card background | `bg-[#14161f]` | Slightly lighter |
| Card border | `border-white/10` | 10% white |
| Dividers | `border-white/8` | 8% white |
| Text — primary | `text-white` | — |
| Text — secondary | `text-white/70` | — |
| Text — label | `text-white/50` | — |
| Text — muted | `text-white/30` or `/40` | — |
| Accent (brand orange) | `text-accent` / `bg-accent` | `hsl(22 92% 54%)` |
| Pine (success/live) | `text-pine` / `bg-pine/10` | `hsl(162 50% 42%)` |
| Blue (in-progress) | `text-blue-400` / `bg-blue-400/10` | — |
| Amber (warning/uncovered) | `text-amber-400` / `bg-amber-400/10` | — |
| Purple (briefs/draft) | `text-purple-400` / `bg-purple-500/10` | — |
| Red (error/failed) | `text-red-400` / `bg-red-400/10` | — |

### Typography

| Use | Class |
|-----|-------|
| Page heading (H1) | `font-display text-2xl font-semibold text-white` |
| Section heading (H2) | `font-semibold text-sm text-white` |
| Card label | `text-xs text-white/40 font-medium` |
| Body / table | `text-sm text-white/80` |
| Log / mono output | `font-mono text-xs` |

### Page Header Pattern (all admin pages)
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
  <div>
    <h1 className="font-display text-2xl font-semibold text-white mb-1">Page Title</h1>
    <p className="text-white/50 text-sm">One-line subtitle.</p>
  </div>
  <div className="flex flex-col gap-2 sm:items-end">
    {/* primary action button */}
    <Button variant="hero" size="sm" className="w-fit">Action</Button>
    {/* status/feedback messages go here */}
  </div>
</div>
```

### Card Pattern
```tsx
<div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
  {/* content */}
</div>
```
Card with header + content divider:
```tsx
<div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
  <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
    <h2 className="text-white font-semibold text-sm">Section Title</h2>
    <Link href="..." className="text-accent text-xs font-medium">View all →</Link>
  </div>
  {/* body */}
</div>
```

### Table Pattern (responsive)
```tsx
<div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm min-w-[480px]">
      <thead>
        <tr className="border-b border-white/8">
          <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Column A</th>
          <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Column B</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
            <td className="px-4 py-3.5 text-white/80 font-medium text-xs sm:text-sm">{row.primary}</td>
            <td className="px-4 py-3.5 text-white/50 text-xs hidden sm:table-cell">{row.secondary}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```
Rule: always wrap tables in `overflow-x-auto`. Hide low-priority columns below `sm` (`hidden sm:table-cell`). Action columns hide below `md`.

### Status Badge Pattern
```tsx
// Colour map — use consistently across all pages
const statusStyle = {
  uncovered:    "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  "in-progress":"text-blue-400  bg-blue-400/10  border border-blue-400/20",
  covered:      "text-white/40  bg-white/5      border border-white/10",
  pending:      "text-white/40  bg-white/5      border border-white/10",
  ready:        "text-pine      bg-pine/10      border border-pine/20",
  approved:     "text-pine      bg-pine/10      border border-pine/20",
  live:         "text-pine      bg-pine/10      border border-pine/20",
  review:       "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  failed:       "text-red-400   bg-red-400/10   border border-red-400/20",
  generating:   "text-blue-400  bg-blue-400/10  border border-blue-400/20",
  rejected:     "text-red-400   bg-red-400/10   border border-red-400/20",
};

<span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[status]}`}>
  {label}
</span>
```

### Button Variants
| Variant | When to use | Class |
|---------|-------------|-------|
| `variant="hero"` | Primary CTA (trigger agent, approve, publish) | Orange gradient, glow shadow |
| `variant="outline"` | Secondary actions | `className="border-white/20 text-white/60 hover:text-white"` |

### KPI Card Pattern
```tsx
<div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
  <div className="bg-accent/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
    <Icon className="h-4 w-4 text-accent" />
  </div>
  <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{value}</p>
  <p className="text-white/50 text-xs">{label}</p>
  <p className="text-white/25 text-xs mt-1">{delta}</p>
</div>
```

### Admin Layout (sidebar + responsive)
- Desktop sidebar: fixed `w-56`, `bg-[#0f1117]`, grouped nav (Pipeline / Growth / System)
- Nav active state: `bg-accent/15 text-accent font-semibold border border-accent/20 rounded-xl`
- Nav inactive: `text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent rounded-xl`
- Mobile: hamburger button triggers slide drawer; sidebar hidden below `lg`
- Main content margin: `lg:ml-56`
- Header height: `h-14`, sticky, `bg-[#0f1117]/90 backdrop-blur`

### Mobile Rules
- Page headers: always use `flex flex-col gap-3 sm:flex-row` — never bare `justify-between` which breaks at 375px
- Input + button pairs: `flex flex-col sm:flex-row` — stack on mobile, row on wider
- Wide inputs: `w-full sm:w-64` — never fixed `w-72` without responsive override
- Buttons in mobile stacks: add `w-full sm:w-auto` when in a column layout

---

## 16. Inter-Step Dependency Check Protocol

When the user reports a test case failure, runtime error, or unexpected behaviour, **always check cross-step dependencies before debugging the symptom**. Many bugs root-cause in a dependency from a prior step that was assumed but is broken or missing.

### Mandatory checks when an issue is reported

1. **Run `gitnexus_context({name: "failingSymbol"})` first** — see all callers, callees, and which steps touched this symbol.
2. **Cross-check `docs/DEPENDENCY_MAP.md`** — confirm the dependency (endpoint, column, model, task) was actually delivered in the step that should have created it.
3. **Verify the migration ran** — `alembic upgrade head` output confirms columns exist. Never assume a column or table is present without checking.
4. **Verify the Celery worker was restarted** — workers do NOT hot-reload. Any step that adds a new Celery task requires a full worker restart (`pkill -f "celery.*worker" && make worker`). Confirm the new task appears in the `[tasks]` block at startup.
5. **Verify router registration order** — static admin routes (e.g. `/admin/briefs/summary`) MUST be registered before dynamic routes (`/admin/briefs/{id}`). In `router.py`, `admin_router` must always come before `content_router`.
6. **Check LLM token budgets** — agents that generate longer outputs than previous steps may truncate JSON. Always set `max_tokens` high enough for the full expected output. Add try/except around `json.loads()` in every agent node that parses LLM output.
7. **Check schema field parity** — new ORM columns must be added to both Create and Response Pydantic schemas. A missing field in Response silently drops the value.

### Common inter-step failure patterns

| Symptom | Root cause to check |
|---------|-------------------|
| Celery task dispatched but never received | Worker not restarted after new task added |
| `JSONDecodeError` in agent | `max_tokens` too low; LLM response truncated |
| 400 on `/admin/briefs/summary` | Dynamic `/{id}` route registered before static `/summary` |
| Column missing at runtime | Migration created but `alembic upgrade head` not run |
| Schema field returns `null` unexpectedly | Field added to ORM but missing from Pydantic Response schema |
| Agent `errors: ["not found"]` on valid ID | Prior step's data not committed, or wrong UUID passed |
| Test passes but UI broken | Frontend still using mocked data; `loadBriefs` not wired to real API |
