# 3. Discriminated union for liturgy moment types

Date: 2026-05-24

## Status

Accepted

## Context

The `liturgy_moments` table uses a `type` field to discriminate seven moment categories (`song`, `bible_reading`, `prayer`, `sermon`, `sacrament`, `pastoral_act`, `other`). Each category uses a different subset of the table's columns — for example, `sermon_speaker` only makes sense for `sermon`; `sacrament_type` only makes sense for `sacrament`.

When exposing these moments via `GET /api/liturgies/:date`, there were two ways to model the response.

## Decision

Model `LiturgyMoment` as a **discriminated union on the `type` field**, where each variant exposes only the fields relevant to its type.

```ts
type LiturgyMoment =
  | { type: 'song';         position: number; song: SongData | null }
  | { type: 'bible_reading'; position: number; scripture_passages: ScripturePassage[] | null }
  | { type: 'prayer';       position: number; description: string | null }
  | { type: 'sermon';       position: number; sermon_speaker: ...; sermon_reference: ...; sermon_theme: ... }
  | { type: 'sacrament';    position: number; sacrament_type: 'baptism' | 'eucharist' | null }
  | { type: 'pastoral_act'; position: number; description: string | null }
  | { type: 'other';        position: number; description: string | null }
```

## Considered alternatives

| Alternative                          | Analysis                                                                                                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Flat object with all fields nullable | Simple to serialize. But exposes fields with no meaning for the moment's type (`sermon_speaker: null` on a bible reading), bloats the payload unnecessarily, and loses the expressiveness of the API contract.                                         |
| Discriminated union (chosen)         | Precise contract: the consumer knows exactly which fields exist after narrowing on `type`. Aligns the API contract with the domain model. Requires the server to build different objects per type — low implementation cost (one exhaustive `switch`). |

## Consequences

**Positive:**

- Self-documenting API contract: `type` determines which fields to expect
- Frontend TypeScript can narrow with `if (moment.type === 'sermon')` and access fields with full safety
- No irrelevant fields leak into the response (no phantom `null`s)
- The exhaustive `switch` on the server is compiler-checked — adding a new type without handling its case is a build error

**Negative / trade-offs:**

- Consumers that do not narrow must deal with a union instead of a predictable object
- Adding a new moment type requires changes in the schema, the server `switch`, and the client code

## Pattern to follow

Every new type added to the `liturgy_moments` `type` enum must:

1. Be added to the `switch` in `buildMoment` (`server/modules/liturgy/liturgy.ts`)
2. Have its own typed variant in `LiturgyMoment`
3. Expose only the fields defined in the schema for that type (see IPJP1)
