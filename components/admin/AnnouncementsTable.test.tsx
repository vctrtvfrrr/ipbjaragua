import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Announcement } from '@/db/queries/announcements'
import { AnnouncementsTable } from './AnnouncementsTable'

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 1,
    title: 'Ensaio do coral',
    description: 'Descrição',
    url: null,
    icon: 'Pin',
    flyer_path: null,
    starts_at: new Date('2026-06-01T00:00:00Z'),
    expires_at: new Date('2026-07-12T00:00:00Z'),
    created_at: '',
    updated_at: '',
    deleted_at: null,
    ...overrides,
  }
}

describe('AnnouncementsTable', () => {
  it('shows a dash when there is no flyer', () => {
    render(
      <AnnouncementsTable
        announcements={[makeAnnouncement()]}
        todayDate={new Date('2026-07-01T00:00:00Z')}
        canUpdate={true}
        canDelete={true}
      />
    )

    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.queryByRole('link', { name: '' })).not.toBeInTheDocument()
  })

  it('links the thumbnail to the full flyer in a new tab', () => {
    render(
      <AnnouncementsTable
        announcements={[makeAnnouncement({ flyer_path: `${'a'.repeat(48)}.png` })]}
        todayDate={new Date('2026-07-01T00:00:00Z')}
        canUpdate={true}
        canDelete={true}
      />
    )

    const link = screen.getAllByRole('link').find((element) => element.getAttribute('target') === '_blank')
    expect(link).toHaveAttribute('href', `/media/announcement-flyers/${'a'.repeat(48)}.png`)
  })

  it.each([
    ['Agendado', '2026-08-01', '2026-08-31'],
    ['Vigente', '2026-06-01', '2026-07-12'],
    ['Expirado', '2026-05-01', '2026-06-30'],
  ])('labels a window that is %s', (status, starts_at, expires_at) => {
    render(
      <AnnouncementsTable
        announcements={[
          makeAnnouncement({
            starts_at: new Date(`${starts_at}T00:00:00Z`),
            expires_at: new Date(`${expires_at}T00:00:00Z`),
          }),
        ]}
        todayDate={new Date('2026-07-01T00:00:00Z')}
        canUpdate={true}
        canDelete={true}
      />
    )

    expect(screen.getByText(status)).toBeInTheDocument()
  })

  it('shows both ends of the display window', () => {
    render(
      <AnnouncementsTable
        announcements={[makeAnnouncement()]}
        todayDate={new Date('2026-07-01T00:00:00Z')}
        canUpdate={true}
        canDelete={true}
      />
    )

    expect(screen.getByText('01 de junho de 2026')).toBeInTheDocument()
    expect(screen.getByText('12 de julho de 2026')).toBeInTheDocument()
  })

  it('renders the announcement icon next to the title', () => {
    const { container } = render(
      <AnnouncementsTable
        announcements={[makeAnnouncement({ icon: 'Megaphone', title: 'Culto especial' })]}
        todayDate={new Date('2026-07-01T00:00:00Z')}
        canUpdate={true}
        canDelete={true}
      />
    )

    expect(screen.getByText('Culto especial')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
