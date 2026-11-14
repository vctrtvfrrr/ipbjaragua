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

const SONGS = [
  { id: 1, title: 'Castelo Forte', songReference: '155. Novo Cântico' },
  { id: 2, title: 'Santo, Santo, Santo', songReference: null },
]

function songMoment(song_id: number | null) {
  return {
    type: 'song' as const,
    description: '',
    song_id,
    sermon_speaker: '',
    sacrament_type: null,
    scripture_passages: [],
  }
}

function renderWithSongMoment(song_id: number | null) {
  render(
    <LiturgyForm
      mode="create"
      songs={SONGS}
      defaults={{
        date: '2026-09-06',
        theme: 'Culto Solene',
        time: '09:00',
        description: 'Descrição',
        acts: [{ name: 'Adoração', moments: [songMoment(song_id)] }],
      }}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /Momento 1/ }))
}

function submittedSongId() {
  const payload = JSON.parse(document.querySelector<HTMLInputElement>('input[name="payload"]')!.value)
  return payload.acts[0].moments[0].song_id
}

describe('LiturgyForm Cântico', () => {
  it('replaces the search with a card naming the chosen Cântico and its hymnal track', () => {
    renderWithSongMoment(null)

    fireEvent.change(screen.getByRole('combobox', { name: 'Cântico' }), { target: { value: 'castelo' } })
    fireEvent.click(screen.getByRole('option', { name: /Castelo Forte/ }))

    expect(screen.queryByRole('combobox', { name: 'Cântico' })).not.toBeInTheDocument()
    const card = screen.getByRole('group', { name: 'Cântico selecionado' })
    expect(card).toHaveTextContent('Castelo Forte')
    expect(card).toHaveTextContent('155. Novo Cântico')
    expect(submittedSongId()).toBe(1)
  })

  it('goes back to the search on Trocar and keeps the saved Cântico until another is chosen', () => {
    renderWithSongMoment(1)

    fireEvent.click(screen.getByRole('button', { name: /Trocar/ }))

    const search = screen.getByRole('combobox', { name: 'Cântico' })
    expect(search).toHaveFocus()
    fireEvent.change(search, { target: { value: 'santo' } })
    expect(submittedSongId()).toBe(1)

    fireEvent.click(screen.getByRole('option', { name: /Santo, Santo, Santo/ }))
    expect(screen.getByRole('group', { name: 'Cântico selecionado' })).toHaveTextContent('Santo, Santo, Santo')
    expect(submittedSongId()).toBe(2)
  })

  it('returns to the card of the saved Cântico when the swap is cancelled', () => {
    renderWithSongMoment(1)

    fireEvent.click(screen.getByRole('button', { name: /Trocar/ }))
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Cântico' }), { key: 'Escape' })

    expect(screen.getByRole('group', { name: 'Cântico selecionado' })).toHaveTextContent('Castelo Forte')
    expect(screen.getByRole('button', { name: /Trocar/ })).toHaveFocus()
  })

  it('opens an edited Liturgia with the card of the saved Cântico', () => {
    render(
      <LiturgyForm
        mode="edit"
        songs={SONGS}
        liturgy={{
          id: 7,
          date: new Date('2026-09-06T00:00:00'),
          theme: 'Culto Solene',
          time: '09:00',
          description: 'Descrição',
          status: 'draft',
          acts: [{ id: 3, name: 'Adoração', moments: [{ id: 5, ...songMoment(2) }] }],
        }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Momento 1/ }))

    expect(screen.getByRole('group', { name: 'Cântico selecionado' })).toHaveTextContent('Santo, Santo, Santo')
    expect(screen.queryByRole('combobox', { name: 'Cântico' })).not.toBeInTheDocument()
  })

  it('shows the search for a Momento without a Cântico and still blocks publishing', () => {
    renderWithSongMoment(null)

    expect(screen.getByRole('combobox', { name: 'Cântico' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Cântico selecionado' })).not.toBeInTheDocument()
    expect(isPublishable()).toBe(false)
  })

  it('chooses a Cântico with the keyboard alone', () => {
    renderWithSongMoment(null)
    const search = screen.getByRole('combobox', { name: 'Cântico' })

    fireEvent.change(search, { target: { value: 'o' } })
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    expect(search).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: /Santo/ }).id)
    fireEvent.keyDown(search, { key: 'Enter' })

    expect(screen.getByRole('group', { name: 'Cântico selecionado' })).toHaveTextContent('Santo, Santo, Santo')
    expect(screen.getByRole('button', { name: /Trocar/ })).toHaveFocus()
  })

  it('removes the Cântico from the card and goes back to an empty search', () => {
    renderWithSongMoment(1)

    fireEvent.click(screen.getByRole('button', { name: /Remover cântico/ }))

    expect(screen.getByRole('combobox', { name: 'Cântico' })).toHaveFocus()
    expect(submittedSongId()).toBeNull()
  })

  it('shows a card for a saved Cântico that was deleted, instead of a search that hides it', () => {
    renderWithSongMoment(99)

    expect(screen.getByRole('group', { name: 'Cântico selecionado' })).toHaveTextContent('Cântico excluído')
    expect(submittedSongId()).toBe(99)
  })

  it('clears the typed search on the first Escape and only then returns to the card', () => {
    renderWithSongMoment(1)
    fireEvent.click(screen.getByRole('button', { name: /Trocar/ }))
    const search = screen.getByRole('combobox', { name: 'Cântico' })

    fireEvent.change(search, { target: { value: 'santo' } })
    fireEvent.keyDown(search, { key: 'Escape' })
    expect(search).toHaveValue('')

    fireEvent.keyDown(search, { key: 'Escape' })
    expect(screen.getByRole('group', { name: 'Cântico selecionado' })).toHaveTextContent('Castelo Forte')
  })
})
