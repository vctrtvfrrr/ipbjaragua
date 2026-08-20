import { formatChurchDatePtBR, formatChurchTimePtBR } from '@/lib/date'
import { MEETING_MINUTE_STATUS_LABELS, meetingMinuteLabel } from '@/lib/meeting-minute'
import { loadPdfFontFaceCss } from '@/lib/pdf/fonts'
import { renderMarkdownToHtml } from '@/lib/pdf/markdown'
import { createImageBudget } from '@/lib/pdf/remote-image'

// The mark says what the Status says: the glossary owns that wording, and a document that
// invented its own would drift from the panel the reader just came from.
export const PENDING_WATERMARK = MEETING_MINUTE_STATUS_LABELS.pending.toLocaleUpperCase('pt-BR')

export type MeetingMinuteDocument = {
  number: number
  title: string
  started_at: Date
  ended_at: Date
  location: string
  attendees: string
  opening: string
  closing: string
  topics: { title: string; discussion: string }[]
}

export function meetingMinutePdfFilename(minute: { number: number }): string {
  return `ata-${minute.number}.pdf`
}

// Only a Pending Ata is rendered on demand, so the mark is not an option: an unmarked
// document belongs to the Approved cache, which is not built here.
export async function renderMeetingMinuteDocumentHtml(minute: MeetingMinuteDocument): Promise<string> {
  const budget = createImageBudget()
  const fontFaces = await loadPdfFontFaceCss()
  const attendees = await renderMarkdownToHtml(minute.attendees, budget)
  const opening = await renderMarkdownToHtml(minute.opening, budget)
  const closing = await renderMarkdownToHtml(minute.closing, budget)
  const topics = []

  for (const topic of minute.topics) {
    topics.push({ title: topic.title, discussion: await renderMarkdownToHtml(topic.discussion, budget) })
  }

  const documentTitle = meetingMinuteLabel(minute)

  const body = `
<div class="watermark" aria-hidden="true">${escapeHtml(PENDING_WATERMARK)}</div>
<main>
  <header>
    <h1>${escapeHtml(documentTitle)}</h1>
  </header>
  <dl class="facts">
    <div><dt>Data</dt><dd>${formatChurchDatePtBR(minute.started_at)}</dd></div>
    <div><dt>Horário</dt><dd>${formatChurchTimePtBR(minute.started_at)} às ${formatChurchTimePtBR(minute.ended_at)}</dd></div>
    <div><dt>Local</dt><dd>${escapeHtml(minute.location)}</dd></div>
  </dl>
  ${section('Participantes', attendees)}
  ${section('Abertura', opening)}
  <section>
    <h2>Tópicos Discutidos</h2>
    ${topics
      .map(
        (topic) =>
          `<article class="topic"><h3>${escapeHtml(topic.title)}</h3><div class="prose">${topic.discussion}</div></article>`
      )
      .join('')}
  </section>
  ${section('Encerramento', closing)}
</main>`

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(documentTitle)}</title><style>${fontFaces}${DOCUMENT_CSS}</style></head><body>${body}</body></html>`
}

function section(title: string, html: string): string {
  return `<section><h2>${escapeHtml(title)}</h2><div class="prose">${html}</div></section>`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ESCAPES[character])
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

// The measure, not the viewport, sets the scale: this stylesheet only ever describes paper.
const DOCUMENT_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:20mm 18mm}
html{font-size:11pt}
body{font-family:'PT Sans',sans-serif;color:#1f2937;line-height:1.55;orphans:2;widows:2}
main{position:relative;z-index:1}

/* Chromium repeats a fixed element on every printed page, which is exactly the promise the
   mark has to keep: no sheet of a Pending Ata may read as a consolidated one. */
.watermark{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
  transform:rotate(-45deg);font-family:'PT Sans',sans-serif;font-weight:700;font-size:46pt;
  letter-spacing:.08em;color:rgba(179,38,30,.13);white-space:nowrap;z-index:0}

header{text-align:center;border-bottom:1.5pt solid #1f2937;padding-bottom:6mm;margin-bottom:6mm}
h1{font-family:'PT Serif',serif;font-weight:700;font-size:1.5rem;line-height:1.25}

.facts{display:grid;grid-template-columns:auto 1fr;gap:1mm 6mm;margin-bottom:7mm}
.facts>div{display:contents}
.facts dt{font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.8rem;padding-top:.15rem}
.facts dd{font-size:1rem}

section{margin-bottom:6mm}
h2{font-family:'PT Serif',serif;font-weight:700;font-size:1.1rem;letter-spacing:.02em;
  border-bottom:.5pt solid #9aa4ae;padding-bottom:1.5mm;margin-bottom:3mm;break-after:avoid}
h3{font-family:'PT Serif',serif;font-weight:700;font-size:1rem;margin-bottom:1.5mm;break-after:avoid}
.topic{margin-bottom:4mm;break-inside:avoid-page}

.prose>*+*{margin-top:2.5mm}
.prose ul,.prose ol{padding-left:6mm}
.prose li+li{margin-top:1mm}
.prose a{color:inherit;text-decoration:none}
.prose blockquote{border-left:2pt solid #9aa4ae;padding-left:4mm;font-style:italic}
.prose code{font-family:monospace;font-size:.9em}
.prose pre{white-space:pre-wrap;background:#f3f4f6;padding:2mm}
.prose img{max-width:100%;height:auto}
.prose table{width:100%;border-collapse:collapse}
.prose th,.prose td{border:.5pt solid #9aa4ae;padding:1.5mm 2mm;text-align:left;vertical-align:top}
.prose th{font-weight:700;background:#f3f4f6}
.prose hr{border:0;border-top:.5pt solid #9aa4ae}
`
