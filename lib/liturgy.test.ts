import { describe, expect, it } from 'vitest'
import {
  buildLiturgyActErrorSummary,
  buildLiturgyDuplicationDefaults,
  draftLiturgyTreeSchema,
  liturgyTreeSchema,
} from './liturgy'

const source = {
  theme: 'Culto de Domingo',
  time: '19:00',
  description: 'Tema anterior',
  acts: [
    {
      name: 'Abertura',
      moments: [
        {
          type: 'song' as const,
          description: 'Hino de entrada',
          song_id: 10,
          scripture_passages: null,
          sermon_speaker: null,
          sacrament_type: null,
        },
        {
          type: 'bible_reading' as const,
          description: null,
          song_id: null,
          scripture_passages: [{ reference: 'Salmo 1', text: 'Bem-aventurado...', version: 'ARA' }],
          sermon_speaker: null,
          sacrament_type: null,
        },
      ],
    },
    {
      name: 'Pregação',
      moments: [
        {
          type: 'sermon' as const,
          description: 'A graça',
          song_id: null,
          scripture_passages: [],
          sermon_speaker: 'Rev. João',
          sacrament_type: null,
        },
      ],
    },
  ],
}

describe('buildLiturgyDuplicationDefaults', () => {
  it('copies theme, time, description and the full act/moment tree in order', () => {
    const defaults = buildLiturgyDuplicationDefaults(source, {
      suggestedDate: '2026-07-19',
      activeSongIds: new Set([10]),
    })

    expect(defaults).toEqual({
      date: '2026-07-19',
      theme: 'Culto de Domingo',
      time: '19:00',
      description: 'Tema anterior',
      acts: [
        {
          name: 'Abertura',
          moments: [
            {
              type: 'song',
              description: 'Hino de entrada',
              song_id: 10,
              scripture_passages: [],
              sermon_speaker: '',
              sacrament_type: null,
            },
            {
              type: 'bible_reading',
              description: '',
              song_id: null,
              scripture_passages: [{ reference: 'Salmo 1', text: 'Bem-aventurado...', version: 'ARA' }],
              sermon_speaker: '',
              sacrament_type: null,
            },
          ],
        },
        {
          name: 'Pregação',
          moments: [
            {
              type: 'sermon',
              description: 'A graça',
              song_id: null,
              scripture_passages: [],
              sermon_speaker: 'Rev. João',
              sacrament_type: null,
            },
          ],
        },
      ],
    })
  })

  it('clears the song reference when the song is no longer active', () => {
    const defaults = buildLiturgyDuplicationDefaults(source, {
      suggestedDate: '2026-07-19',
      activeSongIds: new Set(),
    })

    expect(defaults.acts[0].moments[0].song_id).toBeNull()
    expect(defaults.acts[0].moments[0].description).toBe('Hino de entrada')
  })
})

describe('buildLiturgyActErrorSummary', () => {
  it('groups validation errors by act name', () => {
    const summary = buildLiturgyActErrorSummary(
      {
        'acts.0.name': ['Campo obrigatório'],
        'acts.0.moments.0.description': ['Cântico exige música ou descrição'],
        'acts.1.moments.0.sacrament_type': ['Sacramento exige tipo'],
      },
      [{ name: 'Adoração' }, { name: 'Consagração' }]
    )

    expect(summary).toEqual([
      {
        actIndex: 0,
        label: 'Adoração',
        messages: ['Campo obrigatório', 'Cântico exige música ou descrição'],
      },
      { actIndex: 1, label: 'Consagração', messages: ['Sacramento exige tipo'] },
    ])
  })

  it('orders groups by act, whatever order the errors arrive in', () => {
    const summary = buildLiturgyActErrorSummary(
      {
        'acts.2.name': ['Campo obrigatório'],
        'acts.0.name': ['Campo obrigatório'],
        'acts.1.name': ['Campo obrigatório'],
      },
      [{ name: 'Adoração' }, { name: 'Confissão' }, { name: 'Consagração' }]
    )

    expect(summary.map((group) => group.actIndex)).toEqual([0, 1, 2])
  })

  it('uses the numbered label when an act has no name', () => {
    const summary = buildLiturgyActErrorSummary(
      { 'acts.1.moments.0.scripture_passages': ['Leitura bíblica exige ao menos uma passagem'] },
      [{ name: 'Adoração' }, { name: '  ' }]
    )

    expect(summary).toEqual([
      {
        actIndex: 1,
        label: 'Ato 2',
        messages: ['Leitura bíblica exige ao menos uma passagem'],
      },
    ])
  })

  it('excludes errors outside the act accordion', () => {
    const summary = buildLiturgyActErrorSummary(
      {
        date: ['Data inválida'],
        time: ['Horário obrigatório'],
        theme: ['Campo obrigatório'],
        description: ['Descrição inválida'],
        acts: ['Liturgia exige ao menos um Ato'],
      },
      []
    )

    expect(summary).toEqual([])
  })
})

const incompleteTree = {
  date: '2026-06-07',
  theme: 'Culto Solene',
  time: '09:00',
  description: '',
  acts: [] as Array<Record<string, unknown>>,
}

describe('draftLiturgyTreeSchema', () => {
  it('accepts a liturgy with no acts, a nameless act, an empty song and a passage-less reading', () => {
    const result = draftLiturgyTreeSchema.safeParse(incompleteTree)

    expect(result.success).toBe(true)
  })

  it('accepts an act without a name and moments missing their completeness fields', () => {
    const result = draftLiturgyTreeSchema.safeParse({
      ...incompleteTree,
      acts: [
        {
          name: '',
          moments: [
            {
              type: 'song',
              description: '',
              song_id: null,
              scripture_passages: [],
              sermon_speaker: '',
              sacrament_type: null,
            },
            {
              type: 'bible_reading',
              description: '',
              song_id: null,
              scripture_passages: [],
              sermon_speaker: '',
              sacrament_type: null,
            },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('still requires a sacrament type for a Momento de Sacramento — that is a DB constraint', () => {
    const result = draftLiturgyTreeSchema.safeParse({
      ...incompleteTree,
      acts: [
        {
          name: 'Ceia',
          moments: [
            {
              type: 'sacrament',
              description: '',
              song_id: null,
              scripture_passages: [],
              sermon_speaker: '',
              sacrament_type: null,
            },
          ],
        },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('acts.0.moments.0.sacrament_type')
    }
  })

  it('accepts a scripture passage with only the reference filled in, but the full schema rejects it', () => {
    const actsWithPartialPassage = [
      {
        name: 'Leitura',
        moments: [
          {
            type: 'bible_reading',
            description: '',
            song_id: null,
            scripture_passages: [{ reference: 'Salmo 1', text: '', version: '' }],
            sermon_speaker: '',
            sacrament_type: null,
          },
        ],
      },
    ]

    const draftResult = draftLiturgyTreeSchema.safeParse({ ...incompleteTree, acts: actsWithPartialPassage })
    expect(draftResult.success).toBe(true)

    const fullResult = liturgyTreeSchema.safeParse({ ...incompleteTree, acts: actsWithPartialPassage })
    expect(fullResult.success).toBe(false)
    if (!fullResult.success) {
      const paths = fullResult.error.issues.map((issue) => issue.path.join('.'))
      expect(paths).toContain('acts.0.moments.0.scripture_passages.0.text')
      expect(paths).toContain('acts.0.moments.0.scripture_passages.0.version')
    }
  })
})

describe('liturgyTreeSchema', () => {
  it('rejects everything the draft schema accepted: no acts, a nameless act, an empty song and a passage-less reading', () => {
    expect(liturgyTreeSchema.safeParse(incompleteTree).success).toBe(false)

    const withIncompleteAct = liturgyTreeSchema.safeParse({
      ...incompleteTree,
      acts: [
        {
          name: '',
          moments: [
            {
              type: 'song',
              description: '',
              song_id: null,
              scripture_passages: [],
              sermon_speaker: '',
              sacrament_type: null,
            },
            {
              type: 'bible_reading',
              description: '',
              song_id: null,
              scripture_passages: [],
              sermon_speaker: '',
              sacrament_type: null,
            },
          ],
        },
      ],
    })

    expect(withIncompleteAct.success).toBe(false)
    if (!withIncompleteAct.success) {
      const paths = withIncompleteAct.error.issues.map((issue) => issue.path.join('.'))
      expect(paths).toContain('acts.0.name')
      expect(paths).toContain('acts.0.moments.0.description')
      expect(paths).toContain('acts.0.moments.1.scripture_passages')
    }
  })
})
