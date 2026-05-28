import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { setResponseStatus, type H3Event } from 'h3';
import { describe, expect, it } from 'vitest';
import type { LiturgyDetail } from '~~/shared/liturgy';
import SlugPage from '../[slug].vue';

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
 * Each test uses a unique slug so its registered endpoints don't leak into others
 * (registerEndpoint registrations persist across tests).
 */
function fail(event: H3Event, status: number) {
  setResponseStatus(event, status);
  return { message: 'erro' };
}

describe('pages/[slug]', () => {
  it('renders the bulletin content and liturgy section on success', async () => {
    const slug = '2026-05-17';
    registerEndpoint(`/api/bulletins/${slug}`, () => buildBulletin(slug));
    registerEndpoint(`/api/liturgies/${slug}`, () => buildLiturgy(slug));

    const wrapper = await mountSuspended(SlugPage, { route: `/${slug}` });

    expect(wrapper.find('header h1').exists()).toBe(true);
    expect(wrapper.find('.bulletin-content').exists()).toBe(true);
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('shows an error block with a retry button when the bulletin request fails', async () => {
    const slug = 'boletim-erro';
    registerEndpoint(`/api/bulletins/${slug}`, (event) => fail(event, 500));
    registerEndpoint(`/api/liturgies/${slug}`, () => buildLiturgy(slug));

    const wrapper = await mountSuspended(SlugPage, { route: `/${slug}` });

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Não foi possível carregar o boletim.');
    expect(alert.find('button').text()).toBe('Tentar novamente');
    expect(wrapper.find('.bulletin-content').exists()).toBe(false);
  });

  it('hides the liturgy section without an error when the liturgy is missing (404)', async () => {
    const slug = 'sem-liturgia';
    registerEndpoint(`/api/bulletins/${slug}`, () => buildBulletin(slug));
    registerEndpoint(`/api/liturgies/${slug}`, (event) => fail(event, 404));

    const wrapper = await mountSuspended(SlugPage, { route: `/${slug}` });

    expect(wrapper.find('.bulletin-content').exists()).toBe(true);
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('shows an inline liturgy error with retry when the liturgy request fails (500)', async () => {
    const slug = 'liturgia-erro';
    registerEndpoint(`/api/bulletins/${slug}`, () => buildBulletin(slug));
    registerEndpoint(`/api/liturgies/${slug}`, (event) => fail(event, 500));

    const wrapper = await mountSuspended(SlugPage, { route: `/${slug}` });

    expect(wrapper.find('.bulletin-content').exists()).toBe(true);
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(false);
    const alert = wrapper.find('.bulletin-content [role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Não foi possível carregar a liturgia.');
  });
});
