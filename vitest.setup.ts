import '@testing-library/jest-dom/vitest'

window.matchMedia ??= ((query: string) =>
  ({ matches: false, media: query }) as MediaQueryList) as typeof window.matchMedia
Element.prototype.scrollIntoView ??= () => {}
