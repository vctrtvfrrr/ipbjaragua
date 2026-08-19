import { describe, expect, it, vi } from 'vitest'
import { renderMarkdownToHtml } from './markdown'
import { createImageBudget, MAX_DOCUMENT_IMAGES, RemoteImageError } from './remote-image'

vi.mock('./remote-image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./remote-image')>()),
  fetchRemoteImageDataUri: vi.fn(async (url: string) => {
    if (url.includes('blocked')) throw new RemoteImageError(url, 'o destino não é um endereço público')
    return 'data:image/png;base64,AAAA'
  }),
}))

describe('renderMarkdownToHtml', () => {
  it('renders the formatting the editor offers', async () => {
    const html = await renderMarkdownToHtml(
      ['- **Pastor João**', '- _Presbítero Pedro_', '', '| Cargo | Nome |', '| --- | --- |', '| Diácono | Ana |'].join(
        '\n'
      )
    )

    expect(html).toContain('<strong>Pastor João</strong>')
    expect(html).toContain('<em>Presbítero Pedro</em>')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>Diácono</td>')
  })

  it('keeps arbitrary HTML out of the document', async () => {
    const html = await renderMarkdownToHtml('<script>alert(1)</script>\n\n<b>negrito</b>')

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>')
  })

  it('carries images as inlined bytes so the render needs no network', async () => {
    const html = await renderMarkdownToHtml('![Fachada](https://exemplo.org/fachada.png)')

    expect(html).toContain('src="data:image/png;base64,AAAA"')
    expect(html).toContain('alt="Fachada"')
  })

  it('fails the whole document when an image cannot be fetched', async () => {
    await expect(renderMarkdownToHtml('![Interno](https://blocked.example/x.png)')).rejects.toThrow(RemoteImageError)
  })

  it('refuses to inline more images than one document may hold', async () => {
    const images = Array.from(
      { length: MAX_DOCUMENT_IMAGES + 1 },
      (_, index) => `![${index}](https://exemplo.org/${index}.png)`
    ).join('\n\n')

    await expect(renderMarkdownToHtml(images)).rejects.toThrow('mais imagens do que o permitido')
  })

  it('spends a single budget across every field of the same document', async () => {
    const budget = createImageBudget()

    await renderMarkdownToHtml('![a](https://exemplo.org/a.png)', budget)
    await renderMarkdownToHtml('![b](https://exemplo.org/b.png)', budget)

    expect(budget.remainingImages).toBe(MAX_DOCUMENT_IMAGES - 2)
    expect(budget.remainingBytes).toBeLessThan(createImageBudget().remainingBytes)
  })

  it('refuses a link that would execute script', async () => {
    const html = await renderMarkdownToHtml('[clique](javascript:alert(1))')

    expect(html).not.toContain('javascript:')
  })
})
