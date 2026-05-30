import { defineOgImageComponent as raw } from '#imports';

// nuxt-og-image registers `defineOgImageComponent` as a Nuxt auto-import. This project
// disables auto-imports, and importing it from '#imports' directly inside a page breaks
// the page macro transform — so we re-export it through this (non-page) module and pages
// import it from here.
//
// In the unit-test environment the import is stripped (the OG runtime isn't available),
// leaving `raw` undeclared. `typeof` is the one reference that's safe on an undeclared
// binding (returns 'undefined' instead of throwing), so we guard the call with it:
// a no-op under test, the real OG image definition in dev/build. The wrapper also widens
// `component` to `string` so our custom template name ('Default') type-checks.
export function defineOgImageComponent(component: string, props: Record<string, unknown>): void {
  if (typeof raw !== 'function') return;
  (raw as unknown as (component: string, props: Record<string, unknown>) => void)(component, props);
}
