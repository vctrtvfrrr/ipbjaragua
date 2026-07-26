type Passage = { reference: string; text: string; version: string }
type Moment = {
  type: string
  description?: string | null
  scripture_passages?: Passage[] | null
  sermon_speaker?: string | null
  song_id?: number | null
  song_title?: string | null
  sacrament_type?: string | null
}
type Act = { name: string; moments: Moment[] }

export function articleDescriptionInput(title: string, content: string): string {
  return `Título: ${title}\n\nCorpo:\n${content}`
}

export function liturgyDescriptionInput(acts: Act[]): string {
  const sermon = acts.flatMap((act) => act.moments).find((moment) => moment.type === 'sermon')
  const theme = sermon?.description?.trim()
  const passages = sermon?.scripture_passages ?? []
  if (theme || passages.length) {
    return [
      theme ? `Tema do sermão: ${theme}` : null,
      passages.length ? `Leituras do sermão:\n${passages.map(formatPassage).join('\n')}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  }

  const act = acts[0]
  if (!act) return ''
  return [`Ato: ${act.name}`, ...act.moments.map(formatMoment)].join('\n')
}

function formatPassage(passage: Passage): string {
  return `${passage.reference} (${passage.version}): ${passage.text}`
}

function formatMoment(moment: Moment, index: number): string {
  return [
    `Momento ${index + 1} (${moment.type})`,
    moment.description?.trim() ? `Descrição: ${moment.description.trim()}` : null,
    moment.scripture_passages?.length ? `Leituras:\n${moment.scripture_passages.map(formatPassage).join('\n')}` : null,
    moment.sermon_speaker?.trim() ? `Pregador: ${moment.sermon_speaker.trim()}` : null,
    moment.song_title?.trim() ? `Cântico: ${moment.song_title.trim()}` : null,
    moment.sacrament_type ? `Sacramento: ${moment.sacrament_type}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}
