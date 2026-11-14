import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import KeepOneLiturgyActOpen from './KeepOneLiturgyActOpen'

const ACTS = ['Adoração', 'Confissão', 'Edificação']

let scrolled: { element: Element; options?: ScrollIntoViewOptions }[]
let prefersReducedMotion: boolean

function renderActs() {
  render(
    <>
      <KeepOneLiturgyActOpen listId="liturgy-acts" />
      <ol id="liturgy-acts">
        {ACTS.map((name, i) => (
          <li key={name} id={`ato-${i + 1}`}>
            <details open={i === 0}>
              <summary>
                <h2>{name}</h2>
              </summary>
              <p>Momentos de {name}</p>
            </details>
          </li>
        ))}
      </ol>
    </>
  )
}

function details(name: string) {
  return screen.getByRole('heading', { name }).closest('details')!
}

function summary(name: string) {
  return screen.getByRole('heading', { name }).closest('summary')!
}

async function nextFrame() {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
}

beforeEach(() => {
  scrolled = []
  prefersReducedMotion = false
  Element.prototype.scrollIntoView = function (options?: ScrollIntoViewOptions | boolean) {
    scrolled.push({ element: this, options: typeof options === 'object' ? options : undefined })
  }
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion,
  })) as unknown as typeof window.matchMedia
  history.replaceState(null, '', '/liturgies/culto')
})

afterEach(() => {
  history.replaceState(null, '', '/')
})

describe('KeepOneLiturgyActOpen', () => {
  it('opens and scrolls to the Ato named by the URL hash', async () => {
    history.replaceState(null, '', '/liturgies/culto#ato-3')

    renderActs()
    await nextFrame()

    expect(details('Edificação').open).toBe(true)
    expect(details('Adoração').open).toBe(false)
    expect(scrolled.map(({ element }) => element)).toEqual([summary('Edificação')])
  })

  it('opens the Ato of a link followed from the page itself', async () => {
    renderActs()

    history.pushState(null, '', '/liturgies/culto#ato-2')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await nextFrame()

    expect(details('Confissão').open).toBe(true)
    expect(details('Adoração').open).toBe(false)
    expect(scrolled.map(({ element }) => element)).toEqual([summary('Confissão')])
  })

  it.each(['#ato-0', '#ato-4', '#ato-x', '#outra-coisa'])('keeps the first Ato open for the hash %s', async (hash) => {
    history.replaceState(null, '', `/liturgies/culto${hash}`)

    renderActs()
    await nextFrame()

    expect(details('Adoração').open).toBe(true)
    expect(details('Edificação').open).toBe(false)
    expect(scrolled).toEqual([])
  })

  it('names the opened Ato in the hash without adding a history entry, and scrolls to it', async () => {
    renderActs()
    const entries = history.length

    fireEvent.click(screen.getByRole('heading', { name: 'Confissão' }))
    await nextFrame()

    expect(window.location.hash).toBe('#ato-2')
    expect(history.length).toBe(entries)
    expect(details('Adoração').open).toBe(false)
    expect(scrolled).toEqual([{ element: summary('Confissão'), options: { behavior: 'smooth', block: 'start' } }])
  })

  it('jumps instead of gliding when the reader prefers reduced motion', async () => {
    prefersReducedMotion = true
    renderActs()

    fireEvent.click(screen.getByRole('heading', { name: 'Confissão' }))
    await nextFrame()

    expect(scrolled.map(({ options }) => options?.behavior)).toEqual(['auto'])
  })
})
