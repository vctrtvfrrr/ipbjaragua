import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApproveMeetingMinuteButton } from './ApproveMeetingMinuteButton'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn() } }))
vi.mock('@/app/(admin)/admin/meeting-minutes/form-actions', () => ({
  approveMeetingMinuteFormAction: vi.fn(),
}))

const MINUTE = { id: 7, number: 12, title: 'Reunião ordinária' }

describe('ApproveMeetingMinuteButton', () => {
  it('does not approve before the confirmation is shown', () => {
    render(<ApproveMeetingMinuteButton minute={MINUTE} />)

    expect(screen.queryByRole('button', { name: 'Aprovar definitivamente' })).not.toBeInTheDocument()
  })

  it('confirms with the Número, the Título and the warning that there is no way back', () => {
    render(<ApproveMeetingMinuteButton minute={MINUTE} />)

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))

    const confirmation = screen.getByRole('dialog').textContent
    expect(confirmation).toContain('12ª Ata')
    expect(confirmation).toContain('Reunião ordinária')
    expect(confirmation).toContain('irreversível')
    expect(screen.getByRole('button', { name: 'Aprovar definitivamente' })).toBeEnabled()
  })
})
