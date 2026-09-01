// The closed set of Livros an Ata can belong to. Adding one is a code change plus a migration —
// there is no CRUD for this list, and the order here is the order the submenu presents them in.
export const MEETING_MINUTE_BOOK_SLUGS = ['mesa-administrativa', 'assembleia-geral', 'secretaria-de-musica'] as const

export type MeetingMinuteBookSlug = (typeof MEETING_MINUTE_BOOK_SLUGS)[number]

export type MeetingMinuteBookDefinition = {
  slug: MeetingMinuteBookSlug
  label: string
  // The genitive is stored whole, not derived from the label, so a Livro whose name does not
  // flex as "da <label>" (a masculine or plural one, like "do Conselho") still reads correctly.
  genitive: string
}

export const MEETING_MINUTE_BOOKS: readonly MeetingMinuteBookDefinition[] = [
  { slug: 'mesa-administrativa', label: 'Mesa Administrativa', genitive: 'da Mesa Administrativa' },
  { slug: 'assembleia-geral', label: 'Assembleia Geral', genitive: 'da Assembleia Geral' },
  { slug: 'secretaria-de-musica', label: 'Secretaria de Música', genitive: 'da Secretaria de Música' },
]

export function meetingMinuteBookBySlug(slug: string): MeetingMinuteBookDefinition | undefined {
  return MEETING_MINUTE_BOOKS.find((book) => book.slug === slug)
}

export function isMeetingMinuteBookSlug(slug: string): slug is MeetingMinuteBookSlug {
  return MEETING_MINUTE_BOOK_SLUGS.includes(slug as MeetingMinuteBookSlug)
}
