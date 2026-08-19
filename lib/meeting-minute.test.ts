import { describe, expect, it } from 'vitest'
import {
  abbreviateMeetingMinuteTopicTitle,
  createMeetingMinuteSchema,
  hasMeaningfulMarkdown,
  meetingMinuteLabel,
  MEETING_MINUTE_TOPIC_TITLE_LIMIT,
  resolveMeetingMinuteYearNavigation,
} from './meeting-minute'

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

describe('resolveMeetingMinuteYearNavigation', () => {
  it('opens on the current year when no year is asked for', () => {
    expect(resolveMeetingMinuteYearNavigation(undefined, { earliestYear: 2019, currentYear: 2026 })).toEqual({
      year: 2026,
      previousYear: 2025,
      nextYear: null,
    })
  })

  it('walks a year that holds no Ata, as long as it is within the bounds', () => {
    expect(resolveMeetingMinuteYearNavigation('2022', { earliestYear: 2019, currentYear: 2026 })).toEqual({
      year: 2022,
      previousYear: 2021,
      nextYear: 2023,
    })
  })

  it('stops at the year of the oldest Ata', () => {
    expect(resolveMeetingMinuteYearNavigation('2019', { earliestYear: 2019, currentYear: 2026 })).toEqual({
      year: 2019,
      previousYear: null,
      nextYear: 2020,
    })
  })

  it('offers no navigation at all when the whole archive lives in the current year', () => {
    expect(resolveMeetingMinuteYearNavigation(undefined, { earliestYear: 2026, currentYear: 2026 })).toEqual({
      year: 2026,
      previousYear: null,
      nextYear: null,
    })
    expect(resolveMeetingMinuteYearNavigation(undefined, { earliestYear: null, currentYear: 2026 })).toEqual({
      year: 2026,
      previousYear: null,
      nextYear: null,
    })
  })

  it('falls back to the current year when the asked year is out of bounds or not a year', () => {
    const bounds = { earliestYear: 2019, currentYear: 2026 }

    expect(resolveMeetingMinuteYearNavigation('2027', bounds).year).toBe(2026)
    expect(resolveMeetingMinuteYearNavigation('2018', bounds).year).toBe(2026)
    expect(resolveMeetingMinuteYearNavigation('ontem', bounds).year).toBe(2026)
    expect(resolveMeetingMinuteYearNavigation('2026.5', bounds).year).toBe(2026)
    expect(resolveMeetingMinuteYearNavigation('', bounds).year).toBe(2026)
  })

  it('never offers a year ahead of today, even if an Ata was filed in the future', () => {
    expect(resolveMeetingMinuteYearNavigation('2027', { earliestYear: 2027, currentYear: 2026 })).toEqual({
      year: 2026,
      previousYear: null,
      nextYear: null,
    })
  })
})

describe('meetingMinuteLabel', () => {
  it('names the Ata by its Número and Título', () => {
    expect(meetingMinuteLabel({ number: 42, title: 'Reunião ordinária' })).toBe('Ata nº 42 — Reunião ordinária')
  })
})

describe('abbreviateMeetingMinuteTopicTitle', () => {
  const limit = MEETING_MINUTE_TOPIC_TITLE_LIMIT

  it('leaves a title within the limit untouched', () => {
    const title = 'a'.repeat(limit - 1)
    expect(abbreviateMeetingMinuteTopicTitle(title)).toBe(title)
  })

  it('leaves a title exactly at the limit untouched', () => {
    const title = 'a'.repeat(limit)
    expect(abbreviateMeetingMinuteTopicTitle(title)).toBe(title)
  })

  it('cuts at the last whole word and marks the cut', () => {
    const title = `${'palavra '.repeat(9)}excedente`
    expect(abbreviateMeetingMinuteTopicTitle(title)).toBe('palavra palavra palavra palavra palavra palavra palavra…')
  })

  it('cuts mid-word when a single word already exceeds the limit', () => {
    expect(abbreviateMeetingMinuteTopicTitle('b'.repeat(limit + 10))).toBe(`${'b'.repeat(limit)}…`)
  })
})
