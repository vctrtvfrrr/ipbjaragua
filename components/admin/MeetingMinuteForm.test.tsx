import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { MeetingMinuteWithTopics } from '@/db/queries/meeting-minutes'
import { MeetingMinuteForm } from './MeetingMinuteForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/(admin)/admin/meeting-minutes/form-actions', () => ({
  createMeetingMinuteFormAction: vi.fn(),
  updateMeetingMinuteFormAction: vi.fn(),
}))

function fakeMinute(): MeetingMinuteWithTopics {
  return {
    id: 1,
    number: 7,
    title: 'IPB de Jaraguá do Sul',
    started_at: new Date('2026-06-07T22:30:00.000Z'),
    ended_at: new Date('2026-06-08T00:00:00.000Z'),
    location: 'Salão social',
    attendees: '- Pastor João',
    opening: 'A reunião foi aberta com oração.',
    closing: 'A reunião foi encerrada.',
    status: 'pending',
    created_at: '',
    updated_at: '',
    topics: [
      {
        id: 11,
        meeting_minute_id: 1,
        position: 0,
        title: 'Orçamento',
        discussion: 'Aprovado.',
        created_at: '',
        updated_at: '',
      },
      {
        id: 12,
        meeting_minute_id: 1,
        position: 1,
        title: 'Reforma',
        discussion: 'Adiada.',
        created_at: '',
        updated_at: '',
      },
      {
        id: 13,
        meeting_minute_id: 1,
        position: 2,
        title: 'Missões',
        discussion: 'Em estudo.',
        created_at: '',
        updated_at: '',
      },
    ],
  } as unknown as MeetingMinuteWithTopics
}

function payloadTopics(): string[] {
  const input = document.querySelector<HTMLInputElement>('input[name="payload"]')
  if (!input) throw new Error('payload input not found')
  return (JSON.parse(input.value) as { topics: Array<{ title: string }> }).topics.map((topic) => topic.title)
}

describe('MeetingMinuteForm in edit mode', () => {
  it('loads the Tópicos in their persisted order', () => {
    render(<MeetingMinuteForm mode="edit" minute={fakeMinute()} />)

    expect(payloadTopics()).toEqual(['Orçamento', 'Reforma', 'Missões'])
  })

  it('reorders Tópicos with the move buttons', () => {
    render(<MeetingMinuteForm mode="edit" minute={fakeMinute()} />)

    const firstTopic = screen.getByText('Orçamento').closest('fieldset')
    if (!firstTopic) throw new Error('fieldset not found')
    fireEvent.click(within(firstTopic).getByRole('button', { name: 'Mover para baixo' }))

    expect(payloadTopics()).toEqual(['Reforma', 'Orçamento', 'Missões'])
  })

  it('adds and removes Tópicos', () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    )
    render(<MeetingMinuteForm mode="edit" minute={fakeMinute()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Tópico' }))
    expect(payloadTopics()).toEqual(['Orçamento', 'Reforma', 'Missões', ''])

    const reforma = screen.getByText('Reforma').closest('fieldset')
    if (!reforma) throw new Error('fieldset not found')
    fireEvent.click(within(reforma).getByRole('button', { name: 'Remover tópico' }))
    expect(payloadTopics()).toEqual(['Orçamento', 'Missões', ''])

    vi.unstubAllGlobals()
  })
})
