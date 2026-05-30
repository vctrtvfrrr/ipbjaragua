import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { clearNuxtData } from '#app';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AnnouncementItem, AnnouncementListResponse } from '~~/shared/announcement';
import SidebarAnnouncements from '../SidebarAnnouncements.vue';

function item(n: number, over: Partial<AnnouncementItem> = {}): AnnouncementItem {
  return { id: n, title: `Aviso ${n}`, description: `Descrição ${n}.`, url: null, expires_at: '2026-06-01', ...over };
}

function registerActive(items: AnnouncementItem[]) {
  registerEndpoint(
    '/api/announcements',
    (): AnnouncementListResponse => ({ data: items, pagination: { page: 1, limit: 10, total: items.length } }),
  );
}

describe('SidebarAnnouncements', () => {
  beforeEach(() => clearNuxtData());

  it('lists active announcements with title and full description, preserving order', async () => {
    registerActive([item(1), item(2)]);

    const wrapper = await mountSuspended(SidebarAnnouncements);

    const block = wrapper.find('[data-sidebar-block="announcements"]');
    expect(block.exists()).toBe(true);
    expect(block.text()).toContain('Aviso 1');
    expect(block.text()).toContain('Descrição 1.');
    expect(block.text()).toContain('Aviso 2');
    const titles = block.findAll('h3').map((h) => h.text());
    expect(titles).toEqual(['Aviso 1', 'Aviso 2']);
  });

  it('shows an "Acesse" CTA pointing to the url only when present', async () => {
    registerActive([item(1, { url: 'https://example.org/evento' }), item(2, { url: null })]);

    const wrapper = await mountSuspended(SidebarAnnouncements);

    const ctas = wrapper.findAll('a').filter((a) => a.text() === 'Acesse');
    expect(ctas).toHaveLength(1);
    expect(ctas[0]?.attributes('href')).toBe('https://example.org/evento');
  });

  it('is omitted entirely when there are no active announcements', async () => {
    registerActive([]);

    const wrapper = await mountSuspended(SidebarAnnouncements);

    expect(wrapper.find('[data-sidebar-block="announcements"]').exists()).toBe(false);
  });
});
