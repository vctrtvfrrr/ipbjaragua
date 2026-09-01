import { forbidden, notFound } from 'next/navigation'
import type { MeetingMinuteWithTopics } from '@/db/queries/meeting-minutes'
import type { MeetingMinuteBookDefinition } from '@/lib/meeting-minute-books'

// An Ata of another Livro answers exactly like one that does not exist: the URL carries only
// the global id, and confirming "yes, but not yours" would leak its existence across Livros.
// An Ata Aprovada of the Usuário's own Livro is a different case — it exists and is visible in
// the listing, so refusing to edit it is a plain Permissão denial, not a masked existence.
export function requireMeetingMinuteEdit(
  book: MeetingMinuteBookDefinition,
  minute: MeetingMinuteWithTopics | null
): MeetingMinuteWithTopics {
  if (!minute || minute.book !== book.slug) notFound()
  if (minute.status !== 'pending') forbidden()

  return minute
}
