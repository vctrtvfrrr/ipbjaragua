import { CHURCH_NAME } from '@/lib/church'
import { MEETING_MINUTE_BOOK_TITLE, meetingMinuteBookPeriodLabel } from '@/lib/meeting-minute-book'
import { loadPdfFontFaceCss } from '@/lib/pdf/fonts'
import { escapeHtml } from '@/lib/pdf/html'

export type MeetingMinuteBookCover = {
  from: string
  to: string
  firstNumber: number
  lastNumber: number
}

// The cover carries no index and no page number, and neither does the rest of the Livro: the
// Atas are bound as they were approved, and a numbering invented at export time would claim
// an order the individual documents never had.
export async function renderMeetingMinuteBookCoverHtml(cover: MeetingMinuteBookCover): Promise<string> {
  const fontFaces = await loadPdfFontFaceCss()
  const interval = `Atas ${cover.firstNumber} a ${cover.lastNumber}`

  const body = `<main>
  <h1>${escapeHtml(MEETING_MINUTE_BOOK_TITLE)}</h1>
  <p class="church">${escapeHtml(CHURCH_NAME)}</p>
  <p class="period">${escapeHtml(meetingMinuteBookPeriodLabel(cover))}</p>
  <p class="interval">${escapeHtml(interval)}</p>
</main>`

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(MEETING_MINUTE_BOOK_TITLE)}</title><style>${fontFaces}${COVER_CSS}</style></head><body>${body}</body></html>`
}

const COVER_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:20mm 18mm}
html{font-size:11pt}
body{font-family:'PT Sans',sans-serif;color:#1f2937;line-height:1.4}
main{display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;height:257mm}
h1{font-family:'PT Serif',serif;font-weight:700;font-size:2.1rem;line-height:1.2;max-width:120mm}
.church{font-size:1.15rem;margin-top:8mm}
.period{font-size:1rem;margin-top:16mm}
.interval{font-size:1rem;letter-spacing:.06em;font-weight:700;margin-top:3mm}
`
