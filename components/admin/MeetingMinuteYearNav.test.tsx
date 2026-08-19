import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MeetingMinuteYearNav } from './MeetingMinuteYearNav'

describe('MeetingMinuteYearNav', () => {
  it('links to the neighbouring years', () => {
    render(<MeetingMinuteYearNav previousYear={2021} nextYear={2023} />)

    expect(screen.getByRole('link', { name: 'Anterior' })).toHaveAttribute('href', '/admin/meeting-minutes?year=2021')
    expect(screen.getByRole('link', { name: 'Próximo' })).toHaveAttribute('href', '/admin/meeting-minutes?year=2023')
  })

  it('omits the direction that has no year left', () => {
    const { rerender } = render(<MeetingMinuteYearNav previousYear={null} nextYear={2020} />)

    expect(screen.queryByRole('link', { name: 'Anterior' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Próximo' })).toBeInTheDocument()

    rerender(<MeetingMinuteYearNav previousYear={2025} nextYear={null} />)

    expect(screen.getByRole('link', { name: 'Anterior' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Próximo' })).toBeNull()
  })

  it('renders nothing when there is a single year to show', () => {
    render(<MeetingMinuteYearNav previousYear={null} nextYear={null} />)

    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
