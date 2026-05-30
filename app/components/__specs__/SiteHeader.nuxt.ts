import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import SiteHeader from '../SiteHeader.vue';

describe('SiteHeader', () => {
  it('links the church name to the home page', async () => {
    const wrapper = await mountSuspended(SiteHeader);
    const link = wrapper.get('a');
    expect(link.text()).toContain('IPB de Jaguará do Sul');
    expect(link.attributes('href')).toBe('/');
  });
});
