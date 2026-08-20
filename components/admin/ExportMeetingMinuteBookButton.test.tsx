import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingMinuteBookSummaryFormAction } from '@/app/(admin)/admin/meeting-minutes/form-actions'
import type { MeetingMinuteBookInput } from '@/lib/meeting-minute-book'
import { ExportMeetingMinuteBookButton } from './ExportMeetingMinuteBookButton'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/app/(admin)/admin/meeting-minutes/form-actions', () => ({
  meetingMinuteBookSummaryFormAction: vi.fn(),
}))

const summary = vi.mocked(meetingMinuteBookSummaryFormAction)

function found(count: number, firstNumber: number | null = 7, lastNumber: number | null = 9) {
  summary.mockImplementation(async (input) => ({
    status: 'ok',
    summary: { ...(input as { from: string; to: string; order: 'chronological' }), count, firstNumber, lastNumber },
  }))
}

async function openDialog() {
  render(<ExportMeetingMinuteBookButton year={2026} />)
  fireEvent.click(screen.getByRole('button', { name: 'Exportar Livro de Atas' }))

  return waitFor(() => screen.getByRole('dialog'))
}

beforeEach(() => {
  summary.mockReset()
  found(2)
})

describe('ExportMeetingMinuteBookButton', () => {
  it('does not export before the confirmation is shown', () => {
    render(<ExportMeetingMinuteBookButton year={2026} />)

    expect(screen.queryByRole('button', { name: 'Exportar Livro' })).not.toBeInTheDocument()
  })

  it('opens on the displayed year in chronological order', async () => {
    await openDialog()

    expect(screen.getByLabelText('Início do período')).toHaveValue('2026-01-01')
    expect(screen.getByLabelText('Fim do período')).toHaveValue('2026-12-31')
    expect(screen.getByLabelText('Cronológica')).toBeChecked()
    expect(screen.getByLabelText('Cronológica inversa')).not.toBeChecked()
  })

  it('shows what the confirmation would bind', async () => {
    found(2, 7, 9)

    const dialog = await openDialog()

    await waitFor(() => expect(dialog).toHaveTextContent('2'))
    expect(dialog).toHaveTextContent('01 de janeiro de 2026 a 31 de dezembro de 2026')
    expect(dialog).toHaveTextContent('Cronológica')
    expect(dialog).toHaveTextContent('7 a 9')
    expect(screen.getByRole('button', { name: 'Exportar Livro' })).toBeEnabled()
  })

  it('refuses to export a period that holds no Ata Aprovada', async () => {
    found(0, null, null)

    const dialog = await openDialog()

    await waitFor(() => expect(dialog).toHaveTextContent('Nenhuma Ata Aprovada no período selecionado.'))
    expect(screen.getByRole('button', { name: 'Exportar Livro' })).toBeDisabled()
  })

  it('closes the confirmation until the new period has an answer', async () => {
    let answer = () => {}
    summary.mockImplementationOnce(async (input) => ({
      status: 'ok',
      summary: { ...(input as MeetingMinuteBookInput), count: 2, firstNumber: 7, lastNumber: 9 },
    }))
    summary.mockImplementationOnce(async (input) => {
      await new Promise<void>((resolve) => {
        answer = resolve
      })
      return {
        status: 'ok',
        summary: { ...(input as MeetingMinuteBookInput), count: 40, firstNumber: 1, lastNumber: 40 },
      }
    })

    const dialog = await openDialog()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar Livro' })).toBeEnabled())

    fireEvent.change(screen.getByLabelText('Início do período'), { target: { value: '2020-01-01' } })

    // The old count described the old period, so nothing may be confirmed against it.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar Livro' })).toBeDisabled())
    expect(dialog).not.toHaveTextContent('7 a 9')

    await waitFor(() => expect(summary).toHaveBeenCalledTimes(2))
    answer()
    await waitFor(() => expect(dialog).toHaveTextContent('1 a 40'))
    expect(screen.getByRole('button', { name: 'Exportar Livro' })).toBeEnabled()
  })

  it('asks again whenever the period or the order changes', async () => {
    await openDialog()
    await waitFor(() => expect(summary).toHaveBeenCalledTimes(1))

    fireEvent.change(screen.getByLabelText('Fim do período'), { target: { value: '2026-06-30' } })
    fireEvent.click(screen.getByLabelText('Cronológica inversa'))

    await waitFor(() =>
      expect(summary).toHaveBeenLastCalledWith({
        from: '2026-01-01',
        to: '2026-06-30',
        order: 'reverse',
      })
    )
  })

  it('downloads the chosen period and blocks a second request while it runs', async () => {
    const pdf = { blob: async () => new Blob(['%PDF-']), ok: true, headers: new Headers() }
    let release = () => {}
    const fetching = new Promise<typeof pdf>((resolve) => {
      release = () => resolve(pdf)
    })
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => (String(url).endsWith('/state') ? Promise.reject(new Error('no state')) : fetching))
    )
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:pdf', revokeObjectURL: () => {} })
    vi.stubGlobal('crypto', { randomUUID: () => '0e1d2c3b-4a59-4867-8f90-a1b2c3d4e5f6' })

    await openDialog()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar Livro' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Exportar Livro' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Aguardando…' })).toBeDisabled())
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\/admin\/meeting-minutes\/book\?from=2026-01-01&to=2026-12-31&order=chronological&token=[0-9a-f-]{36}$/
      )
    )

    release()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
