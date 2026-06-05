---
number: 0009
title: Wedding anniversaries in the bulletin pair two members only
date: 2026-05-31
author: Victor Otávio Ferreira
status: accepted
---

## Context

The Birthdays section of the Bulletin (Aniversariantes) listed only age birthdays of active members. We want it to also list wedding anniversaries in the same weekly list, shown as the couple joined by a heart — `Fernanda ♥ Danilo`, woman first.

The `members` table already stores `wedding_date`, `spouse` (free text with the partner's name) and `sex`, but nothing consumed them. There is **no foreign key linking a member to their spouse** — the only link is the free-text `spouse` name. A reality check on the production data (81 active members) showed: 50 have a non-empty `wedding_date`; 41 member rows pair successfully when one member's `spouse` matches another active member's `full_name` **and** both share the same `wedding_date`; matching on name alone would have paired 43, but 2 of those have divergent wedding dates.

## Decision

A wedding anniversary is built by **pairing two active members**: member A pairs with member B when `A.spouse == B.full_name` and `A.wedding_date == B.wedding_date` (non-empty), both `status = 'active'` and not soft-deleted. The pair forms if **either** direction matches, then couples are deduplicated to a single entry. When no member partner can be matched — the spouse is not a member, the names diverge in spelling, or the partner is inactive/deceased — the wedding anniversary is **omitted** entirely; we never render a couple with only one member.

The display string is `Woman ♥ Man` (♥ = U+2665), ordered woman-first via the `sex` field (fallback alphabetical when `sex` is missing or equal). Each name uses up to its first two tokens, stopping before a Portuguese preposition (`de/da/do/dos/e`), so `Ana Lúcia ♥ Júlio Cesar` but `Bruno ♥ Sabrina`. Weddings reuse the existing `birthdays_from`/`birthdays_to` window (matched on the `wedding_date` month-day) and the existing `show_birthdays` toggle — no new bulletin schema fields. Each wedding is appended as a plain string into the existing `BirthdayGroup.names`, after the day's age birthdays.

## Rationale

Pairing members rather than reading the `spouse` free text directly guarantees both names are real, canonical member names and lets us order by the partner's `sex`. Requiring a shared `wedding_date` on top of the name match removes false pairs from homonyms and couples married on the same day (it discarded 2 mismatches in the real data). The church explicitly prefers to omit a couple where only one half is a member over rendering a half-couple or trusting unverified free text — accepting that ~9 of 50 married members will not appear.

## Considered Alternatives

- **Use the `spouse` free text directly** (`first name of member` ♥ `first name of spouse`). Would cover couples where only one spouse is a member, but renders unverified text, cannot order by `sex` of the partner, and duplicates the couple when both are members. Rejected in favour of verified member pairing.
- **Pair by `wedding_date` alone.** Simpler, but mis-pairs distinct couples married on the same day and breaks when 3+ members share a date. Rejected.
- **A separate `show_weddings` toggle / schema field.** More control, but needs a migration and admin UI for a section that conceptually is one list. Rejected as out of scope.

## Consequences

- The `spouse` ↔ `full_name` match is **spelling-fragile**: a nickname, missing middle name, or accent divergence silently drops a couple. This is accepted; data hygiene in the members table is the remedy, not match-loosening.
- Age birthdays render the full `full_name`, while weddings render up to two tokens — the same list mixes full and short names by design.
- A wedding anniversary disappears the moment either spouse becomes inactive (transferred, deceased, removed), with no separate signal.
