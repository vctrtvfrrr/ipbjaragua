import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { MeetingMinutePdfButton } from './MeetingMinutePdfButton'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const MINUTE = { id: 7, number: 12 }

function pdfResponse(): Response {
  return new Response(new Blob(['%PDF-']), { status: 200 })
}

function stateResponse(state: string): Response {
  return Response.json({ state })
}

beforeEach(() => {
  vi.mocked(toast.error).mockClear()
  URL.createObjectURL = vi.fn(() => 'blob:pdf')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MeetingMinutePdfButton', () => {
  it('names the file after the Número when the document arrives', async () => {
    const click = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click)
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => Promise.resolve(url.endsWith('/state') ? stateResponse('generating') : pdfResponse()))
    )

    render(<MeetingMinutePdfButton minute={MINUTE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF' }))

    await waitFor(() => expect(click).toHaveBeenCalled())
    expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe('ata-12.pdf')
  })

  it('offers the document without generating it first', () => {
    render(<MeetingMinutePdfButton minute={MINUTE} />)

    expect(screen.getByRole('button', { name: 'Baixar PDF' })).toBeEnabled()
  })

  it('locks the control while the server has the document in hand', async () => {
    let deliver: (response: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        url.endsWith('/state')
          ? Promise.resolve(stateResponse('waiting'))
          : new Promise<Response>((resolve) => {
              deliver = resolve
            })
      )
    )

    render(<MeetingMinutePdfButton minute={MINUTE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF' }))

    const button = screen.getByRole('button', { name: 'Aguardando…' })
    expect(button).toBeDisabled()

    deliver(pdfResponse())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Baixar PDF' })).toBeEnabled())
  })

  it('announces the generation once the queue reaches this Ata', async () => {
    let deliver: (response: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        url.endsWith('/state')
          ? Promise.resolve(stateResponse('generating'))
          : new Promise<Response>((resolve) => {
              deliver = resolve
            })
      )
    )

    render(<MeetingMinutePdfButton minute={MINUTE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Gerando…' })).toBeDisabled(), { timeout: 3000 })

    deliver(pdfResponse())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Baixar PDF' })).toBeEnabled())
  })

  it('shows why a generation failed instead of a broken document', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          url.endsWith('/state')
            ? stateResponse('generating')
            : Response.json({ message: 'Não foi possível carregar a imagem.' }, { status: 502 })
        )
      )
    )

    render(<MeetingMinutePdfButton minute={MINUTE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível carregar a imagem.'))
    expect(screen.getByRole('button', { name: 'Baixar PDF' })).toBeEnabled()
  })
})
