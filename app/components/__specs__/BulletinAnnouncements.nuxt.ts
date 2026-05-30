import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import type { AnnouncementItem } from '~~/shared/announcement';
import BulletinAnnouncements from '../BulletinAnnouncements.vue';

function buildItem(overrides: Partial<AnnouncementItem> = {}): AnnouncementItem {
  return {
    id: 1,
    title: 'Conferência da Fé',
    description: '29 e 30 de maio',
    url: null,
    expires_at: '2026-06-01',
    ...overrides,
  };
}

describe('BulletinAnnouncements', () => {
  it('renders nothing when announcements is null (section disabled)', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, { props: { announcements: null } });
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders section heading when announcements is an empty array', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, { props: { announcements: [] } });
    expect(wrapper.find('h2').text()).toBe('Avisos');
  });

  it('shows placeholder text when announcements is empty', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, { props: { announcements: [] } });
    expect(wrapper.text()).toContain('Nenhum aviso para esta semana.');
  });

  it('renders announcement title and description', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, {
      props: { announcements: [buildItem()] },
    });
    expect(wrapper.text()).toContain('Conferência da Fé');
    expect(wrapper.text()).toContain('29 e 30 de maio');
  });

  it('renders a link when url is present', async () => {
    const wrapper = await mountSuspended(BulletinAnnouncements, {
      props: { announcements: [buildItem({ url: 'https://exemplo.com' })] },
    });
    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://exemplo.com');
  });

  it('renders multiple announcements', async () => {
    const items = [buildItem({ id: 1, title: 'Aviso A' }), buildItem({ id: 2, title: 'Aviso B' })];
    const wrapper = await mountSuspended(BulletinAnnouncements, { props: { announcements: items } });
    expect(wrapper.findAll('.bulletin-announcement')).toHaveLength(2);
  });
});
