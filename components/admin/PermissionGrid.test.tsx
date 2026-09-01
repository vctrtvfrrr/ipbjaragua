import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PERMISSION_CATALOG, type Action } from '@/lib/authz'
import { MEETING_MINUTE_BOOK_SLUGS } from '@/lib/meeting-minute-books'
import { PermissionGrid } from './PermissionGrid'

function checkbox(container: HTMLElement, value: string) {
  return container.querySelector<HTMLInputElement>(`input[type="checkbox"][value="${value}"]`)
}

describe('PermissionGrid', () => {
  it('renders one checkbox per declared entity/action/scope triple', () => {
    const { container } = render(<PermissionGrid />)

    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(PERMISSION_CATALOG.length)
  })

  it('gives each Livro of the Ata its own row', () => {
    render(<PermissionGrid />)

    expect(screen.getByText('Atas — Mesa Administrativa')).toBeInTheDocument()
    expect(screen.getAllByText(/^Atas — /)).toHaveLength(MEETING_MINUTE_BOOK_SLUGS.length)
  })

  it('omits checkboxes for actions an entity does not declare', () => {
    const { container } = render(<PermissionGrid />)

    expect(checkbox(container, 'featured_images:update:')).toBeNull()
    expect(checkbox(container, 'featured_images:delete:')).not.toBeNull()
    expect(checkbox(container, 'meeting_minutes:delete:mesa-administrativa')).toBeNull()
    expect(checkbox(container, 'meeting_minutes:update:mesa-administrativa')).not.toBeNull()
    // One gap for Imagens Destacadas (no Editar), one per Livro of Ata (no Excluir).
    expect(screen.getAllByText('Não se aplica')).toHaveLength(1 + MEETING_MINUTE_BOOK_SLUGS.length)
  })

  it('keeps the read implication for a write action of a subset entity', () => {
    const { container } = render(<PermissionGrid />)

    fireEvent.click(checkbox(container, 'featured_images:delete:')!)

    const read = checkbox(container, 'featured_images:read:')!
    expect(read).toBeChecked()
    expect(read).toBeDisabled()
    expect(container.querySelector('input[type="hidden"][value="featured_images:read:"]')).not.toBeNull()
  })

  it('frees the implied read once the last declared write is cleared', () => {
    const { container } = render(<PermissionGrid />)
    const remove = checkbox(container, 'featured_images:delete:')!

    fireEvent.click(remove)
    fireEvent.click(remove)

    expect(checkbox(container, 'featured_images:read:')).not.toBeDisabled()
  })

  it('marks Ler for one Livro only when a write is checked on that same Livro', () => {
    const { container } = render(<PermissionGrid />)

    fireEvent.click(checkbox(container, 'meeting_minutes:update:mesa-administrativa')!)

    expect(checkbox(container, 'meeting_minutes:read:mesa-administrativa')).toBeChecked()
    expect(checkbox(container, 'meeting_minutes:read:secretaria-de-musica')).not.toBeChecked()
  })

  it('locks permissions the current user cannot drop', () => {
    const { container } = render(
      <PermissionGrid lockedPermissions={[{ entity: 'users', action: 'update' as Action, scope: '' }]} />
    )

    const locked = checkbox(container, 'users:update:')!
    expect(locked).toBeChecked()
    expect(locked).toBeDisabled()
  })

  it('shows the field errors it receives', () => {
    render(<PermissionGrid errors={['Escolha ao menos uma permissão.']} />)

    expect(screen.getByText('Escolha ao menos uma permissão.')).toBeVisible()
  })
})
