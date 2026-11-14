import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Markdown from './Markdown'

describe('Markdown', () => {
  it('renders GFM tables as tables', () => {
    render(<Markdown content={'| Nome | Valor |\n| --- | --- |\n| Dízimos | R$ 100 |'} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'R$ 100' })).toBeInTheDocument()
  })

  it('renders a single line break as a line break', () => {
    const { container } = render(<Markdown content={'Rua das Flores, 100\nCentro'} />)

    expect(container.querySelectorAll('p')).toHaveLength(1)
    expect(container.querySelector('p')?.innerHTML).toBe('Rua das Flores, 100<br>\nCentro')
  })

  it('keeps a blank line as a paragraph break', () => {
    const { container } = render(<Markdown content={'Primeiro\n\nSegundo'} />)

    expect(container.querySelectorAll('p')).toHaveLength(2)
    expect(container.querySelector('br')).not.toBeInTheDocument()
  })

  it('does not render raw HTML', () => {
    render(<Markdown content={'Antes <span data-testid="raw-html">perigo</span> depois'} />)

    expect(screen.queryByTestId('raw-html')).not.toBeInTheDocument()
    expect(screen.getByText(/<span data-testid="raw-html">perigo<\/span>/)).toBeInTheDocument()
  })
})
