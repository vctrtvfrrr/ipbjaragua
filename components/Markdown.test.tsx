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

  it('does not render raw HTML', () => {
    render(<Markdown content={'Antes <span data-testid="raw-html">perigo</span> depois'} />)

    expect(screen.queryByTestId('raw-html')).not.toBeInTheDocument()
    expect(screen.getByText(/<span data-testid="raw-html">perigo<\/span>/)).toBeInTheDocument()
  })
})
