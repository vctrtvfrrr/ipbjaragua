import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { setResponseStatus, type H3Event } from 'h3';
import { describe, expect, it } from 'vitest';
import type { AnnouncementItem } from '~~/shared/announcement';
import type { BulletinDetail } from '~~/shared/bulletin';
import BulletinDetailPage from '../[date].vue';

function buildBulletin(date: string, overrides: Partial<BulletinDetail> = {}): BulletinDetail {
  return {
    title: 'Boletim Dominical',
    date,
    article: null,
    liturgy: null,
    announcements: null,
    agenda: null,
    birthdays: null,
    ...overrides,
  };
}

function buildAnnouncement(overrides: Partial<AnnouncementItem> = {}): AnnouncementItem {
  return { id: 1, title: 'Conferência da Fé', description: null, url: null, expires_at: '2026-06-01', ...overrides };
}

function fail(event: H3Event, status: number) {
  setResponseStatus(event, status);
  return { message: 'erro' };
}

describe('pages/bulletins/[date]', () => {
  it('renders the bulletin header with title and date on success', async () => {
    const date = '2026-05-17';
    registerEndpoint(`/api/bulletins/${date}`, () => buildBulletin(date));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    expect(wrapper.find('header h1').exists()).toBe(true);
    expect(wrapper.find('header h1').text()).toContain('Boletim Dominical');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('uses "Boletim Semanal" as fallback when title is null', async () => {
    const date = '2026-05-24';
    registerEndpoint(`/api/bulletins/${date}`, () => buildBulletin(date, { title: null }));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    expect(wrapper.find('header h1').text()).toContain('Boletim Semanal');
  });

  it('shows a 404 message when the bulletin is not found', async () => {
    const date = '2026-01-01';
    registerEndpoint(`/api/bulletins/${date}`, (event) => fail(event, 404));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Boletim não encontrado.');
    expect(alert.find('button').exists()).toBe(false);
    expect(wrapper.find('header').exists()).toBe(false);
  });

  it('shows an error block with a retry button when the bulletin request fails', async () => {
    const date = 'boletim-erro';
    registerEndpoint(`/api/bulletins/${date}`, (event) => fail(event, 500));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Não foi possível carregar o boletim.');
    expect(alert.find('button').text()).toBe('Tentar novamente');
    expect(wrapper.find('header').exists()).toBe(false);
  });

  it('renders the announcements section when present', async () => {
    const date = '2026-05-31';
    registerEndpoint(`/api/bulletins/${date}`, () => buildBulletin(date, { announcements: [buildAnnouncement()] }));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    expect(wrapper.text()).toContain('Conferência da Fé');
  });

  it('does not render the announcements section when announcements is null', async () => {
    const date = '2026-06-07';
    registerEndpoint(`/api/bulletins/${date}`, () => buildBulletin(date, { announcements: null }));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    expect(wrapper.find('.bulletin-content h2').exists()).toBe(false);
  });
});
