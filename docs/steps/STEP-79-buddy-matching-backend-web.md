# STEP-79 — Trek Buddy Matching (Shared Backend + Web Surfaces)

**Status:** Done
**Phase:** Community
**Paired with:** STEP-M18 (mobile surfaces — consume the same API)
**Dependencies:** Auth (Step 02), Trek detail page `/trek/[slug]`, Account area `/account/*`, User profiles (Step 33), Trek history (STEP-M16)

---

## Scope

Shared backend and web surfaces for Trek Buddy Matching. Lets registered users post a "I'm planning this trek" signal for a given month, browse other trekkers planning the same route, send buddy requests, chat in-app once a request is accepted, and view a limited public trekker profile — all without exposing contact details until mutual accept.

Expanded scope (confirmed with user):
1. **In-app chat** — text messaging between users with an accepted buddy request (polling-based, no WebSocket for V5)
2. **Public trekker profiles** — limited profile page accessible via signal context (name, avatar, bio, experience, trek count) — visible before mutual accept but contact info only shared after accept

---

## New URLs (CLAUDE.md §17 — all confirmed)

| URL | Type | Notes |
|-----|------|-------|
| `/account/buddy-requests` | Web page | Received/sent buddy requests + accepted chat |
| `/trekker/[signalId]` | Web page | Public trekker profile (scoped via signal ID for privacy) |
| `/api/v1/public/treks/{slug}/buddy-count` | Public GET | Count of active signals — no auth required |
| `/api/v1/public/trekkers/{signal_id}` | Public GET | Public trekker profile via signal ID |
| `/api/v1/buddies/signals` | Auth POST | Create/replace signal |
| `/api/v1/buddies/signals/{trek_slug}` | Auth GET | Full anonymised signal list for a trek |
| `/api/v1/buddies/signals/{id}` | Auth DELETE | Deactivate own signal |
| `/api/v1/buddies/requests` | Auth POST | Send buddy request |
| `/api/v1/buddies/requests/received` | Auth GET | Incoming requests (MUST register before `/{id}`) |
| `/api/v1/buddies/requests/sent` | Auth GET | Outgoing requests (MUST register before `/{id}`) |
| `/api/v1/buddies/requests/{id}` | Auth PATCH | Accept or reject |
| `/api/v1/buddies/requests/{id}/messages` | Auth GET/POST | Chat messages for accepted request |
| `/api/v1/buddies/requests/{id}/messages/read` | Auth POST | Mark all messages as read |

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/alembic/versions/20260625_0050_buddy_matching.py` | Migration: `buddy_signals`, `buddy_requests`, `buddy_chat_messages` + `bio`/`avatar_url` columns on `user_profiles` |
| `services/api/app/modules/buddies/__init__.py` | Module init |
| `services/api/app/modules/buddies/models.py` | ORM: `BuddySignal`, `BuddyRequest`, `BuddyChatMessage` |
| `services/api/app/modules/buddies/schemas.py` | Pydantic: `SignalIn`, `SignalOut`, `BuddyCountOut`, `BuddyRequestIn`, `BuddyRequestOut`, `BuddyResponseIn`, `ChatMessageIn`, `ChatMessageOut`, `TrekkerProfileOut` |
| `services/api/app/modules/buddies/service.py` | All business logic |
| `services/api/app/api/routes/buddies.py` | Auth + public routes |
| `services/api/app/worker/tasks/buddies.py` | `expire_signals` Celery task |
| `services/api/tests/test_buddies_m18.py` | 12 backend tests |

### Web Frontend
| File | Purpose |
|------|---------|
| `apps/web-next/lib/buddies.ts` | API client + TypeScript interfaces |
| `apps/web-next/components/trek/BuddySection.tsx` | Orchestrates buddy count + signal list + form on trek detail |
| `apps/web-next/components/trek/BuddySignalCard.tsx` | Anonymised trekker card with send-request inline |
| `apps/web-next/components/trek/BuddySignalForm.tsx` | Collapsible "I'm planning this trek" form |
| `apps/web-next/components/buddy/BuddyChatPanel.tsx` | Polling-based chat UI for accepted requests |
| `apps/web-next/app/account/buddy-requests/page.tsx` | Buddy requests page (received/sent/chat) |
| `apps/web-next/app/(public)/trekker/[signalId]/page.tsx` | Public trekker profile page |

## Files to Modify

| File | Change |
|------|--------|
| `services/api/app/db/base.py` | Import `BuddySignal`, `BuddyRequest`, `BuddyChatMessage` |
| `services/api/app/api/router.py` | Register `buddies_router` (static routes before dynamic) |
| `services/api/app/worker/celery_app.py` | Import buddies tasks + add beat schedule entry |
| `services/api/app/modules/account/models.py` | Add `bio`/`avatar_url` columns (via migration, not direct edit) |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | Add `<BuddySection>` after `<TrekReportsSection>` |
| `apps/web-next/app/account/layout.tsx` or nav | Add "Buddy Requests" link |
| `docs/URL_MAP.md` | Add all 13 new URLs |

---

## Database

### New columns on `user_profiles`
```sql
ALTER TABLE user_profiles ADD COLUMN bio VARCHAR(500);
ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
```

### `buddy_signals`
```sql
CREATE TABLE buddy_signals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trek_slug    VARCHAR(200) NOT NULL,
    month_year   VARCHAR(7) NOT NULL,
    group_size   SMALLINT DEFAULT 1,
    experience   VARCHAR(32),
    notes        VARCHAR(500),
    active       BOOLEAN NOT NULL DEFAULT true,
    expires_at   DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, trek_slug, month_year)
);
```

### `buddy_requests`
```sql
CREATE TABLE buddy_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_id    UUID NOT NULL REFERENCES buddy_signals(id) ON DELETE CASCADE,
    message      VARCHAR(500),
    status       VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    UNIQUE (sender_id, signal_id)
);
```

### `buddy_chat_messages`
```sql
CREATE TABLE buddy_chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id  UUID NOT NULL REFERENCES buddy_requests(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at     TIMESTAMPTZ
);
```

---

## Privacy Rules (service layer)

- `SignalOut.display_name` = `first_name + " " + last_initial + "."` derived from `users.full_name` — never email
- `TrekkerProfileOut` exposes: display_name, avatar_url, bio, experience, trek_count (from user_trek_history COUNT), joined_year — never email/phone
- On accept: email notification to both users via existing email service — includes each other's name + email
- Chat only available when `buddy_request.status == 'accepted'`
- `GET /public/trekkers/{signal_id}` looks up user via signal; signal_id acts as privacy token (UUID not guessable)

---

## Celery Task

```python
# worker/tasks/buddies.py
@celery_app.task(name="buddies.expire_signals")
def expire_signals():
    """Daily: mark buddy_signals active=false where expires_at < today"""
```

Beat: `{"task": "buddies.expire_signals", "schedule": crontab(hour=0, minute=30)}`

---

## Backend Tests (12)

| ID | Test | Verifies |
|----|------|---------|
| TC-B-M18-01 | `test_create_signal` | POST /buddies/signals → 201 |
| TC-B-M18-02 | `test_duplicate_signal_replaces_old` | Second signal deactivates first |
| TC-B-M18-03 | `test_list_signals_no_email` | Response contains no email/raw user_id |
| TC-B-M18-04 | `test_send_request` | POST /buddies/requests → 201 |
| TC-B-M18-05 | `test_duplicate_request_rejected` | Same sender+signal → 409 |
| TC-B-M18-06 | `test_accept_request` | PATCH accept → status=accepted, responded_at set |
| TC-B-M18-07 | `test_cannot_request_own_signal` | Returns 400 |
| TC-B-M18-08 | `test_expire_signals_task` | Signals past expires_at → active=false |
| TC-B-M18-09 | `test_public_buddy_count` | Count returned without auth |
| TC-B-M18-10 | `test_public_trekker_profile` | Profile via signal_id contains no email |
| TC-B-M18-11 | `test_send_chat_message` | 201 for accepted request, 403 for pending |
| TC-B-M18-12 | `test_get_chat_messages` | Both parties can read; third party gets 403 |

---

## Web Frontend Test Cases

### TC-F-W79-01: Trek detail — buddy section renders
**URL:** http://localhost:3000/trek/kedarkantha
**Steps:** Scroll to bottom of trek detail (below Trail Conditions)
**Expected:** "Find Trek Buddy" section with count banner visible
**Pass =** Count shown or "Be the first to signal" empty state

### TC-F-W79-02: Signal creation (logged in)
**Steps:** Click "I'm planning this trek" → select month, group size, experience → submit
**Expected:** Signal saved, card appears in list, "Update signal" replaces form button

### TC-F-W79-03: Send buddy request
**Steps:** Click "Connect" on another trekker's card → optional message → Send
**Expected:** Toast "Request sent", button changes to "Request sent"

### TC-F-W79-04: Accept request on /account/buddy-requests
**URL:** http://localhost:3000/account/buddy-requests
**Steps:** Received tab → click Accept
**Expected:** Status changes to Accepted; chat panel appears; success toast

### TC-F-W79-05: In-app chat (accepted request)
**Steps:** In Accepted request card, type a message → Send
**Expected:** Message appears in chat bubble; polling shows reply within 10s

### TC-F-W79-06: Public trekker profile
**Steps:** Click trekker name/avatar on buddy signal card
**Expected:** `/trekker/[signalId]` page shows display name, bio, experience, trek count — no email visible

### TC-F-W79-07: Unauthenticated user
**Steps:** Visit trek detail page without login
**Expected:** Count banner visible; signal list shows "Sign in to see who's planning this trek"; form shows "Sign in to connect"

### TC-F-W79-08: Mobile layout (375px)
**Steps:** Resize to 375px, visit trek detail
**Expected:** Buddy section renders; cards stack cleanly; no overflow

---

## Implementation Order

Per CLAUDE.md §2:
1. Migration → `alembic upgrade head`
2. ORM models → `models.py` + `db/base.py`
3. Schemas → `schemas.py`
4. Service → `service.py`
5. Routes → `routes/buddies.py` + register in `router.py`
6. Celery task → `tasks/buddies.py` + `celery_app.py`
7. Backend tests → all 12 pass + full suite
8. Web lib → `lib/buddies.ts`
9. Web components → BuddySection, BuddySignalCard, BuddySignalForm, BuddyChatPanel
10. Web pages → `/account/buddy-requests`, `/trekker/[signalId]`
11. Trek detail wiring → add BuddySection
12. `next build` clean
13. MD file updates + URL_MAP
14. Commit

---

## Notes

- Route registration ORDER in `router.py`: `/buddies/requests/received` and `/buddies/requests/sent` MUST be registered BEFORE `/buddies/requests/{id}` or FastAPI will try to match "received"/"sent" as UUIDs
- Same ordering issue in `routes/buddies.py` — define static path functions before `{id}` functions
- In-app chat is polling-based (setInterval 10s) — no WebSocket complexity
- Chat gated: `buddy_request.status must == 'accepted'`; otherwise 403
- Public profile via `signal_id` (not user_id) — UUID is not guessable, provides natural privacy scope
- `expires_at` computed on signal creation: last day of month_year + 30 days

## Status

- [ ] Migration written and run
- [ ] ORM models + db/base.py
- [ ] Schemas
- [ ] Service layer
- [ ] Routes + router registration
- [ ] Celery task + beat schedule
- [ ] 12 backend tests pass
- [ ] Full suite passes (zero regressions)
- [ ] `lib/buddies.ts`
- [ ] Web components (4)
- [ ] Web pages (2) + trek detail wiring
- [ ] `next build` clean
- [ ] URL_MAP updated
- [ ] MD files updated
- [ ] Git commit

## Files Created
*(populated on completion)*

## Files Modified
*(populated on completion)*
