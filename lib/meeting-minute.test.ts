import { describe, expect, it } from 'vitest'
import { createMeetingMinuteSchema, hasMeaningfulMarkdown, resolveMeetingMinuteYear } from './meeting-minute'

function payload(overrides: Record<string, unknown> = {}) {
  return {
    number: 1,
    title: 'IPB de Jaraguá do Sul',
    started_at: '2026-06-07T19:30',
    ended_at: '2026-06-07T21:00',
    location: 'Salão social',
    attendees: '- Pastor João\n- Presbítero Pedro',
    opening: 'A reunião foi aberta com oração.',
    closing: 'Nada mais havendo a tratar, a reunião foi encerrada.',
    topics: [{ title: 'Orçamento', discussion: 'O orçamento anual foi aprovado.' }],
    ...overrides,
  }
}

function errorPaths(input: Record<string, unknown>): string[] {
  const result = createMeetingMinuteSchema.safeParse(input)
  if (result.success) return []
  return result.error.issues.map((issue) => issue.path.join('.'))
}

describe('hasMeaningfulMarkdown', () => {
  it('accepts text, lists, tables and images', () => {
    expect(hasMeaningfulMarkdown('**Aprovado** por unanimidade')).toBe(true)
    expect(hasMeaningfulMarkdown('- Pastor João')).toBe(true)
    expect(hasMeaningfulMarkdown('| Item | Valor |\n| --- | --- |\n| Dízimos | 100 |')).toBe(true)
    expect(hasMeaningfulMarkdown('![Planta do salão](https://exemplo.org/planta.png)')).toBe(true)
  })

  it('rejects formatting that carries no content', () => {
    expect(hasMeaningfulMarkdown('   ')).toBe(false)
    expect(hasMeaningfulMarkdown('**  **')).toBe(false)
    expect(hasMeaningfulMarkdown('## ')).toBe(false)
    expect(hasMeaningfulMarkdown('-\n-\n-')).toBe(false)
    expect(hasMeaningfulMarkdown('| | |\n| --- | --- |')).toBe(false)
    expect(hasMeaningfulMarkdown('[](https://exemplo.org)')).toBe(false)
  })
})

describe('createMeetingMinuteSchema', () => {
  it('accepts a complete Ata and reads the instants in America/Sao_Paulo', () => {
    const result = createMeetingMinuteSchema.parse(payload())

    expect(result.started_at.toISOString()).toBe('2026-06-07T22:30:00.000Z')
    expect(result.ended_at.toISOString()).toBe('2026-06-08T00:00:00.000Z')
    expect(result.topics).toEqual([{ title: 'Orçamento', discussion: 'O orçamento anual foi aprovado.' }])
  })

  it('requires every field of the model', () => {
    expect(
      errorPaths({
        number: '',
        title: ' ',
        started_at: '',
        ended_at: '',
        location: '',
        attendees: '',
        opening: '',
        closing: '',
        topics: [],
      })
    ).toEqual(['number', 'title', 'started_at', 'ended_at', 'location', 'attendees', 'opening', 'closing', 'topics'])
  })

  it('rejects Markdown fields that hold only formatting', () => {
    expect(errorPaths(payload({ attendees: '- \n- ', opening: '## ', closing: '**  **' }))).toEqual([
      'attendees',
      'opening',
      'closing',
    ])
  })

  it('requires a title and a Discussão on every Tópico', () => {
    expect(errorPaths(payload({ topics: [{ title: ' ', discussion: '###' }] }))).toEqual([
      'topics.0.title',
      'topics.0.discussion',
    ])
  })

  it('requires the Término to be later than the Início', () => {
    expect(errorPaths(payload({ ended_at: '2026-06-07T19:30' }))).toEqual(['ended_at'])
    expect(errorPaths(payload({ ended_at: '2026-06-07T18:00' }))).toEqual(['ended_at'])
  })

  it('rejects a civil time that never existed', () => {
    expect(errorPaths(payload({ started_at: '2026-02-30T12:00' }))).toEqual(['started_at'])
    expect(errorPaths(payload({ started_at: '2018-11-04T00:30', ended_at: '2018-11-04T02:00' }))).toEqual([
      'started_at',
    ])
  })

  it('accepts a meeting that crosses midnight', () => {
    const result = createMeetingMinuteSchema.parse(
      payload({ started_at: '2026-06-07T22:00', ended_at: '2026-06-08T00:30' })
    )

    expect(result.ended_at.getTime() - result.started_at.getTime()).toBe(150 * 60 * 1000)
  })
})

describe('resolveMeetingMinuteYear', () => {
  it('falls back to the current year when no year is asked for', () => {
    expect(resolveMeetingMinuteYear(undefined, 2026)).toBe(2026)
  })

  it('shows the year a historical Ata was filed under', () => {
    expect(resolveMeetingMinuteYear('2019', 2026)).toBe(2019)
  })

  it('ignores a year that is future or not a year at all', () => {
    expect(resolveMeetingMinuteYear('2027', 2026)).toBe(2026)
    expect(resolveMeetingMinuteYear('ontem', 2026)).toBe(2026)
    expect(resolveMeetingMinuteYear('2026.5', 2026)).toBe(2026)
  })
})
