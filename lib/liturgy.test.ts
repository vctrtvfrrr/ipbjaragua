import { describe, expect, it } from 'vitest'
import { buildLiturgyActErrorSummary, buildLiturgyDuplicationDefaults } from './liturgy'

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
