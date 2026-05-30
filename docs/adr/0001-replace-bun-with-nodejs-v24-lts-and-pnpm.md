# 1. Replace Bun with Node.js v24 LTS and pnpm

Date: 2026-05-23

## Status

Accepted

## Context

The project used Bun as both its runtime and package manager from the start. Bun was adopted for its fast installs and its native SQLite API (`bun:sqlite`). After the database migration to SQLite + Drizzle ORM (IPJI1), `bun:sqlite` became the only Bun-exclusive dependency left in the project.

The Nuxt/Nitro ecosystem evolved toward first-class Node.js support, while Bun support remained secondary — requiring special flags (`--bun`) for tools like Vitest to work correctly.

## Decision

Migrate to **Node.js v24 LTS** as the runtime and **pnpm v10** as the package manager.

- Node.js v24 is the active LTS line, with support guaranteed through April 2028
- pnpm v10 is pnpm's LTS line — faster installs than npm via a shared store
- The version is pinned in `package.json#packageManager` and managed via corepack

## Considered alternatives

| Alternative            | Reason for rejection                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Keep Bun               | Marginal Nuxt/Nitro compatibility; `--bun` flags in every script; `bun:sqlite` is a single, replaceable dependency |
| Node.js v26            | Not LTS yet (becomes LTS in October 2026); version unavailable via nvm in the current dev environment              |
| npm as package manager | No advantage over pnpm; pnpm's shared store reduces disk usage across multiple projects                            |
| yarn                   | No clear benefit over pnpm in this context                                                                         |

## Consequences

**Positive:**

- Full Nuxt/Nitro ecosystem compatibility without special flags
- Simpler scripts — `pnpm run X` instead of `bun --bun run X`
- LTS support guaranteed through 2028
- Integration with CI/CD and infrastructure tooling that assume Node.js

**Negative / trade-offs:**

- `bun:sqlite` must be replaced by an npm driver (`better-sqlite3`) — see IPJA2
- pnpm requires extra configuration (`.npmrc`, `onlyBuiltDependencies`) for native modules
- `vite` must be declared as an explicit devDependency to avoid duplicate pnpm instances that break the type-check
