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

// Anchor: edition 1 was published on 2025-02-09.
// Year = complete years since anchor + 1 (starts at I).
const ANCHOR = '2025-02-09'

export function bulletinYear(date: string): number {
  const [ay, am, ad] = ANCHOR.split('-').map(Number)
  const [dy, dm, dd] = date.split('-').map(Number)
  let years = dy - ay
  if (dm < am || (dm === am && dd < ad)) years--
  return years + 1
}

export function formatBulletinSubtitle(edition: number, date: string): string {
  return `${edition}ª Edição — Ano ${toRoman(bulletinYear(date))}`
}
