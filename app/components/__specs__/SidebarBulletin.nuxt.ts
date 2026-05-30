import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { clearNuxtData } from '#app';
import { beforeEach, describe, expect, it } from 'vitest';
import SidebarBulletin from '../SidebarBulletin.vue';

describe('SidebarBulletin', () => {
  // useAsyncData caches by key across mounts; clear it so each test fetches fresh.
  beforeEach(() => clearNuxtData());

  it('shows the current bulletin date linking to its detail page', async () => {
    registerEndpoint('/api/bulletins/current', () => ({ date: '2026-05-17' }));

    const wrapper = await mountSuspended(SidebarBulletin);

    const block = wrapper.find('[data-sidebar-block="bulletin"]');
    expect(block.exists()).toBe(true);
    const link = block.get('a');
    expect(link.attributes('href')).toBe('/bulletins/2026-05-17');
    expect(link.find('time').attributes('datetime')).toBe('2026-05-17');
  });

  it('is omitted entirely when there is no current bulletin', async () => {
    registerEndpoint('/api/bulletins/current', () => ({ date: null }));

    const wrapper = await mountSuspended(SidebarBulletin);

    expect(wrapper.find('[data-sidebar-block="bulletin"]').exists()).toBe(false);
  });
});
