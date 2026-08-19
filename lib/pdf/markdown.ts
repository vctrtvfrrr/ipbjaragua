import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { MARKDOWN_REMARK_PLUGINS } from '@/lib/markdown-dialect'
import { createImageBudget, fetchRemoteImageDataUri, RemoteImageError, type ImageBudget } from './remote-image'

type HastNode = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

const SAFE_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

// Raw HTML never reaches the tree because remark-rehype is not told to allow it, which is
// also what the editor's preview does: the document renders that dialect, no more.
const processor = unified().use(remarkParse).use(MARKDOWN_REMARK_PLUGINS).use(remarkRehype).use(rehypeStringify)

export async function renderMarkdownToHtml(
  markdown: string,
  budget: ImageBudget = createImageBudget()
): Promise<string> {
  const tree = processor.runSync(processor.parse(markdown)) as HastNode

  const inlined = await inlineImages(collect(tree, imageSource), budget)
  visit(tree, (node) => {
    const source = imageSource(node)
    if (source) node.properties!.src = inlined.get(source)
    else if (node.tagName === 'a') node.properties!.href = safeHref(node.properties?.href)
  })

  return processor.stringify(tree as never)
}

function imageSource(node: HastNode): string | null {
  return node.tagName === 'img' && typeof node.properties?.src === 'string' ? node.properties.src : null
}

function safeHref(href: unknown): string {
  if (typeof href !== 'string') return ''

  try {
    return SAFE_LINK_PROTOCOLS.includes(new URL(href, 'https://ipbjaragua.org.br').protocol) ? href : ''
  } catch {
    return ''
  }
}

function visit(node: HastNode, apply: (node: HastNode) => void): void {
  apply(node)
  for (const child of node.children ?? []) visit(child, apply)
}

function collect(tree: HastNode, pick: (node: HastNode) => string | null): Set<string> {
  const found = new Set<string>()
  visit(tree, (node) => {
    const value = pick(node)
    if (value) found.add(value)
  })

  return found
}

// Chromium never reaches the network during the render, so every image has to be bytes by
// then: one that cannot be fetched must fail the whole document instead of vanishing.
// They are fetched one at a time and against a budget the whole Ata shares, so a document
// cannot hold an unbounded amount of remote content in memory at once.
async function inlineImages(urls: Set<string>, budget: ImageBudget): Promise<Map<string, string>> {
  const inlined = new Map<string, string>()

  for (const url of urls) {
    if (budget.remainingImages < 1) throw new RemoteImageError(url, 'a Ata usa mais imagens do que o permitido')

    const dataUri = await fetchRemoteImageDataUri(url)
    budget.remainingImages -= 1
    budget.remainingBytes -= dataUri.length

    if (budget.remainingBytes < 0) throw new RemoteImageError(url, 'as imagens da Ata somam mais do que o permitido')
    inlined.set(url, dataUri)
  }

  return inlined
}
