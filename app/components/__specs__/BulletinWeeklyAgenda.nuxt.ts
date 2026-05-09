import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import BulletinWeeklyAgenda from '../BulletinWeeklyAgenda.vue';

describe('BulletinWeeklyAgenda', () => {
  it('renders the section heading', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: { html: '<p>Segunda: reunião</p>' },
    });
    expect(wrapper.find('h2').text()).toBe('Agenda Semanal');
  });

  it('renders html content', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: { html: '<p>Segunda: reunião</p>' },
    });
    expect(wrapper.html()).toContain('Segunda: reunião');
  });

  it('applies bulletin-weekly-agenda class to the content wrapper', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: { html: '<p>texto</p>' },
    });
    expect(wrapper.find('.bulletin-weekly-agenda').exists()).toBe(true);
  });

  it('renders nothing when html is empty', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda, {
      props: { html: '' },
    });
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders nothing when html is omitted', async () => {
    const wrapper = await mountSuspended(BulletinWeeklyAgenda);
    expect(wrapper.find('h2').exists()).toBe(false);
  });
});
