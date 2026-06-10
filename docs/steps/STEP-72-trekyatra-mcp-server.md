# STEP-72 — TrekYatra MCP Server

**Status:** Stub — requirements pending discussion
**Phase:** V6 (Platform Extensibility)
**Dependencies:** TBD
**Last updated:** 2026-06-10

---

## Overview

Expose TrekYatra's trek data, CMS content, and planning capabilities as a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server so that external AI assistants (Claude, Cursor, etc.) and internal tooling can query trek information, plan treks, and access content programmatically.

**Requirements discussion pending.** This stub reserves the step number and captures initial scope ideas.

---

## Candidate Capabilities (to be confirmed)

| Tool / Resource | Description |
|----------------|-------------|
| `search_treks` | Keyword + semantic search over all trek guides |
| `get_trek_detail` | Full trek guide (title, difficulty, duration, altitude, season, permits, costs) |
| `get_trek_conditions` | Current trail status + weather from `/mobile/conditions/{slug}` |
| `plan_trek` | Run the 6-step Plan My Trek scoring engine — returns ranked matches |
| `list_regions` | All trek regions with state breakdown |
| `get_cms_page` | Fetch any CMS page by slug (trek guide, packing list, permit guide) |
| `get_operator_info` | Operator listings with contact + speciality info |
| `get_news` | Latest trek news articles |

---

## Technical Approach (TBD)

Options to explore:
1. **FastAPI-native MCP** — add `POST /mcp` endpoint to existing `services/api/`, implement tool dispatch
2. **Standalone MCP server** — `packages/mcp-server/` as a separate Node.js/Python process
3. **Cloudflare Worker** — edge-deployed MCP server wrapping the public REST API

---

## Prerequisite Steps

- Step 64/65 (CDP) — analytics events available to MCP server
- Step M03 (Mobile Sync endpoint) — CMS data structured for programmatic access
- Step M05 (Trek Detail) — trek detail screen spec confirms field set exposed

---

## Files (TBD)

Will be defined after requirements discussion.

---

## Notes

- Review [MCP spec](https://spec.modelcontextprotocol.io/) for transport (stdio vs SSE vs HTTP)
- Authentication strategy TBD: public read-only vs API key vs OAuth2
- Rate limiting should reuse existing FastAPI rate-limit middleware (Step 59)
- Must not expose PII (user email, payment data) via MCP tools
