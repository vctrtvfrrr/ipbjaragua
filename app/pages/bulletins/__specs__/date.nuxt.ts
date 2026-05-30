import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { setResponseStatus, type H3Event } from 'h3';
import { describe, expect, it } from 'vitest';
import type { LiturgyDetail } from '~~/shared/liturgy';
import BulletinDetailPage from '../[date].vue';

type BulletinResponse = {
  title: string;
  date: string;
  sections: { article: string; weekly_agenda: string; announcements: string; birthdays: string };
};

function buildBulletin(date: string): BulletinResponse {
  return {
    title: 'Boletim',
    date,
    sections: {
      article: '<p>Artigo</p>',
      weekly_agenda: '<p>Agenda</p>',
      announcements: '<p>Anúncios</p>',
      birthdays: '<p>Aniversários</p>',
    },
  };
}

function buildLiturgy(date: string): LiturgyDetail {
  return {
    id: 1,
    date,
    theme: 'Cristo, Nossa Páscoa',
    acts: [{ position: 1, name: 'Abertura', moments: [{ position: 1, type: 'prayer', description: 'Invocação' }] }],
  };
}

/**
 * Each test uses a unique date so its registered endpoints don't leak into others
 * (registerEndpoint registrations persist across tests).
 */
function fail(event: H3Event, status: number) {
  setResponseStatus(event, status);
  return { message: 'erro' };
}

describe('pages/bulletins/[date]', () => {
  it('renders the bulletin content and liturgy section on success', async () => {
    const date = '2026-05-17';
    registerEndpoint(`/api/bulletins/${date}`, () => buildBulletin(date));
    registerEndpoint(`/api/liturgies/${date}`, () => buildLiturgy(date));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    expect(wrapper.find('header h1').exists()).toBe(true);
    expect(wrapper.find('.bulletin-content').exists()).toBe(true);
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('shows an error block with a retry button when the bulletin request fails', async () => {
    const date = 'boletim-erro';
    registerEndpoint(`/api/bulletins/${date}`, (event) => fail(event, 500));
    registerEndpoint(`/api/liturgies/${date}`, () => buildLiturgy(date));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Não foi possível carregar o boletim.');
    expect(alert.find('button').text()).toBe('Tentar novamente');
    expect(wrapper.find('.bulletin-content').exists()).toBe(false);
  });

  it('hides the liturgy section without an error when the liturgy is missing (404)', async () => {
    const date = 'sem-liturgia';
    registerEndpoint(`/api/bulletins/${date}`, () => buildBulletin(date));
    registerEndpoint(`/api/liturgies/${date}`, (event) => fail(event, 404));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    expect(wrapper.find('.bulletin-content').exists()).toBe(true);
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('shows an inline liturgy error with retry when the liturgy request fails (500)', async () => {
    const date = 'liturgia-erro';
    registerEndpoint(`/api/bulletins/${date}`, () => buildBulletin(date));
    registerEndpoint(`/api/liturgies/${date}`, (event) => fail(event, 500));

    const wrapper = await mountSuspended(BulletinDetailPage, { route: `/bulletins/${date}` });

    expect(wrapper.find('.bulletin-content').exists()).toBe(true);
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(false);
    const alert = wrapper.find('.bulletin-content [role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Não foi possível carregar a liturgia.');
  });
});
