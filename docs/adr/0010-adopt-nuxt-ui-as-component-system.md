---
number: 0010
title: Adopt Nuxt UI as the component system
date: 2026-06-05
author: Victor Otávio Ferreira
status: accepted
---

## Context

The site has no visual identity. Today it is plain HTML with ad-hoc Tailwind utilities and a single hand-written stylesheet (`app/assets/style/tailwind.css`) carrying `@apply`-based rules and hardcoded accent colors (`green-900`, `red-500`, `slate-*`). There is no design-token layer, no shared component primitives, and no consistency mechanism — every component re-styles from scratch. The current UI is explicitly throwaway/staging markup, kept only for homologation until a definitive UI lands.

We want to (1) standardize the existing components behind a solid component library, and (2) build a proper visual identity over time. These are two separate efforts; a component library addresses (1) directly and is the vehicle for (2), but does **not** by itself constitute an identity — the palette, type scale, density, and layout still have to be designed and applied as theme tokens later.

The stack already runs Tailwind v4 (via `@tailwindcss/vite`) and Nuxt 4, which is the substrate Nuxt UI v4 targets. A separate, concurrent effort is removing the project's `imports.autoImport: false` rule, so the auto-import friction that would otherwise clash with Nuxt UI's globally-registered `U*` components is being resolved independently.

CLAUDE.md sets an explicit boundary — *"New dependencies unless existing tools genuinely can't cover the need"* — so adopting a large UI framework needs a recorded decision: it is a deliberate exception, and a future reader scanning `package.json` will otherwise wonder why a static church-bulletin site pulls in such a heavy dependency tree.

## Decision

Adopt **Nuxt UI v4** (`@nuxt/ui`, currently 4.8.2) as the project's component system.

Scope of the adoption, in two sequential steps:

1. **Install/config (mergeable on its own).** Add `@nuxt/ui` to `modules`; replace the standalone `@tailwindcss/vite` plugin with the CSS entry `@import "tailwindcss"; @import "@nuxt/ui";`; drop the explicit `@nuxt/fonts` module entry and dependency (Nuxt UI registers `@nuxt/fonts`, `@nuxt/icon`, and `@nuxtjs/color-mode` automatically); create `app/app.vue` wrapping the app in `<UApp>` (required for toasts, tooltips, and programmatic overlays); bundle the default icon set locally (`@iconify-json/lucide` as a devDependency) so `@nuxt/icon` never resolves icons from the Iconify HTTP API at runtime.
2. **Shell + tokens refactor.** Migrate the structural shell — layout container, header, sidebar boxes, and CTAs — to Nuxt UI primitives (`UContainer`, `UCard`, `UButton`, etc.), and replace hardcoded Tailwind colors/typography in the domain content renderers with Nuxt UI semantic tokens (`text-muted`, `text-highlighted`, `bg-elevated`, …).

Deliberate non-goals for this adoption:

- The **domain content renderers** (`LiturgyMoment*`, `BulletinArticle`, `BulletinLiturgy`, `BulletinBirthdays`, etc.) are not "componentized" into Nuxt UI — there is no Nuxt UI primitive for a "liturgy moment." They keep their structure and only adopt the semantic tokens.
- The **Satori OG-image component** (`app/components/OgImage/*.satori.vue`) is out of scope — Satori renders a restricted CSS subset and does not understand Nuxt UI components.
- A bespoke **visual identity** (custom palette, fonts, dark-mode token mapping) is explicitly deferred. Phase 1 ships with Nuxt UI defaults, including its default color-mode behavior; the throwaway styles are discarded rather than preserved.

## Rationale

Nuxt UI is the official, batteries-included Nuxt component framework: accessible primitives built on Reka UI, a coherent default look, and a token-based theming system (`app.config.ts` + Tailwind v4 `@theme`) that is exactly the "vehicle for an identity" we need. It is the lowest-friction path to consistency on this stack, and the auto-import conflict that was its main obstacle here is being removed independently.

We accept that it is a kitchen-sink dependency: it transitively pulls in TipTap, Embla, TanStack Table/Virtual, motion-v, fuse.js, vaul, and more — most of which a static content site will never use. The alternative of wiring Reka UI directly (lighter, headless — it is Nuxt UI's own foundation) or hand-rolling Tailwind components was considered and rejected: both forfeit the ready-made theming system and the velocity of an official, maintained integration, in exchange for bundle weight we judge acceptable for an SSR-on-Node site.

## Considered Alternatives

- **Reka UI directly.** Headless, lighter, the actual foundation Nuxt UI is built on. Rejected: we would have to build and maintain our own styling/theming layer — the very work Nuxt UI gives us for free — to save transitive weight that does not materially hurt this deployment.
- **Hand-rolled Tailwind components.** No new dependency, maximal control. Rejected: it reproduces from scratch the consistency and theming system we are adopting Nuxt UI to get, and is the status quo that left the site without an identity.

## Consequences

- A deliberate, recorded exception to CLAUDE.md's "no new dependencies" boundary; CLAUDE.md will be updated to recognize Nuxt UI as the sanctioned component system, treat the `U*` components as global, and point styling guidance at semantic tokens + `app.config.ts` rather than ad-hoc utilities.
- Significant transitive dependency weight enters a small content site. This is the accepted price of the official integration and is the reason this ADR exists — it is not an oversight to be "cleaned up."
- The standalone `@tailwindcss/vite` plugin and the explicit `@nuxt/fonts` module entry/dependency are removed in favor of Nuxt UI's bundled registration; the `@nuxt/icon`/`@nuxt/fonts`/`@nuxtjs/color-mode` modules now come from Nuxt UI.
- `app/app.vue` is introduced (none existed before), changing how layouts/pages are rooted.
- The install/config step and the shell refactor are split across two commits/PRs, and the merge must be coordinated with the concurrent `autoImport` removal, since both touch `nuxt.config.ts` and the app root.
- Default color-mode (system preference, including dark) ships as-is in phase 1; making dark mode genuinely correct is folded into the deferred identity/token work.
