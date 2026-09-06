import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveScripturePassageAction } from '@/app/(admin)/admin/liturgies/form-actions'
import { liturgyTreeSchema } from '@/lib/liturgy'
import { LiturgyForm } from './LiturgyForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/(admin)/admin/liturgies/form-actions', () => ({
  createLiturgyFormAction: vi.fn(),
  updateLiturgyFormAction: vi.fn(),
  unpublishLiturgyFormAction: vi.fn(),
  generateLiturgyDescriptionAction: vi.fn(),
  resolveScripturePassageAction: vi.fn(),
}))

function renderWithPassage() {
  render(
    <LiturgyForm
      mode="create"
      songs={[]}
      defaults={{
        date: '2026-09-06',
        theme: 'Culto Solene',
        time: '09:00',
        description: 'Descrição',
        acts: [
          {
            name: 'Adoração',
            moments: [
              {
                type: 'bible_reading',
                description: '',
                song_id: null,
                sermon_speaker: '',
                sacrament_type: null,
                scripture_passages: [{ reference: 'João 3:16', version: 'ARA', text: 'Porque Deus amou o mundo' }],
              },
            ],
          },
        ],
      }}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /Momento 1/ }))
}

function submittedPassage() {
  const payload = JSON.parse(document.querySelector<HTMLInputElement>('input[name="payload"]')!.value)
  return payload.acts[0].moments[0].scripture_passages[0]
}

function isPublishable() {
  return liturgyTreeSchema.safeParse(
    JSON.parse(document.querySelector<HTMLInputElement>('input[name="payload"]')!.value)
  ).success
}

describe('LiturgyForm passages', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('never lets the previous text be published under a Referência Bíblica that just changed', () => {
    renderWithPassage()
    expect(isPublishable()).toBe(true)

    fireEvent.change(screen.getByPlaceholderText('Referência'), { target: { value: 'Salmo 23' } })

    expect(submittedPassage().text).toBe('')
    expect(isPublishable()).toBe(false)
  })

  it('keeps a correction the operator wrote while the source was answering', async () => {
    let answer!: (value: { reference: string; text: string; verses: number; missing: number }) => void
    vi.mocked(resolveScripturePassageAction).mockReturnValue(new Promise((resolve) => (answer = resolve)))
    renderWithPassage()

    fireEvent.change(screen.getByPlaceholderText('Referência'), { target: { value: 'Salmo 23' } })
    await act(async () => void (await vi.advanceTimersByTimeAsync(1000)))
    fireEvent.change(screen.getByPlaceholderText('Texto'), { target: { value: 'O SENHOR é o meu pastor' } })

    await act(async () => answer({ reference: 'Salmo 23', text: 'Texto da fonte', verses: 6, missing: 0 }))

    expect(submittedPassage().text).toBe('O SENHOR é o meu pastor')
  })

  it('fills the text and says how many verses the Referência Bíblica resolved', async () => {
    vi.mocked(resolveScripturePassageAction).mockResolvedValue({
      reference: 'Salmo 23',
      text: 'O SENHOR é o meu pastor',
      verses: 6,
      missing: 0,
    })
    renderWithPassage()

    fireEvent.change(screen.getByPlaceholderText('Referência'), { target: { value: 'sl 23' } })
    await act(async () => void (await vi.advanceTimersByTimeAsync(1000)))

    expect(submittedPassage().text).toBe('O SENHOR é o meu pastor')
    expect(screen.getByText(/Salmo 23 · 6 versículos/)).toBeInTheDocument()
  })
})
