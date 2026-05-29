# Context

Glossary of the domain language for the IPB de Jaguará do Sul site. Terms are
canonical: use these names in code, routes, and conversation.

## Terms

### Bulletin (Boletim)

The weekly handout given out at the Sunday service. Contains the order of
service (the Liturgy), Announcements, the weekly agenda, and birthdays. Indexed
by date. In US English "bulletin" / "church bulletin" / "worship bulletin" is
the idiomatic term for this physical/printed handout.

A Bulletin **contains** a Liturgy but is a distinct entity: the Liturgy has its
own URL and detail page (`/liturgies/[date]`), independent of the Bulletin that
embeds it.

A Bulletin is **ephemeral**: it is time-bound and not archived in navigation.
Its durable content (Articles, Liturgies) is published independently with its
own permanent pages. Old Bulletins are reachable only by direct URL.

Bulletins may be registered with a **future date** (e.g. next Sunday's bulletin
entered ahead of time). The "current bulletin" is the most recent one whose date
is on or before today; that is the only Bulletin surfaced in navigation (the
homepage sidebar).

Detail route: `/bulletins/[date]`.

### Liturgy (Liturgia)

The order of service — the structured sequence of the worship service (acts →
moments: readings, songs, prayers, sermon, sacraments, etc.). Indexed by date
(unique). Distinct from the Bulletin that contains it; has its own detail page.

Note: "order of service" in English refers to the Liturgy specifically, **not**
to the whole Bulletin.

Detail route: `/liturgies/[date]`.

### Article (Artigo)

A written piece authored for the congregation (e.g. a pastoral reflection).
Indexed by slug. The homepage is the paginated listing of all Articles.

Detail route: `/articles/[slug]`.

### Announcement (Aviso)

A short, time-bound notice (has a required expiry date). May carry an optional
URL. Has a status derived from its expiry: `active`, `expired`, or `all`.
Surfaced in the homepage sidebar.
