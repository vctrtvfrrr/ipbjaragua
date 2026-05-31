# Context

Glossary of the domain language for the IPB de Jaguará do Sul site. Terms are
canonical: use these names in code, routes, and conversation.

## Terms

### Bulletin (Boletim)

The weekly handout given out at the worship service. Its core is the week's
Announcements, the weekly agenda, and birthdays; it may also carry an Article
and the order of service (the Liturgy). Indexed by date. In US English
"bulletin" / "church bulletin" / "worship bulletin" is the idiomatic term for
this physical/printed handout.

The Announcements, agenda, and birthdays are why a Bulletin exists; the Article
and the Liturgy are **optional** — a Bulletin may have neither. Usually dated on
a Sunday, but exceptional Bulletins may be issued on other weekdays.

A Bulletin **embeds** the full content of its Article and Liturgy, but they are
distinct entities: each has its own URL and permanent detail page
(`/articles/[slug]`, `/liturgies/[date]`), independent of the Bulletin that
embeds it.

A Bulletin is **ephemeral**: it is time-bound and not archived in navigation.
Its durable content (Articles, Liturgies) is published independently with its
own permanent pages. Old Bulletins are reachable only by direct URL.

Bulletins may be registered with a **future date** (e.g. next Sunday's bulletin
entered ahead of time). The "current bulletin" is the most recent one whose date
is on or before today; that is the only Bulletin surfaced in navigation (the
homepage sidebar).

Detail route: `/bulletins/[date]`.

### Weekly agenda (Agenda semanal)

The list of church events for the **coming** week, grouped by weekday. Its window runs from the day after the Bulletin's date through the following seven days — so the Sunday it lists is the *next* Sunday, not the one the Bulletin itself is dated on. Because of this, Sunday is shown **last** in the agenda, after Saturday, rather than first.

### Birthdays section (Aniversariantes)

The Bulletin section that lists the active members celebrating in the Bulletin's week — both **birthdays** (date of birth) and **wedding anniversaries** (date of marriage), grouped by calendar day in a single list.

A wedding anniversary is shown as the couple joined by a heart — `Fernanda ♥ Danilo`, woman first. It only surfaces when **both spouses are members** of the church: a couple is paired by matching one member's recorded spouse name to the other member's name on a shared wedding date. When the spouse is not a member (or cannot be matched), the wedding anniversary is **omitted** — the church deliberately does not list a couple where only one half is a member.

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
