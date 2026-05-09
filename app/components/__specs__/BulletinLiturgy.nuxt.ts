import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import BulletinLiturgy from '../BulletinLiturgy.vue';

describe('BulletinLiturgy', () => {
  it('renders the section heading', async () => {
    const wrapper = await mountSuspended(BulletinLiturgy, {
      props: { html: '<p>Hino 123</p>' },
    });
    expect(wrapper.find('h2').text()).toBe('Liturgia do Culto');
  });

  it('renders html content', async () => {
    const wrapper = await mountSuspended(BulletinLiturgy, {
      props: { html: '<p>Hino 123</p>' },
    });
    expect(wrapper.html()).toContain('Hino 123');
  });

  it('applies bulletin-liturgy class to the content wrapper', async () => {
    const wrapper = await mountSuspended(BulletinLiturgy, {
      props: { html: '<p>texto</p>' },
    });
    expect(wrapper.find('.bulletin-liturgy').exists()).toBe(true);
  });

  it('renders nothing when html is empty', async () => {
    const wrapper = await mountSuspended(BulletinLiturgy, {
      props: { html: '' },
    });
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders nothing when html is omitted', async () => {
    const wrapper = await mountSuspended(BulletinLiturgy);
    expect(wrapper.find('h2').exists()).toBe(false);
  });
});
