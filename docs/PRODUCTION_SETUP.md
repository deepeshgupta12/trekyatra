# TrekYatra Production Setup Log

> This file tracks every production infrastructure decision and configuration step.
> It is the authoritative reference for what has been set up, where, and why.
> **DO NOT commit passwords, API keys, or secrets here.**
> Last updated: 2026-05-13

---

## Infrastructure Overview

| Layer | Service | Provider | Region | Status |
|-------|---------|----------|--------|--------|
| Frontend | App Platform — `web` | DigitalOcean | BLR1 Bangalore | 🔄 Configuring |
| Backend API | App Platform — `api` | DigitalOcean | BLR1 Bangalore | ⏳ Pending |
| Celery Worker | App Platform — `celery-worker` | DigitalOcean | BLR1 Bangalore | ⏳ Pending |
| Celery Beat | App Platform — `celery-beat` | DigitalOcean | BLR1 Bangalore | ⏳ Pending |
| Database | Managed PostgreSQL 16 + pgvector | DigitalOcean | BLR1 Bangalore | ✅ Ready |
| Cache | Managed Valkey 8 (Redis-compatible) | DigitalOcean | BLR1 Bangalore | ✅ Ready |
| Domain | trekyatra.co.in | GoDaddy | — | ⏳ Pending DNS |

---

## Domain

| Item | Value |
|------|-------|
| **Domain** | `trekyatra.co.in` |
| **Registrar** | GoDaddy |
| **Frontend URL** | `https://trekyatra.co.in` |
| **API URL** | `https://api.trekyatra.co.in` |

---

## Step 1 — DigitalOcean Account ✅

- Created DigitalOcean account
- Project created: **TrekYatra** (Production)
- Signup credit: $5.00 applied

---

## Step 2 — PostgreSQL Database ✅

**Cluster name:** `trekyatra-db`

| Setting | Value |
|---------|-------|
| Engine | PostgreSQL 16 |
| Plan | Basic — Shared CPU |
| RAM | 1 GB |
| vCPU | 1 |
| Storage | 10 GiB SSD |
| Region | Bangalore • Datacenter 1 • BLR1 |
| Cost | $15.15/month ($13 compute + $2.15 storage) |
| VPC | default-blr1 |
| Standby | Primary only |

### Database & User Created

| Item | Value |
|------|-------|
| **Application database** | `trekyatra` |
| **Application user** | `trekyatra_user` |
| **System admin user** | `doadmin` |
| **Port** | `25060` |
| **SSL mode** | `require` |
| **Host** | `trekyatra-db-do-user-37216682-0.m.db.ondigitalocean.com` |

### pgvector Extension

```sql
-- Ran in psql as doadmin against the trekyatra database:
CREATE EXTENSION IF NOT EXISTS vector;
-- Confirmed: vector v0.x.x installed

-- Permissions granted to trekyatra_user:
GRANT ALL PRIVILEGES ON DATABASE trekyatra TO trekyatra_user;
GRANT ALL ON SCHEMA public TO trekyatra_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO trekyatra_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO trekyatra_user;
```

### Connection String Format (no password)

```
DATABASE_URL=postgresql+psycopg://trekyatra_user:PASSWORD@trekyatra-db-do-user-37216682-0.m.db.ondigitalocean.com:25060/trekyatra?sslmode=require
```

> Get password from: DigitalOcean → trekyatra-db → Users & Databases → trekyatra_user → show

---

## Step 3 — Redis / Valkey Cache ✅

**Cluster name:** `db-valkey-blr1-95254`

| Setting | Value |
|---------|-------|
| Engine | Valkey 8 (Redis-compatible) |
| Plan | Basic |
| RAM | 1 GB |
| Storage | 10 GiB |
| Region | Bangalore • BLR1 |
| Port | `25061` |
| SSL | Yes (use `rediss://` with double-s) |
| Cost | $15.00/month |
| Eviction policy | noeviction |

| Item | Value |
|------|-------|
| **Host** | `db-valkey-blr1-95254-do-user-37216682-0.m.db.ondigitalocean.com` |
| **Port** | `25061` |
| **Username** | `default` |

### Connection String Format (no password)

```
REDIS_URL=rediss://default:PASSWORD@db-valkey-blr1-95254-do-user-37216682-0.m.db.ondigitalocean.com:25061
REDIS_HOST=db-valkey-blr1-95254-do-user-37216682-0.m.db.ondigitalocean.com
REDIS_PORT=25061
```

> Get password from: DigitalOcean → db-valkey-blr1-95254 → Overview → Connection Details → show

---

## Step 4 — App Platform Setup 🔄 (web ✅ HEALTHY, api ✅ HEALTHY — worker/beat pending)

**App name:** `trekyatra`
**Temporary DO URL:** `https://trekyatra-ssvha.ondigitalocean.app/`
**Final URL (after DNS):** `https://trekyatra.co.in`
**Region:** Bangalore BLR1

### Security note on environment variables

All 12 app-level variables are **server-side only** — they are injected into
the container at runtime and are NEVER sent to the browser, Console, or Network
tab of end users. Only variables prefixed with `NEXT_PUBLIC_` are intentionally
exposed to the browser; those contain only non-sensitive public values (URLs, 
public payment keys). Sensitive vars (DATABASE_URL, AUTH_JWT_SECRET, passwords, 
API keys) have no `NEXT_PUBLIC_` prefix and are fully protected.

### IMPORTANT: How the app reads database config

The app reads INDIVIDUAL postgres settings, NOT a `DATABASE_URL` string:
- `POSTGRES_SERVER`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`

The `DATABASE_URL` env var we set initially was wrong — the app ignores it.
The correct env vars to add in DO App Platform are listed in the env vars table below.

### SSL auto-detection (config.py)

`config.py` auto-detects production SSL from port numbers:
- `POSTGRES_PORT=25060` → automatically appends `?sslmode=require`
- `REDIS_PORT=25061` → automatically uses `rediss://` (TLS) for Redis/Celery URLs
No explicit SSL env var needed.

---

### Component 1 — `web` (Next.js Frontend) ✅ HEALTHY

| Setting | Value |
|---------|-------|
| Name | `web` |
| Type | Web Service |
| Repository | `deepeshgupta12/trekyatra` |
| Branch | `main` |
| Auto-deploy | Enabled |
| Source Directory | root (DO detected Node.js automatically) |
| Build Command | `cd apps/web-next && npm install && npm run build` |
| Run Command | `cd apps/web-next && npm start` |
| HTTP Port | `3000` |
| Instance | 1 GB RAM / 1 Shared vCPU |
| Containers | 1 |
| Cost | $12/month |

**Component-level env vars set (non-secret — safe for browser):**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_BASE` | `https://api.trekyatra.co.in` |
| `NEXT_PUBLIC_SITE_URL` | `https://trekyatra.co.in` |
| `NEXT_PUBLIC_GA4_ID` | (to be added — get from Google Analytics) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | (to be added — live key from Razorpay) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (to be added — live key from Stripe) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | (to be added — from Google Cloud Console) |

### App-level environment variables — Current state + corrections

**Phase 1 (set at app creation — 12 vars):**

| Variable | Status | Note |
|----------|--------|------|
| `DATABASE_URL` | ⚠️ Remove — app doesn't read it | App uses individual POSTGRES_* vars |
| `REDIS_URL` | ⚠️ Remove — app doesn't read it | App uses REDIS_HOST + REDIS_PORT |
| `REDIS_HOST` | ✅ Correct | `db-valkey-blr1-95254-do-user-37216682-0.m.db.ondigitalocean.com` |
| `REDIS_PORT` | ✅ Correct | `25061` → auto-enables rediss:// TLS |
| `AUTH_JWT_SECRET` | ✅ Set (encrypted) | |
| `AUTH_COOKIE_SECURE` | ✅ `true` | |
| `AUTH_COOKIE_SAMESITE` | ✅ `none` | |
| `ADMIN_EMAIL` | ✅ Set | |
| `ADMIN_PASSWORD` | ✅ Set (encrypted) | |
| `APP_ENV` | ✅ `production` | |
| `APP_DEBUG` | ✅ `false` | |
| `PRODUCT_DOWNLOAD_BASE_URL` | ✅ Set | |

**Phase 2 — ADD these now (postgres config that app actually reads):**

| Variable | Value |
|----------|-------|
| `POSTGRES_SERVER` | `trekyatra-db-do-user-37216682-0.m.db.ondigitalocean.com` |
| `POSTGRES_PORT` | `25060` (auto-enables sslmode=require) |
| `POSTGRES_DB` | `trekyatra` |
| `POSTGRES_USER` | `trekyatra_user` |
| `POSTGRES_PASSWORD` | (get from DO → trekyatra-db → Users & Databases → show) |

**Phase 3 — Add when live keys available:**

| Variable | Source |
|----------|--------|
| `ANTHROPIC_API_KEY` | Anthropic Console |
| `OPENAI_API_KEY` | OpenAI Console |
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | Razorpay Dashboard |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + price IDs | Stripe Dashboard |
| `SMTP_HOST/PORT/USER/PASSWORD` | Resend or SendGrid |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google Cloud Console |

### Component 2 — `api` (FastAPI Backend) ✅ HEALTHY

| Setting | Value |
|---------|-------|
| Build strategy | Dockerfile |
| CMD in Dockerfile | `sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"` |
| Run command | (empty — Dockerfile CMD is used) |
| HTTP Port | `8080` |
| Cost | $12/month |

**SSL fix applied (config.py `7e6073f`):**
- Port 25060 → auto `sslmode=require` on postgres URI
- Port 25061 → auto `rediss://` on all Redis/Celery URLs

---

### Component 2 — `api` (FastAPI Backend) ⏳

> To be added after initial app creation via Components → Create Component

| Setting | Value |
|---------|-------|
| Name | `api` |
| Type | Web Service |
| Repository | `deepeshgupta12/trekyatra` |
| Branch | `main` |
| Source Directory | `services/api` |
| Build Command | `pip install -e .` |
| Run Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| HTTP Port | `8080` |
| Instance | 1 GB RAM / 1 Shared vCPU |
| Containers | 1 |
| Cost | $12/month |

**Custom domain:** `api.trekyatra.co.in` (to be configured after app creation)

---

### Component 3 — `celery-worker` ⏳

> To be added after initial app creation

| Setting | Value |
|---------|-------|
| Name | `celery-worker` |
| Type | Worker |
| Source Directory | `services/api` |
| Build Command | `pip install -e .` |
| Run Command | `celery -A app.worker.celery_app worker --loglevel=info --concurrency=2` |
| Instance | 1 GB RAM / 1 Shared vCPU |
| Cost | $12/month |

---

### Component 4 — `celery-beat` ⏳

> To be added after initial app creation

| Setting | Value |
|---------|-------|
| Name | `celery-beat` |
| Type | Worker |
| Source Directory | `services/api` |
| Build Command | `pip install -e .` |
| Run Command | `celery -A app.worker.celery_app beat --loglevel=info` |
| Instance | 1 GB RAM / 1 Shared vCPU |
| Cost | $12/month |

---

## App-Level Environment Variables ⏳

These are shared across all components. Set in App Platform → App-level environment variables:

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | postgresql+psycopg://trekyatra_user:PASSWORD@HOST:25060/trekyatra?sslmode=require |
| `REDIS_URL` | rediss://default:PASSWORD@HOST:25061 |
| `REDIS_HOST` | db-valkey-blr1-95254-do-user-37216682-0.m.db.ondigitalocean.com |
| `REDIS_PORT` | 25061 |
| `AUTH_JWT_SECRET` | Generated with: `openssl rand -hex 64` |
| `AUTH_COOKIE_SECURE` | true |
| `AUTH_COOKIE_SAMESITE` | none |
| `ADMIN_EMAIL` | guyshazam12@gmail.com |
| `ADMIN_PASSWORD` | (secret — set in DO dashboard) |
| `ANTHROPIC_API_KEY` | (secret — set in DO dashboard) |
| `OPENAI_API_KEY` | (secret — set in DO dashboard) |
| `RAZORPAY_KEY_ID` | (secret — set in DO dashboard) |
| `RAZORPAY_KEY_SECRET` | (secret — set in DO dashboard) |
| `STRIPE_SECRET_KEY` | (secret — set in DO dashboard) |
| `STRIPE_WEBHOOK_SECRET` | (secret — configure after Stripe webhook registered) |
| `STRIPE_PREMIUM_PRICE_ID_MONTHLY` | (from Stripe Dashboard → Products) |
| `STRIPE_PREMIUM_PRICE_ID_ANNUAL` | (from Stripe Dashboard → Products) |
| `SMTP_HOST` | smtp.resend.com (recommended) |
| `SMTP_PORT` | 587 |
| `SMTP_USER` | resend |
| `SMTP_PASSWORD` | (secret — Resend API key) |
| `SMTP_FROM_EMAIL` | hello@trekyatra.co.in |
| `GOOGLE_CLIENT_ID` | (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | (secret — from Google Cloud Console) |
| `APP_ENV` | production |
| `APP_DEBUG` | false |
| `PRODUCT_DOWNLOAD_BASE_URL` | https://trekyatra.co.in |

---

## Step 5 — Database Migrations ⏳

> Run AFTER all App Platform components are deployed and healthy.

Open Console on the `api` component:
```bash
alembic upgrade head
```

Expected output: `Running upgrade ... -> 20260506_0030, subscriptions`

---

## Step 6 — Domain DNS Configuration ⏳

> Configure in GoDaddy AFTER App Platform gives you the DNS records.

In GoDaddy DNS Manager for `trekyatra.co.in`:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | `@` | (DO App Platform IP) | Root domain → Next.js frontend |
| CNAME | `www` | (DO domain) | www redirect |
| CNAME | `api` | (DO domain) | API subdomain → FastAPI |

DigitalOcean auto-provisions SSL via Let's Encrypt once DNS propagates (10–30 min).

---

## Step 7 — Stripe Webhook ⏳

After API is live at `https://api.trekyatra.co.in`:

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://api.trekyatra.co.in/api/v1/subscriptions/webhook`
3. Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy Signing secret → set as `STRIPE_WEBHOOK_SECRET` in DO App Platform env vars

---

## Step 8 — Google Search Console ⏳

1. [search.google.com/search-console](https://search.google.com/search-console) → Add property
2. Domain: `trekyatra.co.in`
3. Verify via DNS TXT record in GoDaddy
4. Submit sitemap: `https://trekyatra.co.in/sitemap.xml`

---

## Estimated Monthly Cost

| Service | Cost |
|---------|------|
| PostgreSQL (Basic, BLR1) | $15.15/mo |
| Valkey/Redis (Basic, BLR1) | $15.00/mo |
| App Platform — `web` | $12.00/mo |
| App Platform — `api` | $12.00/mo |
| App Platform — `celery-worker` | $12.00/mo |
| App Platform — `celery-beat` | $12.00/mo |
| **Total** | **~$78.15/mo** |

---

## Post-Deploy Manual Tasks (Owner)

- [ ] Run alembic migrations via Console
- [ ] Log into admin panel at `https://trekyatra.co.in/admin/sign-in`
- [ ] Run content pipeline (requires ANTHROPIC_API_KEY)
- [ ] Add operators via `/admin/operators`
- [ ] Add products via `/admin/products`
- [ ] Seed email sequences via `/admin/email-sequences`
- [ ] Set up Stripe webhook
- [ ] Submit sitemap to Google Search Console
- [ ] Set up UptimeRobot monitoring on `https://trekyatra.co.in` and `https://api.trekyatra.co.in/api/v1/health`
