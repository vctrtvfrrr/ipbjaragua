import { fileURLToPath } from 'node:url';
import { $fetch, setup } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';

// Boots a real Nuxt SSR server (Nuxt UI active) and asserts that a U* component
// is rendered server-side — the foundation smoke test for the Nuxt UI adoption.
describe('Nuxt UI SSR smoke', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/ui-smoke', import.meta.url)),
  });

  it('server-renders a U* component into the HTML response', async () => {
    const html = await $fetch('/');

    expect(html).toContain('Smoke');
    expect(html).toMatch(/<button[^>]*>/);
  });
});
