# 5. Articles and Bulletins overlap by date

Date: 2026-05-29

## Status

Superseded by ADR-0007

## Context

The homepage is being reworked into a paginated listing of Articles, with a
sidebar surfacing the current Bulletin, active Announcements, and recent
Liturgies. Each content type gets its own detail page (`/articles/[slug]`,
`/bulletins/[date]`, `/liturgies/[date]`).

The existing data model does not treat a Bulletin as an independent entity. In
`server/modules/bulletin/bulletin.ts`:

- `listDates()` derives bulletin dates directly from the `articles` table — the
  set of Bulletin dates **is** the set of Article dates.
- `parseContent(date)` picks the most recent Article with `date <= date` and
  renders its markdown as the Bulletin's main body; without an Article it throws.

So a Bulletin is effectively "an Article plus that week's announcements, agenda,
and birthdays wrapped around it." This collides with promoting Articles to a
first-class, independently-listed entity:

- The Article listing and the implied Bulletin listing share the same dates.
- The most recent Article appears twice on the homepage: at the top of the main
  listing and as the body of the current Bulletin in the sidebar.
- `/articles/[date-slug]` and `/bulletins/[date]` show essentially the same body.

We considered:

- **(A)** Accept the overlap for this delivery. Article is its own entity
  (homepage + `/articles/[slug]`); Bulletin stays "Article + weekly extras"
  (sidebar + `/bulletins/[date]`). No backend remodelling.
- **(B)** Decouple now: make Bulletin a standalone entity with its own identity
  that optionally references an Article. Cleaner, but requires a schema change
  and data migration.

## Decision

We chose **(A)**. The homepage rework ships against the existing model; Bulletin
continues to derive from Article. The duplication of the most-recent Article (as
both a listed Article and the current Bulletin's body) is tolerated.

## Consequences

- Minimal backend change to ship the homepage rework.
- Known, accepted redundancy: the latest Article surfaces in two places on the
  homepage, and its body is reachable under two URLs.
- A future, out-of-scope effort intends to consolidate Bulletin into a pure
  **aggregator** — a page that gathers the week's Article, Announcements, and
  Liturgy — at which point Bulletin would reference content rather than derive
  its body from an Article. This ADR should be revisited (and likely superseded)
  when that work begins.
