const longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

// `value` is a date-only string (YYYY-MM-DD). Parsing it as UTC and formatting
// in UTC keeps the calendar day stable across server timezones.
export function formatLongDatePtBR(value: string): string {
  return longDateFormatter.format(new Date(`${value}T00:00:00Z`))
}
