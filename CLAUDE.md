# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build      # tsc → dist/
npm run dev        # tsx watch (hot-reload, no build needed)
npm run start      # run built dist/index.js
npm run inspector  # MCP inspector UI for manual tool testing
```

No test or lint scripts exist.

## Architecture

MCP server that exposes Taiga project management as Claude tools, communicating over stdio.

**Entry point** (`src/index.ts`): loads config → creates `TaigaClient` → collects all tool arrays → registers each with `server.tool()` → connects via `StdioServerTransport`.

**Auth** (`src/client.ts`): lazy login on first request. On 401, tries refresh token rotation; falls back to full re-login if refresh fails. Token stored in-memory only.

**Tool pattern** (`src/tools/*.ts`): each file exports `fooTools(client: TaigaClient)` returning an array of `{ name, description, inputSchema: ZodObject, handler }`. To add a new domain, create a file following this pattern and spread it into `allTools` in `index.ts`.

**Response shaping**: handlers return a formatted subset of Taiga API data, not raw responses. Keep formatters lean — LLM consumers don't need every field.

**Deletes** (`src/tools/deletes.ts`): uses `deleteToolFor()` factory to avoid boilerplate — follow the same pattern for any future uniform delete operations.

## Key Constraints

- **ESM module** with `"module": "Node16"` — all local imports **must** use `.js` extension (e.g., `import { TaigaClient } from "../client.js"`).
- **Optimistic locking**: Taiga `PATCH` endpoints require a `version` field matching the current object version. All `update_*` tools expose this as a required param.
- **Config**: three env vars required at startup — `TAIGA_URL`, `TAIGA_USERNAME`, `TAIGA_PASSWORD`. Set via `.env` locally (not auto-loaded — pass via shell or MCP env config).
- No tests. Validate changes with `npm run inspector` against a real Taiga instance.
