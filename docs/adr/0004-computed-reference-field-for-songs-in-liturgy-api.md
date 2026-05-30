# 4. Computed `reference` field for songs in the liturgy API

Date: 2026-05-24

## Status

Accepted

## Context

The `songs` table stores four credit/catalog fields: `track` (hymnal number), `album` (hymnal name), `performer`, and `songwriter`. Not every song has all fields filled in — hymns have `track` + `album`; contemporary worship songs have `performer`; compositions with no known performer have only `songwriter`.

When building the response for a `song`-type moment in the liturgy API, there were two options.

## Decision

Expose a single computed field **`reference: string | null`** instead of the four raw fields, following this priority rule:

1. If `track` **and** `album` exist → `"<track>. <album>"` (e.g. `"45. Novo Cântico"`)
2. Else, if `performer` exists → `"<performer>"` (e.g. `"Aline Barros"`)
3. Else, if `songwriter` exists → `"<songwriter>"` (e.g. `"Autor Desconhecido"`)
4. Else → `null`

The logic lives in `buildSongReference` (`server/modules/liturgy/liturgy.ts`).

## Considered alternatives

| Alternative                         | Analysis                                                                                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expose the four raw fields          | Maximum flexibility for the frontend. But pushes presentation logic onto every consumer, which would have to reimplement the same priority rule — risk of inconsistency across platforms. |
| Computed `reference` field (chosen) | Presentation logic centralized on the server. The frontend receives exactly the text to display, with no decisions to make. Consistency guaranteed across all API consumers.              |

## Consequences

**Positive:**

- Frontend does not need to know the priority rule between credit fields
- Consistency guaranteed across all API consumers
- Smaller payload (one string field vs. four nullable fields)

**Negative / trade-offs:**

- Destructive information: the consumer cannot reconstruct `track`, `album`, `performer`, or `songwriter` individually from `reference`
- If the priority rule needs to change, the change is made on the server and affects all consumers simultaneously

## Future review

If a use case arises that requires the raw song metadata (e.g. a song detail page, integration with an external hymnal), create a dedicated `GET /api/songs/:slug` endpoint exposing all fields. The `reference` field in the liturgy API should remain as is — its purpose is display within the worship context, not metadata lookup.
