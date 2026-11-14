// Waits a frame so the collapse of the previously open section has already moved the
// layout; scrolling earlier lands where the header used to be.
export function scrollToHeader(header: Element | null) {
  requestAnimationFrame(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    header?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  })
}
