import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MEETING_MINUTE_TOPIC_TITLE_LIMIT } from '@/lib/meeting-minute'
import { MeetingMinuteTopicList } from './MeetingMinuteTopicList'

describe('MeetingMinuteTopicList', () => {
  it('numbers the Tópicos in the order they were deliberated', () => {
    render(<MeetingMinuteTopicList topics={[{ title: 'Orçamento' }, { title: 'Reforma' }]} />)

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Orçamento', 'Reforma'])
  })

  it('marks the absence of Tópicos explicitly', () => {
    render(<MeetingMinuteTopicList topics={[]} />)

    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows a long title abbreviated but keeps it whole for assistive technology', () => {
    const title = `${'palavra '.repeat(9)}excedente`
    render(<MeetingMinuteTopicList topics={[{ title }]} />)

    const item = screen.getByRole('listitem')
    expect(item).toHaveAttribute('title', title)
    expect(item.textContent).toContain('…')
    expect(screen.getByText(title)).toHaveClass('sr-only')
  })

  it('leaves a title within the limit as a single plain copy', () => {
    const title = 'a'.repeat(MEETING_MINUTE_TOPIC_TITLE_LIMIT)
    render(<MeetingMinuteTopicList topics={[{ title }]} />)

    expect(screen.getByRole('listitem')).not.toHaveAttribute('title')
    expect(screen.getAllByText(title)).toHaveLength(1)
  })
})
