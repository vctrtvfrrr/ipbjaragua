# CLAUDE.md

Stack, scripts, directory layout, and tooling config are discoverable from `package.json`, `nuxt.config.ts`, `vitest.config.ts`, `drizzle.config.ts`, `.oxlintrc.jsonc`, `.oxfmtrc.jsonc`, and the file tree. This file records only what you can't infer by reading the repo.

## Rules

- **pnpm only.** Never npm/yarn/Bun.
- **Oxfmt is the only formatter** — never add Prettier or Biome. Lint config goes in `.oxlintrc.jsonc`, format config in `.oxfmtrc.jsonc`. Never create `.eslintrc`/`.prettierrc`.
- **No `@apply` in SCSS** (Tailwind v4 + Sass break on it). Use SCSS only for what Tailwind can't do — animations/keyframes, complex `calc`, third-party overrides. Otherwise use utilities in templates, or extract a Vue component for reuse.
- **Auto imports are off.** Import every component, composable, and Vue/Nuxt API manually.
- **Vue:** `<script setup lang="ts">` only (no Options API). Typed `defineProps`/`defineEmits`, `defineModel()` for `v-model`. kebab-case props/emits in templates, PascalCase component names.
- **TypeScript strict.** No `any` without an inline comment justifying it.
- **State:** Pinia only, Composition-API setup stores in `app/stores/` (none exist yet).
- **Zod at every boundary** (API responses, localStorage reads, module data transfer); export types via `z.infer`. Schemas live next to their owner module; types crossing the client/server boundary go in `shared/` as the single source of truth.
- **Tests** are co-located in `__specs__/` dirs. Vitest selects the project by suffix: `.spec.ts` → unit (node), `.e2e.ts` → e2e (node), `.nuxt.ts` → Vue component (nuxt env). Run `pnpm test` before finishing a task.

## Commits

Conventional Commits, English, imperative, lowercase subject, no trailing period, ≤72 chars. Types: `feat`, `fix`, `docs`, `style`, `refact` (note: not `refactor`), `chore`.

## Database

Drizzle + SQLite. No pnpm aliases — invoke Drizzle Kit directly: `npx drizzle-kit generate | migrate | studio`. Access the DB only through `server/db/client.ts`; never instantiate `better-sqlite3` ad hoc.

## Server architecture

Domain logic lives in `server/modules/<feature>/` (public API via `index.ts`). `server/api/` route handlers stay thin and delegate to a module.

## Gotchas

- `tsconfig.tsbuildinfo` is committed — don't delete it; incremental builds depend on it.
- `vite` is an explicit devDependency to stop pnpm resolving multiple Vite instances (which breaks types in `nuxt.config.ts`).

## Do not propose

- Alternative frameworks, build tools, or package managers.
- Removing or bypassing Husky hooks (pre-commit: type-check → lint → format; pre-push: test:coverage).
- New dependencies unless existing tools (Pinia, `@vueuse/core`, …) genuinely can't cover the need.

## Platform contract

- Deploy: the workflow builds/pushes the image, then calls the shared `deploy-stack` action (configured as a full Gitea URL). The action renders the host `.env`, rsyncs `compose.yml` to `/opt/compose/ipbjaragua/`, and runs `docker compose up -d`.
- `traefik-public` is external and platform-owned — never invent a network; a stack-local one can't reach Traefik.
- This stack owns the `ipbjaragua.org.br` zone, serves the apex, and redirects `www.` inline in `compose.yml` (not the platform wildcard-subdomain pattern).
- `.env.example` is the full env schema: every var the app reads, secret or not, each with a local-dev default. Non-secret config stays there, never hoisted into `compose.yml`. Production `DATABASE_URL` is a CI override in `deploy.yml`, not committed.
- `/opt/data/ipbjaragua` holds the SQLite DB (mounted at `/app/data`) — persistent host state, never touched by a deploy.
- Secrets live only in the Vault collection `IPB Jaraguá` (the name differs from the service, so `deploy.yml` sets `collection: "IPB Jaraguá"`). `NUXT_OG_IMAGE_SECRET` has an empty default in `.env.example` and is rendered into the host `.env` at deploy.
- The repo carries the Gitea topic `codelab-stack` for the stack inventory.

Canonical infra contract: [codelab-infra](https://git.codelab.tec.br/codelab/infra) (`CONTEXT.md`, `docs/adr/`, `templates/stack/`) and [deploy-stack](https://git.codelab.tec.br/codelab/deploy-stack).

## Docs & agents

- Domain: `CONTEXT.md` + `docs/adr/` (see `docs/agents/domain.md`).
- Issues: Gitea `codelab/ipbjaragua` via the `tea` CLI (`docs/agents/issue-tracker.md`).
- Triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` (`docs/agents/triage-labels.md`).
