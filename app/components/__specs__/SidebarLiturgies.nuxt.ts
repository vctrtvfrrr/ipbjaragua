import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { clearNuxtData } from '#app';
import { beforeEach, describe, expect, it } from 'vitest';
import type { LiturgyListItem, LiturgyListResponse } from '~~/shared/liturgy';
import SidebarLiturgies from '../SidebarLiturgies.vue';

function item(over: Partial<LiturgyListItem> & { id: number; date: string }): LiturgyListItem {
  return { theme: 'Tema do Culto', ...over };
}

function registerLiturgies(items: LiturgyListItem[]) {
  registerEndpoint(
    '/api/liturgies',
    (): LiturgyListResponse => ({ data: items, pagination: { page: 1, limit: 5, total: items.length } }),
  );
}

describe('SidebarLiturgies', () => {
  beforeEach(() => clearNuxtData());

  it('lists recent liturgies with date and theme, linking to the detail page', async () => {
    registerLiturgies([
      item({ id: 1, date: '2026-05-17', theme: 'Cristo, Nossa Páscoa' }),
      item({ id: 2, date: '2026-05-10', theme: 'A Graça' }),
    ]);

    const wrapper = await mountSuspended(SidebarLiturgies);

    const block = wrapper.find('[data-sidebar-block="liturgies"]');
    expect(block.exists()).toBe(true);
    const links = block.findAll('a');
    expect(links[0]?.attributes('href')).toBe('/liturgies/2026-05-17');
    expect(links[0]?.text()).toContain('Cristo, Nossa Páscoa');
    expect(links[1]?.attributes('href')).toBe('/liturgies/2026-05-10');
  });

  it('falls back to "Liturgia do Culto" when the theme is blank', async () => {
    registerLiturgies([item({ id: 1, date: '2026-05-17', theme: '' })]);

    const wrapper = await mountSuspended(SidebarLiturgies);

    expect(wrapper.find('[data-sidebar-block="liturgies"]').text()).toContain('Liturgia do Culto');
  });

  it('is omitted entirely when there are no liturgies', async () => {
    registerLiturgies([]);

    const wrapper = await mountSuspended(SidebarLiturgies);

    expect(wrapper.find('[data-sidebar-block="liturgies"]').exists()).toBe(false);
  });
});
