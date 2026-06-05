---
number: 0002
title: "SQLite driver: better-sqlite3 over native node:sqlite"
date: 2026-05-23
author: Victor Otávio Ferreira
status: accepted
---

## Context

With the migration from Bun to Node.js (IPJA1), `bun:sqlite` — Bun's native SQLite API — had to be replaced. Node.js v22.5+ introduced an experimental native SQLite module (`node:sqlite`). Drizzle ORM, already adopted in the project, would need a compatible adapter.

Three driver options were evaluated during planning.

## Decision

Use **`better-sqlite3`** with the `drizzle-orm/better-sqlite3` adapter.

## Considered alternatives

| Alternative                                       | Analysis                                                                                                                                                                                                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `better-sqlite3`                                  | Mature, synchronous driver (like `bun:sqlite`), supported by the installed Drizzle v0.45.2. Already used in this project before Bun — the migration is a straight reversion. Native (compiled) module, requires build tools in the Dockerfile. |
| `node:sqlite` (Node.js built-in)                  | No extra dependency. However: (1) Drizzle v0.45.2 has no adapter for it — only unstable beta versions (`1.0.0-beta.16-c2458b2`); (2) still experimental in Node.js v24.                                                                        |
| Upgrade Drizzle to a beta version + `node:sqlite` | Would eliminate the native dependency. Rejected because the Drizzle beta with `node:sqlite` support uses unconventional versioning (`1.0.0-beta.16-c2458b2`), with no clear release cycle — too risky for a production project.                |

## Consequences

**Positive:**

- No change to the Drizzle version — zero regression risk in the database layer
- Synchronous API identical to `bun:sqlite` — line-by-line migration across the 4 affected files
- Widely battle-tested driver

**Negative / trade-offs:**

- Native module: requires `python3`, `make`, `g++` during `pnpm install`. Solved by using `node:26` (full image) in the Dockerfile build stage, copying `node_modules` post-`pnpm prune --prod` into the final `node:26-slim` image
- `better-sqlite3` goes into `dependencies` (not `devDependencies`) — required so `pnpm install --prod` in the production container includes it
- Requires an entry in `pnpm.onlyBuiltDependencies` to authorize the native module's build script

## Future review

Reassess `node:sqlite` once Drizzle ships stable support (conventional semantic versioning). A future migration would remove `better-sqlite3` and `@types/better-sqlite3` from the dependencies.
