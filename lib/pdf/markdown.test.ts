import { describe, expect, it, vi } from 'vitest'
import { renderMarkdownToHtml } from './markdown'
import { RemoteImageError } from './remote-image'

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

  it('refuses a link that would execute script', async () => {
    const html = await renderMarkdownToHtml('[clique](javascript:alert(1))')

    expect(html).not.toContain('javascript:')
  })
})
