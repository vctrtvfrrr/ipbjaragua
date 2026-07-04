import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SlugField } from './SlugField'

function slugInput() {
  return screen.getByLabelText('Slug') as HTMLInputElement
}

describe('SlugField', () => {
  it('autofills the slug from the title while untouched', () => {
    const { rerender } = render(<SlugField title="Graça Soberana" />)
    expect(slugInput().value).toBe('graca-soberana')

    rerender(<SlugField title="Nova Graça" />)
    expect(slugInput().value).toBe('nova-graca')
  })

  it('freezes an existing slug against title changes', () => {
    const { rerender } = render(<SlugField title="Original" defaultValue="original" />)
    rerender(<SlugField title="Título Editado" defaultValue="original" />)

    expect(slugInput().value).toBe('original')
  })

  it('resumes autofill once the slug is cleared', () => {
    render(<SlugField title="Título Editado" defaultValue="original" />)

    fireEvent.change(slugInput(), { target: { value: '' } })

    expect(slugInput().value).toBe('titulo-editado')
  })
})
