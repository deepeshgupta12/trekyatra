# Google Search Console MCP — Setup

Gives Claude Code direct read access to Search Console (coverage, indexing, crawl, query data) instead
of working from pasted screenshots. Added 2026-10-21.

| | |
|---|---|
| Package | [`suganthan-gsc-mcp`](https://github.com/Suganthan-Mohanadasan/Suganthans-GSC-MCP) — Apache-2.0, pinned to `2.5.1` |
| Config | `.mcp.json` (project root, committed — **contains no secret**, only a path) |
| Secret | `~/.config/gsc-mcp/client_secret.json` — **outside the repo**, dir mode `700` |
| Token cache | `~/.gsc-mcp/` (created by the server on first auth) |
| Scope | `readonly` — diagnostics only, cannot write to Google |

---

## Do I need a new Google Cloud project?

**No.** Reuse the existing **My First Project**. What must be new is the **OAuth client**, not the project.

**Do NOT reuse the existing `445487374089-nesmvs822…` client.** That is the live Google Sign-In client for
trekyatra.co.in (`NEXT_PUBLIC_GOOGLE_CLIENT_ID` / backend `GOOGLE_CLIENT_ID`, used by
`components/auth/GoogleAuthButton.tsx`). It is the wrong type (Web application, not Desktop app), its
secret is no longer downloadable, and adding Search Console scopes to it would change the consent screen
real users see at sign-in.

A separate project is only worth it if you want SEO tooling fully isolated from production auth billing
and quotas. Not required.

---

## Step 1 — Google Cloud (~2 min)

1. **Enable the API.** [Search Console API](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com)
   → make sure **My First Project** is selected → **Enable**.
   *(Only needed if `GSC_SCOPES=full` later: also enable **Web Search Indexing API**.)*

2. **Create the client.** APIs & Services → Credentials → **Create credentials** → **OAuth client ID**
   → Application type: **Desktop app** → Name: `TrekYatra GSC MCP` → Create.
   > Desktop app matters: it gets an implicit `http://localhost` loopback redirect, which the MCP's
   > browser sign-in needs. A Web application client has no redirect URI configured and will fail.

3. **Download the JSON** (download icon on the new client) and move it into place:
   ```bash
   mv ~/Downloads/client_secret_*.json ~/.config/gsc-mcp/client_secret.json
   chmod 600 ~/.config/gsc-mcp/client_secret.json
   ```

4. **Consent screen — avoid the 7-day expiry.** Google Auth Platform → Audience.
   - If **Publishing status = Testing**, add your Google account under **Test users**, *or* click
     **Publish app**. In Testing mode Google expires refresh tokens after **7 days**, so you would have
     to re-authorise every week. Publishing (even unverified) avoids that. You are the only user, and the
     "unverified app" warning is bypassed with *Advanced → Go to TrekYatra GSC MCP (unsafe)*.

---

## Step 2 — Search Console

**Nothing to change.** OAuth signs in *as you*, so the MCP inherits whatever access your Google account
already has on the property. No new users, no permission grants.

*(This is the main reason to prefer OAuth over a service account here — a service account is a separate
identity and would have to be added under Settings → Users and permissions with Full access.)*

One thing to confirm — **the property identifier**, which must match `GSC_SITE_URL` in `.mcp.json`:

| In the GSC property dropdown | Use |
|---|---|
| `trekyatra.co.in` with no `https://` (Domain property, DNS-verified) | `sc-domain:trekyatra.co.in` ← **current default** |
| `https://www.trekyatra.co.in/` (URL-prefix property) | `https://www.trekyatra.co.in/` — trailing slash required |

If it is a URL-prefix property, change that one line in `.mcp.json`.

---

## Status

Done (2026-10-21): client `445487374089-8q2ga2mo…` (Desktop app, `"installed"`, redirect
`http://localhost`) created in `project-b7146baf-9c06-4071-8e9` and saved to
`~/.config/gsc-mcp/client_secret.json` (mode `600`, outside the repo, untracked).

Smoke-tested over stdio: `initialize` → `{"name":"gsc-mcp","version":"2.5.1"}`, `tools/list` → **29
tools**, with `inspect_url`, `list_sitemaps`, `site_snapshot` and `traffic_drops` all present.

Remaining: the browser OAuth consent (Step 3) — must be done interactively.

---

## Step 3 — Activate

1. Restart Claude Code in this directory. It picks up `.mcp.json` and asks you to approve the `gsc`
   server (project-scoped MCP servers require explicit approval).
2. The first `gsc` tool call opens a browser for Google sign-in. **This must happen in an interactive
   session** — a non-interactive run cannot complete the OAuth flow.
3. Verify: `/mcp` should list `gsc` as connected.

---

## Security notes

- **Version is pinned** (`suganthan-gsc-mcp@2.5.1`). Plain `npx -y suganthan-gsc-mcp` resolves to
  *latest on every launch* — a third-party package (~850 weekly downloads) holding an OAuth token to your
  Search Console. Pinning means a future compromised release cannot auto-run. Bump deliberately.
- **`GSC_SCOPES=readonly` — what it actually does.** Verified by an MCP handshake against v2.5.1: all
  **29** tools stay registered, including `submit_url`, `submit_batch` and `submit_sitemap`. `readonly`
  controls the **OAuth scope requested at consent**, not the tool list — so the write tools are still
  *listed*, but a call fails at Google because the token lacks the write scope. The protection is real
  (it is enforced by Google, not by the package), but do not expect the write tools to be hidden.
  Switch to `full` only to force re-crawl of fixed URLs; that also needs the Web Search Indexing API
  enabled and owner-level GSC access, and requires re-consenting.
- The secret never enters the repo. `.gitignore` additionally guards `client_secret*.json`,
  `gsc-oauth*.json`, `*-oauth-secrets.json` and `.gsc-mcp/` as defence in depth.
- To revoke: delete the OAuth client in Google Cloud, or remove
  [the token cache](https://myaccount.google.com/permissions) at `~/.gsc-mcp/`.

---

## What this unlocks for this repo

The whole 404/410 effort (Sep 2026) ran off pasted screenshots and manual `curl` sweeps. With this:

| Tool | Replaces |
|---|---|
| `inspect_url` | Manually curling a URL and guessing Google's view of it — gives real indexation state, canonical, crawl date |
| `list_sitemaps` | Reading sitemap XML by hand — shows Google's own discovered/indexed counts per sitemap |
| `site_snapshot`, `traffic_drops`, `content_decay` | The crawl-rate investigation that needed the GSC Crawl Stats screenshots |
| `quick_wins`, `ctr_opportunities`, `cannibalization_check` | Not previously possible without query-level data |

Directly useful next: confirm the 410/301 fixes are clearing, and verify the news-freshness fix moved
crawl rate.
