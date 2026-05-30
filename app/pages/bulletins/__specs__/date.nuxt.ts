import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { setResponseStatus, type H3Event } from 'h3';
import { describe, expect, it } from 'vitest';
import type { BulletinDetail } from '~~/shared/bulletin';
import BulletinDetailPage from '../[date].vue';

function buildBulletin(date: string, title: string | null = 'Boletim Dominical'): BulletinDetail {
  return {
    title,
    date,
    article: null,
    liturgy: null,
    announcements: null,
    agenda: null,
    birthdays: null,
  };
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
    registerEndpoint(`/api/bulletins/${date}`, () => buildBulletin(date, null));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    expect(wrapper.find('header h1').text()).toContain('Boletim Semanal');
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
});
