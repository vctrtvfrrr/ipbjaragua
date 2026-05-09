# CLAUDE.md

## Project

Nuxt 4 Starter Kit — a batteries-included template for real-world Nuxt 4 / Vue 3 applications.
MIT-licensed, maintained by Ali Soueidan (@lazercaveman).

## Tech Stack

MUST FOLLOW THESE RULES, NO EXCEPTIONS

- **Runtime and Package Manager:** Bun (version can be found in `package.json` enforced via `engines`)
- **Framework:** Nuxt 4 (Vue 3, `app/` directory structure)
- **Language:** TypeScript (strict mode)
- **Build:** Vite (native Nuxt integration)
- **State:** Pinia (`@pinia/nuxt`)
- **Schema and Validation:**: Zod for every external boundary (API, localStorage)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) + SCSS (Sass)
- **Linting:** Oxlint (`oxlint`) — configured in `.oxlintrc.jsonc` with `typescript` and `vue` plugins
- **Formatting:** Oxfmt (`oxfmt`) — configured in `.oxfmtrc.jsonc`
- **Testing:** Vitest + `@vitest/coverage-v8` + `@vitest/ui`
- **Git Hooks:** Husky (pre-push: lint + test)

## Directory Layout

Keep this section up to date.

```
├── app/                  # Nuxt 4 app directory (components, pages, composables, assets, stores, tests)
│   ├── components/
│   ├── pages/
│   ├── composables/
│   ├── assets/
│   │   └── scss/         # SCSS files (animations, non-Tailwind styles)
│   ├── stores/           # Pinia stores
│   └── tests/            # Vitest unit tests
├── server/               # Nitro server routes & API
│   └── api/
├── public/               # Static assets
├── .oxlintrc.jsonc       # Oxlint config — DO NOT create .eslintrc files
├── .oxfmtrc.jsonc        # Oxfmt formatter config
├── vitest.config.ts      # Vitest configuration
├── nuxt.config.ts        # Nuxt configuration
└── tsconfig.json         # TypeScript config
```

## Commands

```bash
bun install                   # Install dependencies
bun --bun run dev             # Start dev server
bun --bun run build           # Production build
bun --bun run generate        # Static site generation
bun --bun run preview         # Preview production build
bun --bun run start           # Start production server
bun --bun run type-check      # Run vue-tsc type checking
bun --bun run lint            # Run oxlint
bun --bun run lint:fix        # Run oxlint with auto-fix
bun --bun run format          # Format with oxfmt
bun --bun run format:check    # Check formatting (used in CI/pre-push)
bun run test                  # Run Vitest (watch mode)
bun run test:ui               # Run Vitest with browser UI
bun run test:coverage         # Run Vitest with v8 coverage (used in pre-push)
bun --bun run analyze         # Bundle analysis via nuxi analyze
```

Run `bun --bun run type-check`, `bun --bun run lint`, and `bun run test:coverage` before pushing — Husky enforces all three on pre-push.

## Critical Rules

- **Oxlint** All lint config goes in `.oxlintrc.jsonc`. All formatter config goes in `.oxfmtrc.jsonc`.
- **No `@apply` in SCSS.** Tailwind v4 + Sass have compatibility issues with `@apply`. Use SCSS only for things Tailwind can't do (complex animations, keyframes, third-party overrides). Use utility classes directly in templates for everything else.
- **`app/` directory structure.** Components, pages, composables, stores, and tests live under `app/`. Do not place them in the project root.
- **TypeScript strict.** All new code must be typed. No `any` unless explicitly justified with a comment.
- **Vue 3 Composition API + `<script setup lang="ts">`.** Do not use Options API.
- **Auto imports are disabled project wide.** Always import everything.
- **Pinia for state.** No other state management. Stores go in `app/stores/`.
- **Tests next to code or in `app/tests/`.** Use Vitest, not Jest. Test files use `.test.ts` or `.spec.ts` suffix.
- **Bun only.** Do not use npm, yarn or pnpm. Lock file is `bun.lock`.

## Styling Guidelines

- Default to Tailwind utility classes in `<template>`.
- SCSS is for: animations/keyframes, complex calc logic, and third-party component overrides.
- Tailwind v4 config is CSS-based (not `tailwind.config.js`). Check existing CSS for theme customizations.
- Never mix `@apply` with SCSS. If you need a reusable utility, create a Vue component instead.

## Formatting Conventions

- Oxfmt is the sole formatter — never use Prettier or Biome alongside it.
- Config is in `.oxfmtrc.jsonc`: `printWidth: 120`, single quotes, semicolons, 2-space indent.
- Run `bun --bun run format` to format in place, `bun --bun run format:check` to verify without writing (used in pre-push).
- VS Code auto-formats on save via the `oxc.oxfmt` extension (`editor.defaultFormatter`).

## Vue Component Conventions

- `<script setup lang="ts">` only
- Typed `defineProps` and `defineEmits`
- Use `defineModel()` for `v-model` cases
- Use kebab case in templates for props and emits
- Use PascalCase for component names

## Schema and Validation

Use Zod for all data contracts.

- Define schemas next the module that owns the data
- Validate on API response
- Validate on localStorage read
- Validate on module data transfer
- Export types from the schema with `z.infer`

This keeps runtime and TypeScript in sync.

## Testing Conventions

- Vitest config is in `vitest.config.ts` — check there for aliases and setup.
- Coverage provider is `v8`, not Istanbul.
- Tests live co-located with source inside `__specs__/` directories.
- Follow the naming convention `<subject>.spec.js` for unit tests, `<subject>.e2e.ts` for E2E tests, and `<subject>.nuxt.ts` for Vue component tests.
- Run `bun run test` to verify nothing is broken before finishing any task.

## Gotchas

- The Husky pre-push hook runs: type-check (`vue-tsc`) → lint (oxlint) → format check (oxfmt) → `test:coverage`. If any step fails, the push is rejected.
- `tsconfig.tsbuildinfo` is committed — don't delete it, TypeScript incremental builds depend on it.

## Imports and Auto Imports

This project disables auto imports in `nuxt.config.ts`.

```ts
export default defineNuxtConfig({
  imports: { autoImport: false },
})
```

So you must:

- Import every Vue/Nuxt composable manually
- Import every component manually

## Store Pattern

All Pinia stores use the **Composition API** pattern with setup functions.

```ts
// stores/{feature}/use{Feature}Store.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useFeatureStore = defineStore('feature', () => {
  // State (ref/reactive)
  const items = ref<Item[]>([])

  // Getters (computed)
  const itemCount = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)

  // Actions (functions)
  function addItem(item: Item) {
    items.value.push(item)
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  // Effects (watchers, initialization)
  watch(items, (newItems) => {
    saveToStorage(newItems)
  }, { deep: true })

  // Public API
  return {
    // State
    items,
    // Getters
    itemCount,
    isEmpty,
    // Actions
    addItem,
    removeItem,
  }
})
```

**Rules:**

- **State**: Use `ref()` or `reactive()` for reactive state
- **Getters**: Use `computed()` for derived state
- **Actions**: Use plain functions for state mutations and async operations
- **Side effects**: Use `watch()` for persistence, initialize data on store creation
- **Direct mutations**: State can be mutated directly in actions (no dispatch/messages)
- **Return all**: Return all state, getters, and actions for external access
- **Type safety**: TypeScript infers types from function signatures

## Boundaries

### Do not modify or index

`.nuxt/`, `.output/`, `dist/`, `coverage/`, `node_modules/`, `localcerts/`

### Do not propose

- Alternative frameworks, build tools, or package managers.
- Removing or bypassing Husky hooks.
- New dependencies unless there is a clear, justified need that existing tools (`@vueuse/core`, Pinia, etc.) cannot cover.
