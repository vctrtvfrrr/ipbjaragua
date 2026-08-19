import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MeetingMinuteYearNav } from './MeetingMinuteYearNav'

describe('MeetingMinuteYearNav', () => {
  it('names the year each link leads to', () => {
    render(<MeetingMinuteYearNav previousYear={2021} nextYear={2023} />)

    expect(screen.getByRole('link', { name: 'Atas de 2021' })).toHaveAttribute(
      'href',
      '/admin/meeting-minutes?year=2021'
    )
    expect(screen.getByRole('link', { name: 'Atas de 2023' })).toHaveAttribute(
      'href',
      '/admin/meeting-minutes?year=2023'
    )
    expect(screen.getByText('2021')).toBeInTheDocument()
    expect(screen.getByText('2023')).toBeInTheDocument()
  })

  it('omits the direction that has no year left', () => {
    const { rerender } = render(<MeetingMinuteYearNav previousYear={null} nextYear={2020} />)

    expect(screen.queryByRole('link', { name: 'Atas de 2019' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Atas de 2020' })).toBeInTheDocument()

    rerender(<MeetingMinuteYearNav previousYear={2025} nextYear={null} />)

    expect(screen.getByRole('link', { name: 'Atas de 2025' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Atas de 2026' })).toBeNull()
  })

  it('renders nothing when there is a single year to show', () => {
    render(<MeetingMinuteYearNav previousYear={null} nextYear={null} />)

    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
