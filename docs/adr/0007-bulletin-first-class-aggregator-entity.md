# 7. Bulletin becomes a first-class aggregator entity

Date: 2026-05-30

## Status

Accepted

(Supersedes ADR-0005.)

## Context

ADR-0005 deliberately deferred decoupling the Bulletin: it kept deriving a
Bulletin from the `articles` table (`listDates()` and `parseContent()` in
`server/modules/bulletin/bulletin.ts`), accepting the resulting duplication, and
explicitly flagged that a future effort would consolidate the Bulletin into a
pure aggregator and supersede that ADR. This is that effort.

Two things also changed in the meantime:

- The Markdown content under `content/` is gone. Bulletins are now registered in
  the database.
- The product framing of a Bulletin sharpened: the **weekly Announcements,
  weekly agenda, and birthdays are the primary reason a Bulletin exists**. An
  Article and a Liturgy are optional enrichments, not the Bulletin's body.

The old model could not express any of this. A Bulletin had no identity of its
own — it *was* the most recent Article plus computed extras — so it could not
exist without an Article, could not reference a specific Liturgy, and could not
be published on a non-Sunday.

## Decision

Introduce a first-class `bulletins` table that **aggregates** the week's content
rather than deriving its body from an Article:

- Own identity, keyed by `date` (unique). The current Bulletin and the detail
  page are sourced from this table, not from `articles`.
- An optional `title` (nullable); the front-end falls back to "Boletim Semanal"
  when absent. The date is always displayed separately, below the title.
- `article_id` and `liturgy_id` as **nullable** foreign keys. A Bulletin may
  have neither; the weekly Announcements, agenda, and birthdays stand on their
  own.
- Three boolean flags — `show_announcements`, `show_agenda`, `show_birthdays`
  (default `true`) — toggle the computed sections per Bulletin. Article and
  Liturgy need no flag: presence of the FK is their on/off switch.
- The Bulletin's `date` is no longer assumed to be a Sunday; exceptional
  weekday Bulletins are supported, with the flags suppressing sections that do
  not apply.

The endpoint delivers **structured data only** (the front-end renders). The
`bulletin` module **composes** the existing `articles` and `liturgy` modules to
embed their full structured content via the FKs — server-side Markdown-to-HTML
assembly (and its string-concatenation XSS surface) is removed. The list
endpoint `/api/bulletins` and the orphaned `BulletinIndex.vue` are dropped:
Bulletins are not surfaced in navigation, only by direct URL.

## Rationale

A Bulletin that cannot exist without an Article contradicts what a Bulletin now
is — a weekly aggregator whose core is Announcements, agenda, and birthdays.
Making it first-class with optional references inverts the old dependency
(Article → Bulletin becomes Bulletin → Article) and removes the duplication
ADR-0005 tolerated. Embedding full structured content keeps the Bulletin a
complete weekly page while letting the durable entities keep their own permanent
pages.

## Consequences

- Schema change and a new migration; no data migration (no prior Bulletin table
  existed — Bulletins were derived).
- The same Article/Liturgy content is reachable both inside a Bulletin and on
  its own detail page. This duplication is intentional: the Bulletin is the
  complete weekly handout; the detail pages are the durable, permanent home.
- Window computation for the agenda and birthdays sections is materialized and
  authoritative rather than derived at render — see ADR-0008.
