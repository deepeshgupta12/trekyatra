# DigitalOcean Release Runbook — 2026-07-28

DO App Platform actions required for **today's api-component releases**. Derived
directly from the commits below (verified — no assumptions).

| Commit | What landed | DO action it triggers |
|--------|-------------|------------------------|
| `4ff3564` | Sign in with Apple (backend `/auth/mobile/apple`) | env var `APPLE_BUNDLE_ID` |
| `5721b52` | Analytics session lifecycle + device metadata | **migration** `20260728_0055` |
| `07fa1a9` | iOS Step 6 (permission strings/docs) | none (mobile/docs) |
| `caa15cb` | Resized image variants + backfill script | **run backfill** |
| `b3178c4` | Declare `PyJWT[crypto]` for Apple RS256 | **deploy installs the dep** |

**Not needed today:** no new Celery tasks → **no worker/beat restart**; no new
`DO_SPACES_*` vars (already configured); `apps/web-next` was not changed in this
batch → no web deploy.

---

## Run in this order

### 0. Deploy the code
The new `PyJWT[crypto]` dependency (`b3178c4`) is installed from `pyproject.toml`
at build time (no lockfile).
- **Auto-deploy on:** the push to `main` already triggered it — confirm the
  deploy for `b3178c4` shows **Active** under the app's **Activity** tab.
- **Auto-deploy off:** DO console → App → **Deploy** (Force Rebuild and Deploy).

### 1. Set the Apple bundle-ID env var
DO console → App → **Settings → `api` component → Environment Variables** → add:
```
APPLE_BUNDLE_ID=in.co.trekyatra.app
```
*(`core/config.py` already defaults to this value, so it's functionally safe if
missed — but set it explicitly. Saving env vars triggers a redeploy.)*

### 2. Apply the DB migration
After the deploy is live: DO console → **`api` component → Console** tab:
```bash
cd services/api        # if the shell isn't already there
alembic upgrade head
```
Applies `20260728_0055_analytics_session_device` (adds `device_model` +
`os_version` to `analytics_sessions`). **Without it, `POST /api/v1/analytics/session/start`
500s** (missing columns) → mobile session tracking breaks.

### 3. Backfill resized image variants
After the deploy is live (the script imports the new `app.core.image_variants`):
DO console → **`api` component → Console** tab:
```bash
cd services/api
python scripts/backfill_image_variants.py --dry-run   # preview counts
python scripts/backfill_image_variants.py             # execute
```
Idempotent and **additive only** — creates `media/<uuid>_400.jpg` / `_800.jpg`;
never modifies or deletes originals. New uploads already generate variants
automatically. Uses the existing `DO_SPACES_*` credentials.

### 4. Verify
```bash
curl -s https://api.trekyatra.co.in/api/v1/health          # → 200, services healthy
```
- Sign in with **Apple** from the app / TestFlight → completes (confirms
  `PyJWT[crypto]` deployed **and** `APPLE_BUNDLE_ID` matches).
- Open any trek card → a `…_400.jpg` request in Spaces logs (confirms backfill).
