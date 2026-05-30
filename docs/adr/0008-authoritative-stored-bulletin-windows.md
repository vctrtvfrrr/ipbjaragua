# 8. Agenda and birthday windows are stored, authoritative columns

Date: 2026-05-30

## Status

Accepted

## Context

A Bulletin's agenda and birthday sections each cover a date window. The natural
defaults are derived from the Bulletin's `date`:

- Agenda: `date + 1` through `date + 7` (the week ahead).
- Birthdays: `date` through `date + 6`.

The obvious implementation computes these windows at render time from `date`.
But Bulletins can now be published on any weekday (ADR-0007), and exceptional
Bulletins may need windows that do not follow the default offsets. The windows
therefore need to be **overridable per Bulletin**, which a pure render-time
computation cannot express.

(The Announcements section is deliberately excluded: it always filters
`expires_at >= date` — a single open-ended bound, not a window — so it needs no
stored columns.)

## Decision

Store the windows as columns on `bulletins`: `agenda_start`, `agenda_end`,
`birthdays_start`, `birthdays_end`. They are seeded from `date` using the default
offsets at **creation time** (in the application/Zod layer — SQLite cannot
default to `date + N`), and are then **authoritative**: editing a Bulletin's
`date` does **not** recompute them.

## Rationale

If editing the date silently re-seeded the windows, any manual override would be
destroyed — the columns would not really be editable, defeating the reason they
exist. Treating the stored windows as the source of truth, with `date` reduced
to the Bulletin's identity/display anchor (and the Announcements bound), is the
only model consistent with "explicit, overridable windows." For a normal Sunday
Bulletin the seeded defaults reproduce the previous behaviour exactly.

## Consequences

- The stored windows can drift from `date` (e.g. after a date edit). This is the
  intended price of flexibility for exceptional Bulletins, not a bug.
- A reader of the schema sees stored dates where computation would seem simpler;
  this ADR is the answer to "why aren't these computed from `date`?"
- Whoever edits a Bulletin's date is responsible for adjusting the windows if the
  defaults are desired.
