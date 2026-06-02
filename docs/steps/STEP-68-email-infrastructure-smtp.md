# STEP-68 — Email Infrastructure, SMTP Setup & Email Verification

**Status:** Done
**Phase:** Production Hardening
**Dependencies:** Step 12 (auth), Step 21 (leads email tasks), Step 33 (email sequences), Step 37 (trek alerts model)

---

## Scope

Three-part production email hardening:

**Part A — Email Address Standardisation**
Replace all wrong/inconsistent email addresses across the full codebase with `explore@trekyatra.co.in`.

**Part B — GoDaddy SMTP Configuration**
Wire the live GoDaddy SMTP credentials into DigitalOcean App Platform environment variables so all transactional emails (welcome, password reset, leads) actually send via `explore@trekyatra.co.in`.

**Part C — Email Verification Flow (Z04)**
When a user signs up with email+password, silently `is_verified_email=false` is set but no verification email is sent. Build the full send + verify flow using the same HMAC-JWT pattern as password reset.

**Part D — Trek Alert Delivery Task (Z05)**
`trek_alerts` table and `add_alert` service exist but there is no Celery task that actually emails users when a trek alert fires. Build the scheduled delivery task.

---

## Current State (Confirmed by Code Read)

| Item | Current | Required |
|------|---------|----------|
| Frontend pages | `hello@trekyatra.in` (wrong TLD) | `explore@trekyatra.co.in` |
| `config.py smtp_from_email` | `"noreply@trekyatra.com"` | `"explore@trekyatra.co.in"` |
| `config.py admin_email` | `"guyshazam12@gmail.com"` | `"explore@trekyatra.co.in"` |
| `seed_static_cms_pages.py` | Mixed wrong emails | `explore@trekyatra.co.in` |
| Email verification | Not implemented | POST + GET endpoints + FE page |
| Trek alert email task | Not implemented | Celery task + beat schedule |

---

## GoDaddy SMTP Settings (from DNS/account screenshot)

| Setting | Value |
|---------|-------|
| Outbound SMTP host | `smtpout.secureserver.net` |
| Port | `587` (TLS STARTTLS) or `465` (SSL) |
| Username | `explore@trekyatra.co.in` |
| Password | GoDaddy email account password |
| From address | `explore@trekyatra.co.in` |
| SPF | `v=spf1 include:secureserver.net ~all` (already in DNS) |

---

## Files to Modify (Part A — Email Replacement)

| File | Current Wrong Email | Lines |
|------|-------------------|-------|
| `apps/web-next/app/(public)/contact/page.tsx` | `hello@trekyatra.in` | ~50-57 |
| `apps/web-next/app/(public)/privacy/page.tsx` | `hello@trekyatra.in` | ~104 |
| `apps/web-next/app/(public)/affiliate-disclosure/page.tsx` | `hello@trekyatra.in` | ~87 |
| `apps/web-next/app/(public)/methodology/page.tsx` | `hello@trekyatra.in` | ~70, 74 |
| `apps/web-next/app/(public)/terms/page.tsx` | `hello@trekyatra.in` | ~90 |
| `apps/web-next/app/(public)/about/page.tsx` | `hello@trekyatra.in` | ~76 |
| `apps/web-next/app/maintenance/page.tsx` | `hello@trekyatra.in` | ~14 |
| `services/api/app/core/config.py` | `noreply@trekyatra.com` + `guyshazam12@gmail.com` | ~38, 41 |
| `services/api/scripts/seed_static_cms_pages.py` | Mixed wrong emails | — |

Note: `apps/web-next/app/(public)/about/authors/page.tsx` uses `editorial@trekyatra.co.in` (correct `.co.in` domain) — keep as-is; editorial address is correct.

---

## Files to Create (Parts C + D)

| File | Purpose |
|------|---------|
| `services/api/app/modules/account/tasks.py` | Trek alert email delivery Celery task (Z05) |
| `apps/web-next/app/(auth)/auth/verify-email/page.tsx` | Email verification landing page (token in query param) |
| `apps/web-next/app/(auth)/auth/verify-email-sent/page.tsx` | "Check your inbox" confirmation page after requesting verification |

---

## Files to Modify (Parts C + D)

| File | Change |
|------|--------|
| `services/api/app/core/security.py` | Add `create_email_verification_token` + `parse_email_verification_token` |
| `services/api/app/api/routes/auth.py` | Add `POST /auth/send-verification` + `POST /auth/verify-email` endpoints |
| `services/api/app/modules/auth/service.py` | Add `mark_email_verified(db, user_id)` |
| `services/api/app/worker/celery_app.py` | Import `modules.account.tasks` so tasks register at startup |
| `services/api/app/schemas/auth.py` | Add `SendVerificationRequest`, `VerifyEmailRequest` schemas |
| `services/api/.env.example` | Add SMTP env vars |
| `apps/web-next/lib/auth-api.ts` | Add `sendVerificationEmail()`, `verifyEmail(token)` API helpers |
| `apps/web-next/app/(auth)/auth/account/page.tsx` or account dashboard | Add verification banner for unverified users |

---

## Backend Implementation Details

### 1. Security tokens (security.py)

```python
def create_email_verification_token(user_id: uuid.UUID) -> tuple[str, datetime]:
    """Issue a 24-hour JWT for email verification."""
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {
        "sub": str(user_id),
        "typ": "email_verification",
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.auth_jwt_secret, algorithm=settings.auth_jwt_algorithm)
    return token, expires_at

def parse_email_verification_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.auth_jwt_secret, algorithms=[settings.auth_jwt_algorithm])
        if payload.get("typ") != "email_verification":
            return None
        return payload
    except InvalidTokenError:
        return None
```

### 2. Routes (auth.py)

```python
@router.post("/send-verification", response_model=MessageResponse)
def send_verification_email(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Send email verification link to the authenticated user's email."""
    if current_user.is_verified_email:
        raise HTTPException(status_code=400, detail="Email already verified.")
    token, _ = create_email_verification_token(current_user.id)
    verify_url = f"{settings.frontend_url}/auth/verify-email?token={token}"
    _send_verification_email(current_user.email, current_user.full_name, verify_url)
    return MessageResponse(message="Verification email sent.")

@router.post("/verify-email", response_model=MessageResponse)
def verify_email(
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Consume a verification token and mark email as verified."""
    parsed = parse_email_verification_token(payload.token)
    if not parsed:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")
    user_id = uuid.UUID(parsed["sub"])
    mark_email_verified(db, user_id)
    db.commit()
    return MessageResponse(message="Email verified successfully.")
```

Note: `_send_verification_email` is a module-level helper in auth.py (same pattern as `_send_reset_email` for password reset) — no new file needed.

### 3. Trek alert task (modules/account/tasks.py)

```python
@celery_app.task(name="account.send_trek_alerts", bind=True, max_retries=3)
def send_trek_alerts_task(self) -> dict:
    """
    Scheduled task: email users who have active trek alerts.
    Runs daily. Looks for TrekAlert records where active=True
    and the matching trek has been updated in the last 24 hours,
    OR sends a weekly digest if no recent update.
    """
```

For V5 MVP, the task sends a "digest" email to users who have active alerts — listing their followed treks and a generic "stay informed" message. Full conditional delivery (only on trek updates) is a V6 enhancement.

Beat schedule: daily at 08:00 IST (02:30 UTC).

---

## DO Environment Variables to Add

After implementation, add to DigitalOcean App Platform → trekyatra → api → Environment Variables:

| Env Var | Value |
|---------|-------|
| `SMTP_HOST` | `smtpout.secureserver.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `explore@trekyatra.co.in` |
| `SMTP_PASSWORD` | `<GoDaddy email password>` |
| `SMTP_FROM_EMAIL` | `explore@trekyatra.co.in` |

Also update `ADMIN_EMAIL` env var to `explore@trekyatra.co.in` in DO.

---

## New env var defaults in config.py

```python
smtp_from_email: str = "explore@trekyatra.co.in"
admin_email: str = "explore@trekyatra.co.in"
```

---

## No Migration Required

`is_verified_email` already exists on the `users` table (added in Step 12 auth migration). No new columns needed.

---

## Tests

File: `services/api/tests/test_email_step68.py`

- `test_send_verification_requires_auth` — POST /auth/send-verification without auth returns 401
- `test_send_verification_already_verified` — POST returns 400 if user already verified
- `test_send_verification_skips_smtp_if_not_configured` — mock smtp_host=None, confirm no exception + returns message
- `test_verify_email_valid_token` — create token → POST /auth/verify-email → 200 + user.is_verified_email=True
- `test_verify_email_invalid_token` — POST with garbage token → 400
- `test_verify_email_wrong_type_token` — POST with a password_reset token → 400 (typ check)
- `test_trek_alert_task_no_smtp` — send_trek_alerts_task with no SMTP config → returns {"sent": False}
- `test_trek_alert_task_sends_digest` — seed user + alerts → mock SMTP → task returns {"sent": True}

---

## Verification

### Manual smoke tests

1. **TC-68-01**: Sign up with email → check welcome email arrives at `explore@trekyatra.co.in` inbox (admin) and at the user's inbox
2. **TC-68-02**: Submit operator inquiry form → admin notification arrives at `explore@trekyatra.co.in`
3. **TC-68-03**: Trigger "Forgot password" → reset email arrives from `explore@trekyatra.co.in`
4. **TC-68-04**: Signed-in unverified user → account page shows verification banner → click "Send verification email" → email arrives
5. **TC-68-05**: Click verification link in email → `/auth/verify-email?token=…` → success message → `is_verified_email=True` in admin
6. **TC-68-06**: Use expired/invalid verification token → error message shown
7. **TC-68-07**: Contact page, About page, Terms, Privacy, Affiliate Disclosure, Methodology pages all show `explore@trekyatra.co.in`
8. **TC-68-08**: Maintenance page shows `explore@trekyatra.co.in`

### Frontend test cases

See Step Completion Message (delivered at step close).

---

## Implementation Notes (Done — 2026-06-02)

**Files Created:**
- `services/api/app/modules/account/tasks.py` — `send_trek_alerts_task` Celery task
- `services/api/tests/test_email_step68.py` — 8 tests, all passed
- `apps/web-next/app/(auth)/auth/verify-email/page.tsx` — full token-verification page (replaces stub)

**Files Modified:**
- `services/api/app/core/config.py` — `admin_email`, `smtp_from_email` defaults; `frontend_url` added
- `services/api/.env.example` — GoDaddy SMTP defaults + `FRONTEND_URL`
- `services/api/app/core/security.py` — `create_email_verification_token`, `parse_email_verification_token`
- `services/api/app/modules/auth/service.py` — `mark_email_verified`
- `services/api/app/schemas/auth.py` — `VerifyEmailRequest`
- `services/api/app/api/routes/auth.py` — `POST /auth/send-verification`, `POST /auth/verify-email`, `_send_verification_email_helper`
- `services/api/app/worker/celery_app.py` — `account.tasks` include + `daily-trek-alert-digest` beat
- `apps/web-next/app/(public)/account/page.tsx` — email verification banner
- `apps/web-next/app/(public)/contact/page.tsx` — email replaced
- `apps/web-next/app/(public)/privacy/page.tsx` — email replaced
- `apps/web-next/app/(public)/affiliate-disclosure/page.tsx` — email replaced
- `apps/web-next/app/(public)/methodology/page.tsx` — email replaced (×2)
- `apps/web-next/app/(public)/terms/page.tsx` — email replaced
- `apps/web-next/app/(public)/about/page.tsx` — email replaced
- `apps/web-next/app/maintenance/page.tsx` — email replaced
- `apps/web-next/components/layout/Footer.tsx` — email replaced (`hello@trekyatra.co.in` → `explore@`)
- `services/api/scripts/seed_static_cms_pages.py` — email replaced (×2)

**Test Results:** 618 passed, 2 pre-existing failures (test_refresh.py isolation — unrelated), 1 skipped
**Build:** `next build` ✅ zero TypeScript errors
**GitNexus:** 13,341 nodes | 18,236 edges | 490 clusters | 139 flows

**DO env vars to add (production):**
```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_USER=explore@trekyatra.co.in
SMTP_PASSWORD=<GoDaddy email password>
SMTP_FROM_EMAIL=explore@trekyatra.co.in
FRONTEND_URL=https://trekyatra.co.in
ADMIN_EMAIL=explore@trekyatra.co.in
```
