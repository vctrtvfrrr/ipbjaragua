import { describe, expect, it } from 'vitest'
import {
  meetingMinutePdfFilename,
  PENDING_WATERMARK,
  renderMeetingMinuteDocumentHtml,
  type MeetingMinuteDocument,
} from './meeting-minute-document'

const MINUTE: MeetingMinuteDocument = {
  number: 12,
  title: 'IPB de Jaraguá do Sul',
  started_at: new Date('2026-06-07T22:30:00Z'),
  ended_at: new Date('2026-06-08T00:00:00Z'),
  location: 'Salão social',
  attendees: '- Pastor João\n- Presbítero Pedro',
  opening: 'A reunião foi aberta com oração.',
  closing: 'Nada mais havendo a tratar, a reunião foi encerrada.',
  topics: [
    { title: 'Orçamento', discussion: 'O orçamento anual foi **aprovado**.' },
    { title: 'Reforma', discussion: 'A reforma do telhado foi adiada.' },
  ],
}

describe('renderMeetingMinuteDocumentHtml', () => {
  it('presents each Tópico as a subtitle instead of a list item', async () => {
    const html = await renderMeetingMinuteDocumentHtml(MINUTE)

    expect(html).toContain('<h3>Orçamento</h3>')
    expect(html).toContain('<h3>Reforma</h3>')
    expect(html).not.toMatch(/<li>[^<]*Orçamento/)
  })

  it('marks every page of a Pending Ata and leaves an Approved one unmarked', async () => {
    const pending = await renderMeetingMinuteDocumentHtml(MINUTE, { watermark: PENDING_WATERMARK })

    expect(pending).toContain(PENDING_WATERMARK)
    expect(pending).toMatch(/class="watermark"/)
    expect(pending).toMatch(/\.watermark\{position:fixed/)

    expect(await renderMeetingMinuteDocumentHtml(MINUTE)).not.toContain(PENDING_WATERMARK)
  })

  it('leaves out everything the model does not carry', async () => {
    const html = await renderMeetingMinuteDocumentHtml(MINUTE, { watermark: PENDING_WATERMARK })

    expect(html).not.toContain('<footer')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('Assinatura')
    expect(html).not.toMatch(/counter\(page\)/)
  })

  it('names the download after the Número', () => {
    expect(meetingMinutePdfFilename(MINUTE)).toBe('ata-12.pdf')
  })
})
