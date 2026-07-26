import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnnouncementIconPicker } from './AnnouncementIconPicker'

describe('AnnouncementIconPicker', () => {
  it('posts Pin by default and exposes the catalog in a popover', async () => {
    const { container } = render(<AnnouncementIconPicker />)

    expect(container.querySelector('input[name="icon"]')).toHaveValue('Pin')
    fireEvent.click(screen.getByRole('button', { name: 'Ícone selecionado: Geral' }))
    expect(await screen.findByRole('radio', { name: 'Comunicado' })).toBeVisible()
  })

  it('posts a selected icon and closes the popover', async () => {
    const { container } = render(<AnnouncementIconPicker />)

    fireEvent.click(screen.getByRole('button', { name: 'Ícone selecionado: Geral' }))
    fireEvent.click(await screen.findByRole('radio', { name: 'Igreja' }))

    expect(container.querySelector('input[name="icon"]')).toHaveValue('Church')
    expect(screen.queryByRole('radio', { name: 'Igreja' })).not.toBeInTheDocument()
  })

  it('starts with the saved icon when editing', () => {
    const { container } = render(<AnnouncementIconPicker defaultValue="Megaphone" />)

    expect(container.querySelector('input[name="icon"]')).toHaveValue('Megaphone')
    expect(screen.getByRole('button', { name: 'Ícone selecionado: Comunicado' })).toBeVisible()
  })

  it('moves focus with arrow keys without changing the posted value', async () => {
    const { container } = render(<AnnouncementIconPicker />)
    fireEvent.click(screen.getByRole('button', { name: 'Ícone selecionado: Geral' }))
    const selected = await screen.findByRole('radio', { name: 'Geral' })

    fireEvent.keyDown(selected, { key: 'ArrowRight' })

    expect(screen.getByRole('radio', { name: 'Calendário' })).toHaveFocus()
    expect(container.querySelector('input[name="icon"]')).toHaveValue('Pin')
  })
})
