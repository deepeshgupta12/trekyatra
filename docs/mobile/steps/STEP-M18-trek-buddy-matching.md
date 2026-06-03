# STEP-M18 — Trek Buddy Matching

**Status:** Pending
**Phase:** Community
**Dependencies:** STEP-M02 (auth), STEP-M05 (trek detail — buddy CTA from there), STEP-M14 (push notifications — buddy request alerts)

---

## Scope

Lets registered users find and connect with other trekkers planning the same route. Users set a trek + approximate date window as their "looking for buddy" signal. Other users browsing the same trek see a count of interested trekkers and can send a buddy request. Contact info is NOT shared until both users accept — privacy-first design. No in-app chat in V5; on mutual accept, both users get each other's email via push notification only.

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/alembic/versions/YYYYMMDD_0047_buddy_requests.py` | Migration: `buddy_signals` + `buddy_requests` tables |
| `services/api/app/modules/buddies/models.py` | ORM: `BuddySignal`, `BuddyRequest` |
| `services/api/app/modules/buddies/schemas.py` | Pydantic: `SignalIn`, `SignalOut`, `BuddyRequestIn`, `BuddyRequestOut` |
| `services/api/app/modules/buddies/service.py` | Service: `create_signal`, `list_signals`, `send_request`, `respond_request` |
| `services/api/app/api/routes/buddies.py` | Auth-gated routes for signals + requests |
| `services/api/tests/test_buddies_m18.py` | Backend buddy matching tests |

### Mobile
| File | Purpose |
|------|---------|
| `apps/mobile/components/buddies/BuddySignalSheet.tsx` | "I'm planning this trek" setup sheet |
| `apps/mobile/components/buddies/BuddyListCard.tsx` | Trekker card (avatar, month, group size — no contact info) |
| `apps/mobile/components/buddies/BuddyRequestSheet.tsx` | Send / received request management |
| `apps/mobile/hooks/useBuddies.ts` | Fetch signals, create signal, send/respond to requests |

---

## Database

### `buddy_signals`
```sql
CREATE TABLE buddy_signals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trek_slug    VARCHAR(200) NOT NULL,
    month_year   VARCHAR(7) NOT NULL,   -- "2026-06" format
    group_size   SMALLINT DEFAULT 1,
    experience   VARCHAR(32),           -- beginner | intermediate | expert
    notes        VARCHAR(500),
    active       BOOLEAN NOT NULL DEFAULT true,
    expires_at   DATE,                  -- auto-expire 30 days after month_year end
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, trek_slug, month_year)
);
CREATE INDEX idx_signals_trek_slug ON buddy_signals(trek_slug);
CREATE INDEX idx_signals_month_year ON buddy_signals(month_year);
CREATE INDEX idx_signals_active ON buddy_signals(active);
```

### `buddy_requests`
```sql
CREATE TABLE buddy_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_id    UUID NOT NULL REFERENCES buddy_signals(id) ON DELETE CASCADE,
    message      VARCHAR(500),
    status       VARCHAR(32) NOT NULL DEFAULT 'pending',  -- pending | accepted | rejected
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    UNIQUE (sender_id, signal_id)
);
CREATE INDEX idx_requests_receiver ON buddy_requests(receiver_id, status);
CREATE INDEX idx_requests_sender ON buddy_requests(sender_id);
```

---

## Backend Routes

```python
# Auth required for all

POST   /api/v1/buddies/signals              → create_signal
GET    /api/v1/buddies/signals/{trek_slug}  → list_signals_for_trek (auth required)
DELETE /api/v1/buddies/signals/{id}        → deactivate_signal (own only)

POST   /api/v1/buddies/requests            → send_request
GET    /api/v1/buddies/requests/received   → list_received_requests
GET    /api/v1/buddies/requests/sent       → list_sent_requests
PATCH  /api/v1/buddies/requests/{id}       → respond_to_request (accept/reject)
```

### Privacy Rules in Service Layer

`list_signals_for_trek` returns:
- Display name: `first_name + last_initial + "."` (e.g. "Priya S.")
- Avatar URL (if set)
- `month_year`, `experience`, `group_size`, `notes`
- **NOT**: email, phone, full last name, user ID visible in response (use `signal_id` only)

On mutual accept:
```python
# service.py
if request.status == 'accepted':
    # Notify both parties via push (category: plan_followup)
    # Email both parties with each other's name + email
    await notification_service.send_buddy_match_email(sender, receiver, trek_slug)
```

---

## Trek Detail Integration

Add a "Find Trek Buddy" section to Trek Detail (STEP-M05), below reviews:

```tsx
<BuddySection trekSlug={slug}>
  <Text>3 trekkers looking for a buddy in Jun 2026</Text>
  <Pressable onPress={() => openBuddySignalSheet()}>
    <Text>I'm planning this trek →</Text>
  </Pressable>
</BuddySection>
```

`BuddySection` calls `GET /buddies/signals/{trek_slug}` and shows a count. Tapping opens the full list of signals (anonymised) where user can send requests.

---

## Buddy Signal Sheet

```
"Planning this trek?"
────────────────────────────────
Trek             [auto-filled]
Planning month   [Jun 2026 ▾]
Group size       [Solo ▾]
Experience level [Intermediate ▾]
Brief note       [optional — visible to other trekkers]
────────────────────────────────
[I'm in! Find me a buddy]
```

User can only have one active signal per trek. Submitting a duplicate deactivates the old one.

---

## Buddy List Screen (modal/sheet)

```
"Trekkers planning Kedarkantha"
────────────────────────────────
[BuddyListCard]
  🧑 Rahul M.  · Jun 2026  · Solo  · Intermediate
  "First time to Kedarkantha, looking for guide"
  [Send request]

[BuddyListCard]
  👩 Anjali K.  · Jun 2026  · Group of 2  · Beginner
  [Send request]
────────────────────────────────
```

"Send request" opens message composer (optional message, max 200 chars) → `POST /buddies/requests`.

---

## Received Requests Screen (in Account tab)

```
[Page: "Buddy Requests"]
[Received (2)]  [Sent (1)]
────────────────────────────────
[BuddyRequestCard]
  Rahul M. wants to trek Kedarkantha with you
  Jun 2026 · "Looking for patient trekkers :)"
  [Accept]  [Decline]
```

On Accept: success toast → push notification sent to both users with each other's email.

---

## Celery Task: Signal Auto-Expiry

```python
@celery_app.task(name="buddies.expire_signals")
def expire_signals():
    """Daily: mark buddy_signals expired where expires_at < today"""
    ...
```

Beat schedule: `{"task": "buddies.expire_signals", "schedule": crontab(hour=0, minute=30)}`.

Signal `expires_at` = last day of `month_year` + 30 days (gives buffer for late trips).

---

## Backend Tests

| Test ID | Verifies |
|---------|---------|
| TC-B-M18-01 | `test_create_signal` — POST /buddies/signals returns 201 |
| TC-B-M18-02 | `test_duplicate_signal_replaces_old` — second signal for same trek deactivates first |
| TC-B-M18-03 | `test_list_signals_no_email` — response contains no email or full user ID |
| TC-B-M18-04 | `test_send_request` — POST /buddies/requests returns 201 |
| TC-B-M18-05 | `test_duplicate_request_rejected` — second request to same signal returns 409 |
| TC-B-M18-06 | `test_accept_request` — PATCH status=accepted sets responded_at |
| TC-B-M18-07 | `test_cannot_request_own_signal` — returns 400 |
| TC-B-M18-08 | `test_expire_signals_task` — signals with past expires_at set to active=false |

---

## Verification (Manual)

1. **TC-M18-01**: Trek detail shows "N trekkers looking for a buddy" count
2. **TC-M18-02**: "I'm planning this trek" → sheet opens → submit → appears in signal list
3. **TC-M18-03**: Signal list shows anonymised names (no email visible)
4. **TC-M18-04**: Send request → confirmation toast → request in "Sent" tab
5. **TC-M18-05**: Other user receives push notification about buddy request
6. **TC-M18-06**: Accept request → both users receive email with each other's contact
7. **TC-M18-07**: Cannot send request to own signal (button hidden for own signals)

---

## Notes

- Privacy is the critical design constraint: **no contact details are ever displayed in the app UI** — only shared via email after mutual accept
- Email delivery on match is via the existing SendGrid/email service from Step 27 (transactional email) — add a new template `buddy_match_notification`
- Do NOT implement in-app chat in V5 — out of scope; the email handoff is intentional
- Signals auto-expire to prevent stale "seeking buddy" posts for past dates
- `experience` enum: `beginner | intermediate | expert` — consistent with trek difficulty labels in the content system
