# 6. Add nuxt-og-image for dynamic social cards

Date: 2026-05-29

## Status

Accepted

## Context

The homepage rework introduces per-page metadata, including Open Graph / Twitter cards (full social previews) on the homepage and on the Article, Bulletin, and Liturgy detail pages. Rich previews matter here: church content is shared mostly over WhatsApp and social media, where the card image drives clicks.

There is no image infrastructure today: `public/` holds only `favicon.ico`, and no schema (articles, liturgies, bulletins) has an image field. So a per-page `og:image` has no source.

Options considered:

- **(A)** A single site-wide default OG image (church logo/photo) on every page. No new dependency, but requires producing the asset and yields identical cards across all pages.
- **(B)** Generate `og:image` per page dynamically (e.g. the Article title rendered into an image) via the `nuxt-og-image` module.
- **(C)** Ship without `og:image` for now (title + description + `og:type/url`).

CLAUDE.md sets a boundary: do not add dependencies without a clear, justified need that existing tools cannot cover. `nuxt-og-image` is a new dependency, so it needs an explicit decision.

## Decision

We chose **(B)**: add `nuxt-og-image` and generate per-page cards dynamically.

Rationale: there is no image asset to back option (A), and per-page cards (with the Article/Liturgy title and date) are materially better for sharing than a single static image. The site runs as a live SSR server (`ssr: true`, Nitro `node-server` preset), so images can be generated at runtime; `nuxt-og-image` renders via satori (no headless browser required), keeping the runtime footprint modest.

This is a deliberate exception to the "no new dependencies" boundary, justified by the lack of an existing tool that covers dynamic OG image generation.

## Consequences

- New dependency and a `modules` entry in `nuxt.config.ts`; OG image templates to author and maintain.
- Per-page social cards across home and all detail pages, with no per-record image data required in the schema.
- Build/CI must support the module's image generation. Revisit if it complicates `nuxt generate` or the deployment pipeline.
