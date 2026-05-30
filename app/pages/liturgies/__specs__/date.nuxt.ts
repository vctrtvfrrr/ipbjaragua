import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { setResponseStatus, type H3Event } from 'h3';
import { describe, expect, it } from 'vitest';
import type { LiturgyDetail } from '~~/shared/liturgy';
import LiturgyDetailPage from '../[date].vue';

function buildLiturgy(date: string, theme: string): LiturgyDetail {
  return {
    id: 1,
    date,
    theme,
    acts: [
      {
        position: 1,
        name: 'Abertura',
        moments: [{ position: 1, type: 'prayer', description: 'Invocação' }],
      },
    ],
  };
}

function fail(event: H3Event, status: number) {
  setResponseStatus(event, status);
  return { message: 'erro' };
}

describe('pages/liturgies/[date]', () => {
  it('renders the date and the liturgy tree reusing BulletinLiturgy', async () => {
    const date = '2026-05-17';
    registerEndpoint(`/api/liturgies/${date}`, () => buildLiturgy(date, 'Cristo, Nossa Páscoa'));

    const wrapper = await mountSuspended(LiturgyDetailPage, { route: `/liturgies/${date}` });

    expect(wrapper.find('time').attributes('datetime')).toBe(date);
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(true);
    expect(wrapper.find('section.bulletin-liturgy h2').text()).toBe('Cristo, Nossa Páscoa');
    expect(wrapper.findAll('section.bulletin-liturgy h3').map((h) => h.text())).toEqual(['Abertura']);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('falls back to "Liturgia do Culto" when the theme is blank', async () => {
    const date = '2026-05-24';
    registerEndpoint(`/api/liturgies/${date}`, () => buildLiturgy(date, ''));

    const wrapper = await mountSuspended(LiturgyDetailPage, { route: `/liturgies/${date}` });

    expect(wrapper.find('section.bulletin-liturgy h2').text()).toBe('Liturgia do Culto');
  });

  it('shows a not-found message when the liturgy does not exist (404)', async () => {
    const date = '2026-01-01';
    registerEndpoint(`/api/liturgies/${date}`, (event) => fail(event, 404));

    const wrapper = await mountSuspended(LiturgyDetailPage, { route: `/liturgies/${date}` });

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Liturgia não encontrada');
    expect(wrapper.find('section.bulletin-liturgy').exists()).toBe(false);
  });
});
