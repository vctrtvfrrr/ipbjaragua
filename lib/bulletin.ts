import type { AgendaEntry } from '@/db/queries/bulletin-sections'

const PREPS = new Set(['de', 'da', 'do', 'dos', 'das', 'e'])

export type MemberForCouple = { full_name: string; sex: string | null }

export function formatCoupleLabel(a: MemberForCouple, b: MemberForCouple): string {
  let woman: MemberForCouple, man: MemberForCouple
  const aFemale = a.sex === 'Feminino'
  const bFemale = b.sex === 'Feminino'
  if (aFemale && !bFemale) {
    woman = a
    man = b
  } else if (bFemale && !aFemale) {
    woman = b
    man = a
  } else {
    ;[woman, man] = [a, b].sort((x, y) =>
      truncateGivenName(x.full_name).localeCompare(truncateGivenName(y.full_name), 'pt-BR')
    )
  }
  return `${truncateGivenName(woman.full_name)} <span style="color:red">♥</span> ${truncateGivenName(man.full_name)}`
}

export function truncateGivenName(name: string): string {
  const tokens = name.trim().replace(/\s+/g, ' ').split(' ')
  const result = [tokens[0]]
  if (tokens[1] && !PREPS.has(tokens[1].toLowerCase())) result.push(tokens[1])
  return result.join(' ')
}
import { formatWeekdayPtBR, weekdayOf } from '@/lib/date'

const ROMAN_VALUES = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
const ROMAN_NUMERALS = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']

export function toRoman(n: number): string {
  let result = ''
  let remaining = n
  for (let i = 0; i < ROMAN_VALUES.length; i++) {
    while (remaining >= ROMAN_VALUES[i]) {
      result += ROMAN_NUMERALS[i]
      remaining -= ROMAN_VALUES[i]
    }
  }
  return result
}

const ANCHOR = '2025-02-09'

export function bulletinYear(date: string): number {
  const [ay, am, ad] = ANCHOR.split('-').map(Number)
  const [dy, dm, dd] = date.split('-').map(Number)
  let years = dy - ay
  if (dm < am || (dm === am && dd < ad)) years--
  return years + 1
}

export function liturgySlug(date: string, theme: string, time?: string | null): string {
  const slug = theme
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const timePart = time ? `-${time.replace(':', '')}` : ''
  return `${date}${timePart}-${slug}`
}

export function formatBulletinSubtitle(edition: number, date: string): string {
  return `${edition}ª Edição — Ano ${toRoman(bulletinYear(date))}`
}

export type AgendaDay = { weekday: number; label: string; items: AgendaEntry[] }

const WEEKDAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function groupAgendaByWeekday(entries: AgendaEntry[]): AgendaDay[] {
  const byWeekday = new Map<number, AgendaEntry[]>()
  for (const entry of entries) {
    const wd = weekdayOf(entry.resolvedDate)
    const bucket = byWeekday.get(wd) ?? []
    bucket.push(entry)
    byWeekday.set(wd, bucket)
  }

  return WEEKDAY_DISPLAY_ORDER.filter((wd) => byWeekday.has(wd)).map((wd) => {
    const items = byWeekday.get(wd)!
    return { weekday: wd, label: formatWeekdayPtBR(items[0].resolvedDate), items }
  })
}
